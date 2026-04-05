import {
  Container,
  FederatedWheelEvent,
  Graphics,
  Rectangle,
  type Texture,
} from "pixi.js";
import { SceneBackdrop } from "@/components/common/SceneBackdrop";
import { ScaledDesignRoot } from "@/components/common/ScaledDesignRoot";
import { MagicWordsDialogueRenderer } from "@/components/scenes/magic/MagicWordsDialogueRenderer";
import {
  ERROR_COLOR,
  PANEL_FILL_COLOR,
  PANEL_STROKE_ALPHA_SCENE,
  PANEL_STROKE_COLOR,
  PANEL_STROKE_WIDTH,
  PANEL_CORNER_RADIUS,
  PANEL_LAYOUT_MAX_HEIGHT,
  PANEL_LAYOUT_MAX_WIDTH,
  SUCCESS_COLOR,
  TEXT_MUTED,
} from "@/constants/app";
import { DESIGN_WIDTH } from "@/constants/designCanvas";
import {
  getMagicWordsPanelFrame,
  MAGIC_WORDS_BACK_BUTTON_H,
  MAGIC_WORDS_BACK_BUTTON_W,
  MAGIC_WORDS_BACK_BUTTON_X,
  MAGIC_WORDS_BACK_BUTTON_Y,
  MAGIC_WORDS_DIALOGUE_INNER_MIN,
  MAGIC_WORDS_DIALOGUE_VIEWPORT_HEIGHT,
  MAGIC_WORDS_MASK_INITIAL_WIDTH,
  MAGIC_WORDS_PANEL_INNER_TRIM,
  MAGIC_WORDS_RELOAD_BUTTON_H,
  MAGIC_WORDS_RELOAD_BUTTON_W,
  MAGIC_WORDS_RELOAD_BUTTON_X,
  MAGIC_WORDS_RELOAD_BUTTON_Y,
  MAGIC_WORDS_STATUS_Y,
  MAGIC_WORDS_SUBTITLE_Y,
  MAGIC_WORDS_TITLE_Y,
  MAGIC_WORDS_VIEWPORT_LEFT_PAD,
  MAGIC_WORDS_VIEWPORT_TOP_PAD,
} from "@/constants/layoutMagicWords";
import {
  createDungeonButton,
  createMutedText,
  createPanel,
  createText,
} from "@/components/common/ui";
import { getMagicWordsData } from "@/services/MagicWordsService";
import {
  clearMagicWordsRemoteTextureCache,
  getMagicWordsRemoteTextureIfCached,
  loadMagicWordsRemoteTexture,
} from "@/services/MagicWordsRemoteTextureCache";
import type {
  MagicWordsResponse,
  SceneContext,
  SceneController,
  ScreenId,
  Size,
} from "@/types/app";

export { MAGIC_WORDS_DIALOGUE_VIEWPORT_HEIGHT } from "@/constants/layoutMagicWords";

export class MagicWordsScene implements SceneController {
  public readonly id: ScreenId = "magic";
  public readonly container = new Container();
  private readonly backdrop: SceneBackdrop;
  private readonly scaled = new ScaledDesignRoot();
  private readonly panel = createPanel(PANEL_LAYOUT_MAX_WIDTH, PANEL_LAYOUT_MAX_HEIGHT);
  private readonly title = createText("Magic Words", 34);
  private readonly subtitle = createMutedText(
    "Dialogue is fetched from the endpoint and rendered with inline emoji sprites.",
  );
  private readonly statusLabel = createText(
    "Loading conversation...",
    18,
    TEXT_MUTED,
  );
  private readonly viewport = new Container();
  private readonly content = new Container();
  private readonly avatarTextures = new Map<string, Texture>();
  private readonly emojiTextures = new Map<string, Texture>();
  private readonly backButton: Container;
  private readonly reloadButton: Container;
  private readonly dialogueRenderer: MagicWordsDialogueRenderer;
  private readonly context: SceneContext;
  private isLoading = false;
  /** When true, the next payload reloads remote avatar/emoji textures (Reload Dialogue). */
  private forceRefreshAssetsNext = false;
  private dialogueInnerWidth = 880;
  private dialogueContentHeight = 0;
  private dialogueScrollY = 0;
  private readonly onDialogueWheel = (event: FederatedWheelEvent): void => {
    event.preventDefault();

    if (this.dialogueContentHeight <= MAGIC_WORDS_DIALOGUE_VIEWPORT_HEIGHT) {
      return;
    }

    this.dialogueScrollY += event.deltaY;
    this.applyDialogueScrollBounds();
  };

