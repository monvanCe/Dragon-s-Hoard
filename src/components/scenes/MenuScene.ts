import { Container, Sprite } from "pixi.js";
import { SceneBackdrop } from "@/components/common/SceneBackdrop";
import { ScaledDesignRoot } from "@/components/common/ScaledDesignRoot";
import {
  createDungeonButton,
  createMutedText,
  createText,
} from "@/components/common/ui";
import { TEXT_MUTED } from "@/constants/colors";
import {
  getMenuRootPosition,
  MENU_BUTTON_ACE_Y,
  MENU_BUTTON_HEIGHT,
  MENU_BUTTON_MAGIC_Y,
  MENU_BUTTON_PHOENIX_Y,
  MENU_BUTTON_WIDTH,
  MENU_FOOTER_Y,
  MENU_PANEL_HEIGHT,
  MENU_PANEL_WIDTH,
  MENU_SUBTITLE_Y,
  MENU_TITLE_Y,
} from "@/constants/layoutMenu";
import type { SceneContext, SceneController, ScreenId, Size } from "@/types/app";

export class MenuScene implements SceneController {
  public readonly id: ScreenId = "menu";
  public readonly container = new Container();
  private readonly backdrop: SceneBackdrop;
  private readonly scaled = new ScaledDesignRoot();
  private readonly root = new Container();
  private readonly panelSprite: Sprite;
  private readonly title = createText("Dragon's Hoard", 40);
  private readonly subtitle = createMutedText(
    "Softgames assignment — pick a trial by flame.",
  );
  private readonly footer = createText(
    "TypeScript · Pixi v8 · Full screen · Event bus",
    16,
    TEXT_MUTED,
  );
  private readonly aceButton: Container;
  private readonly magicButton: Container;
  private readonly phoenixButton: Container;
  private readonly context: SceneContext;

  constructor(context: SceneContext) {
    this.context = context;
    this.backdrop = new SceneBackdrop(context.textures.bgMenu);
    this.panelSprite = new Sprite(context.textures.uiPanelFrame);
    this.panelSprite.anchor.set(0.5);

    this.aceButton = createDungeonButton(
      "Ace of Shadows",
      MENU_BUTTON_WIDTH,
      MENU_BUTTON_HEIGHT,
      () => {
        this.context.bus.emit("navigate", "ace");
      },
      this.context.textures,
    );
    this.magicButton = createDungeonButton(
      "Magic Words",
      MENU_BUTTON_WIDTH,
      MENU_BUTTON_HEIGHT,
      () => {
        this.context.bus.emit("navigate", "magic");
      },
      this.context.textures,
    );
    this.phoenixButton = createDungeonButton(
      "Phoenix Flame",
      MENU_BUTTON_WIDTH,
      MENU_BUTTON_HEIGHT,
      () => {
        this.context.bus.emit("navigate", "phoenix");
      },
      this.context.textures,
    );

    this.container.addChild(this.backdrop.view, this.scaled.wrap);
    this.scaled.inner.addChild(this.root);
    const rootPos = getMenuRootPosition();
    this.root.position.set(rootPos.x, rootPos.y);
    this.root.addChild(
      this.panelSprite,
      this.title,
      this.subtitle,
      this.aceButton,
      this.magicButton,
      this.phoenixButton,
      this.footer,
    );

    this.title.anchor.set(0.5, 0);
    this.subtitle.anchor.set(0.5, 0);
    this.footer.anchor.set(0.5, 0);
  }

  activate(): void {
    this.container.visible = true;
  }

  deactivate(): void {
    this.container.visible = false;
  }

  resize(size: Size): void {
    this.backdrop.resize(size);
    this.scaled.applyResize(size);

    this.panelSprite.scale.set(
      MENU_PANEL_WIDTH / this.panelSprite.texture.width,
      MENU_PANEL_HEIGHT / this.panelSprite.texture.height,
    );
    this.title.position.set(0, MENU_TITLE_Y);
    this.subtitle.position.set(0, MENU_SUBTITLE_Y);
    this.aceButton.position.set(0, MENU_BUTTON_ACE_Y);
    this.magicButton.position.set(0, MENU_BUTTON_MAGIC_Y);
    this.phoenixButton.position.set(0, MENU_BUTTON_PHOENIX_Y);
    this.footer.position.set(0, MENU_FOOTER_Y);
  }

  update(): void {}
}