  constructor(context: SceneContext) {
    this.context = context;
    this.backdrop = new SceneBackdrop(context.textures.bgMagic);
    this.container.addChild(this.backdrop.view, this.scaled.wrap);
    this.scaled.inner.addChild(
      this.panel,
      this.title,
      this.subtitle,
      this.statusLabel,
      this.viewport,
    );
    this.viewport.addChild(this.content);
    this.title.anchor.set(0.5, 0);
    this.subtitle.anchor.set(0.5, 0);
    this.statusLabel.anchor.set(0.5, 0);

    const mask = new Graphics()
      .rect(0, 0, MAGIC_WORDS_MASK_INITIAL_WIDTH, MAGIC_WORDS_DIALOGUE_VIEWPORT_HEIGHT)
      .fill(0xffffff);

    this.viewport.addChild(mask);
    this.viewport.mask = mask;
    this.viewport.eventMode = "static";
    this.viewport.hitArea = new Rectangle(
      0,
      0,
      MAGIC_WORDS_MASK_INITIAL_WIDTH,
      MAGIC_WORDS_DIALOGUE_VIEWPORT_HEIGHT,
    );
    this.viewport.on("wheel", this.onDialogueWheel);

    this.backButton = createDungeonButton(
      "Back to Hoard",
      MAGIC_WORDS_BACK_BUTTON_W,
      MAGIC_WORDS_BACK_BUTTON_H,
      () => {
        this.context.bus.emit("navigate", "menu");
      },
      this.context.textures,
    );
    this.reloadButton = createDungeonButton(
      "Reload Dialogue",
      MAGIC_WORDS_RELOAD_BUTTON_W,
      MAGIC_WORDS_RELOAD_BUTTON_H,
      () => {
        void this.load({ forceRefresh: true });
      },
      this.context.textures,
    );

    this.backButton.position.set(MAGIC_WORDS_BACK_BUTTON_X, MAGIC_WORDS_BACK_BUTTON_Y);
    this.reloadButton.position.set(
      MAGIC_WORDS_RELOAD_BUTTON_X,
      MAGIC_WORDS_RELOAD_BUTTON_Y,
    );
    this.scaled.inner.addChild(this.backButton, this.reloadButton);

    this.context.bus.on("magicWordsLoaded", async (payload) => {
      await this.handlePayload(payload);
    });
    this.context.bus.on("magicWordsFailed", (message) => {
      this.statusLabel.text = message;
      this.statusLabel.style.fill = ERROR_COLOR;
    });

    this.dialogueRenderer = new MagicWordsDialogueRenderer({
      content: this.content,
      getInnerWidth: () => this.dialogueInnerWidth,
      getAvatarTexture: (name) => this.avatarTextures.get(name),
      getEmojiTexture: (name) => this.emojiTextures.get(name),
    });
  }

  activate(): void {
    this.container.visible = true;

    const { magicWordsData, magicWordsStatus } = this.context.state.getState();

    if (magicWordsData != null) {
      void this.handlePayload(magicWordsData);
      return;
    }

    if (magicWordsStatus === "idle") {
      void this.load();
    }
  }

  deactivate(): void {
    this.container.visible = false;
  }

  resize(size: Size): void {
    this.backdrop.resize(size);
    this.scaled.applyResize(size);

    const { panelWidth, panelHeight, left, top } = getMagicWordsPanelFrame();

    this.dialogueInnerWidth = Math.max(
      MAGIC_WORDS_DIALOGUE_INNER_MIN,
      panelWidth - MAGIC_WORDS_PANEL_INNER_TRIM,
    );
    this.panel.clear();
    this.panel
      .roundRect(0, 0, panelWidth, panelHeight, PANEL_CORNER_RADIUS)
      .fill(PANEL_FILL_COLOR)
      .stroke({
        width: PANEL_STROKE_WIDTH,
        color: PANEL_STROKE_COLOR,
        alpha: PANEL_STROKE_ALPHA_SCENE,
      });
    this.panel.position.set(left, top);
    this.title.position.set(DESIGN_WIDTH / 2, top + MAGIC_WORDS_TITLE_Y);
    this.subtitle.position.set(DESIGN_WIDTH / 2, top + MAGIC_WORDS_SUBTITLE_Y);
    this.statusLabel.position.set(DESIGN_WIDTH / 2, top + MAGIC_WORDS_STATUS_Y);
    this.viewport.position.set(left + MAGIC_WORDS_VIEWPORT_LEFT_PAD, top + MAGIC_WORDS_VIEWPORT_TOP_PAD);
    const maskW = panelWidth - MAGIC_WORDS_PANEL_INNER_TRIM;
    (this.viewport.mask as Graphics)
      .clear()
      .rect(0, 0, maskW, MAGIC_WORDS_DIALOGUE_VIEWPORT_HEIGHT)
      .fill(0xffffff);
    this.viewport.hitArea = new Rectangle(
      0,
      0,
      maskW,
      MAGIC_WORDS_DIALOGUE_VIEWPORT_HEIGHT,
    );
    this.backButton.position.set(MAGIC_WORDS_BACK_BUTTON_X, MAGIC_WORDS_BACK_BUTTON_Y);
    this.reloadButton.position.set(
      MAGIC_WORDS_RELOAD_BUTTON_X,
      MAGIC_WORDS_RELOAD_BUTTON_Y,
    );

    if (this.context.state.getState().magicWordsData) {
      this.renderDialogue(
        this.context.state.getState().magicWordsData as MagicWordsResponse,
      );
    } else {
      this.applyDialogueScrollBounds();
    }
  }

  update(): void {}

  private async load(options?: { forceRefresh?: boolean }): Promise<void> {
    if (this.isLoading) {
      return;
    }

    if (!options?.forceRefresh) {
      const s = this.context.state.getState();

      if (s.magicWordsData != null && s.magicWordsStatus === "success") {
        void this.handlePayload(s.magicWordsData);
        return;
      }
    }

    this.isLoading = true;
    this.statusLabel.text = "Loading conversation...";
    this.statusLabel.style.fill = TEXT_MUTED;
    this.content.removeChildren();

    if (options?.forceRefresh === true) {
      this.forceRefreshAssetsNext = true;
    }

    await getMagicWordsData(this.context.bus, this.context.state, {
      forceRefresh: options?.forceRefresh === true,
    });
    this.isLoading = false;
  }

  private async handlePayload(payload: MagicWordsResponse): Promise<void> {
    const forceAssets = this.forceRefreshAssetsNext;
    this.forceRefreshAssetsNext = false;

    if (forceAssets) {
      clearMagicWordsRemoteTextureCache();
    }

    if (!forceAssets) {
      let allHit = true;

      for (const entry of payload.avatars) {
        if (!getMagicWordsRemoteTextureIfCached(entry.url)) {
          allHit = false;
          break;
        }
      }

      if (allHit) {
        for (const entry of payload.emojies) {
          if (!getMagicWordsRemoteTextureIfCached(entry.url)) {
            allHit = false;
            break;
          }
        }
      }

      if (allHit) {
        this.avatarTextures.clear();
        this.emojiTextures.clear();

        for (const entry of payload.avatars) {
          const texture = getMagicWordsRemoteTextureIfCached(entry.url);

          if (texture) {
            this.avatarTextures.set(entry.name, texture);
          }
        }

        for (const entry of payload.emojies) {
          const texture = getMagicWordsRemoteTextureIfCached(entry.url);

          if (texture) {
            this.emojiTextures.set(entry.name, texture);
          }
        }

        this.statusLabel.text = "Dialogue synced from the endpoint.";
        this.statusLabel.style.fill = SUCCESS_COLOR;
        this.renderDialogue(payload);
        return;
      }
    }

    this.avatarTextures.clear();
    this.emojiTextures.clear();
    this.statusLabel.text = "Loading portraits and inline emojis…";
    this.statusLabel.style.fill = TEXT_MUTED;

    try {
      await Promise.all([
        ...payload.avatars.map(async (entry) => {
          const texture = await loadMagicWordsRemoteTexture(entry.url);

          if (texture) {
            this.avatarTextures.set(entry.name, texture);
          }
        }),
        ...payload.emojies.map(async (entry) => {
          const texture = await loadMagicWordsRemoteTexture(entry.url);

          if (texture) {
            this.emojiTextures.set(entry.name, texture);
          }
        }),
      ]);

      this.statusLabel.text = "Dialogue synced from the endpoint.";
      this.statusLabel.style.fill = SUCCESS_COLOR;
      this.renderDialogue(payload);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load dialogue assets";

      this.statusLabel.text = message;
      this.statusLabel.style.fill = ERROR_COLOR;
    }
  }

  private applyDialogueScrollBounds(): void {
    const maxScroll = Math.max(
      0,
      this.dialogueContentHeight - MAGIC_WORDS_DIALOGUE_VIEWPORT_HEIGHT,
    );

    this.dialogueScrollY = Math.min(
      maxScroll,
      Math.max(0, this.dialogueScrollY),
    );
    this.content.position.y = -this.dialogueScrollY;
  }

  private renderDialogue(payload: MagicWordsResponse): void {
    this.dialogueScrollY = 0;
    this.dialogueContentHeight = this.dialogueRenderer.render(payload);
    this.applyDialogueScrollBounds();
  }
}
