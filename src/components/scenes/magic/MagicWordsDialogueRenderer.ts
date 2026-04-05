import {
  CanvasTextMetrics,
  Container,
  Graphics,
  Sprite,
  Text,
  type Texture,
} from "pixi.js";
import {
  DIALOGUE_BODY_PAD_RIGHT,
  DIALOGUE_BODY_PAD_X,
  DIALOGUE_BODY_TOP_OFFSET,
  DIALOGUE_BUBBLE_BODY_BOTTOM_PAD,
  DIALOGUE_BUBBLE_CORNER_RADIUS,
  DIALOGUE_BUBBLE_EDGE_INSET,
  DIALOGUE_BUBBLE_FILL_ALPHA,
  DIALOGUE_BUBBLE_FILL_LEFT,
  DIALOGUE_BUBBLE_FILL_RIGHT,
  DIALOGUE_BUBBLE_GAP_Y,
  DIALOGUE_BUBBLE_MAX_TEXT_WIDTH,
  DIALOGUE_BUBBLE_MIN_HEIGHT,
  DIALOGUE_BUBBLE_SIDE_INSET,
  DIALOGUE_BUBBLE_STROKE_ALPHA,
  DIALOGUE_BUBBLE_STROKE_COLOR,
  DIALOGUE_BUBBLE_STROKE_WIDTH,
  DIALOGUE_EMOJI_FALLBACK_STYLE,
  DIALOGUE_EMOJI_GAP,
  DIALOGUE_EMOJI_INLINE,
  DIALOGUE_INLINE_STYLE,
  DIALOGUE_LINE_STRIDE,
  DIALOGUE_NAME_LABEL_X,
  DIALOGUE_NAME_LABEL_Y,
  DIALOGUE_NAME_STYLE,
  DIALOGUE_AVATAR_SIZE,
  DIALOGUE_AVATAR_X,
  DIALOGUE_AVATAR_Y_RATIO,
} from "@/constants/dialogueLayout";
import { parseMagicWordsMessage } from "@/services/MagicWordsParser";
import type { EmojiEntry, MagicWordsResponse } from "@/types/app";

type PlannedText = {
  kind: "text";
  x: number;
  y: number;
  w: number;
  h: number;
  content: string;
};

type PlannedEmoji = {
  kind: "emoji";
  x: number;
  y: number;
  texture: Texture | null;
  token: string;
};

type PlannedPiece = PlannedText | PlannedEmoji;

/** Injected collaborators — scene owns maps; renderer stays testable and single-purpose (SRP). */
export type MagicWordsDialogueRendererDeps = {
  content: Container;
  getInnerWidth: () => number;
  getAvatarTexture: (name: string) => Texture | undefined;
  getEmojiTexture: (name: string) => Texture | undefined;
};

/**
 * Builds speech bubbles + inline emoji layout for Magic Words (layout only, no loading/network).
 */
export class MagicWordsDialogueRenderer {
  private readonly deps: MagicWordsDialogueRendererDeps;

  constructor(deps: MagicWordsDialogueRendererDeps) {
    this.deps = deps;
  }

  /**
   * Clears `content`, lays out dialogue, returns total scrollable content height.
   */
  render(payload: MagicWordsResponse): number {
    this.deps.content.removeChildren();

    const innerW = this.deps.getInnerWidth();
    let blockY = 0;

    payload.dialogue.forEach((entry) => {
      const bubble = new Container();
      const avatarMeta = payload.avatars.find(
        (avatar) => avatar.name === entry.name,
      );
      const emojiIndex = new Map<string, EmojiEntry>(
        payload.emojies.map((emoji) => [emoji.name, emoji]),
      );
      const avatarTexture = avatarMeta
        ? this.deps.getAvatarTexture(avatarMeta.name)
        : undefined;
      const bubbleWidth = Math.min(
        DIALOGUE_BUBBLE_MAX_TEXT_WIDTH,
        innerW - DIALOGUE_BUBBLE_SIDE_INSET,
      );
      const originX =
        avatarMeta?.position === "right"
          ? innerW - bubbleWidth - DIALOGUE_BUBBLE_EDGE_INSET
          : DIALOGUE_BUBBLE_EDGE_INSET;

      bubble.position.set(originX, blockY);

      const { planned, bodyBottom } = this.planInlineRow(
        entry.text,
        emojiIndex,
        bubbleWidth,
      );
      const bubbleHeight = Math.max(
        DIALOGUE_BUBBLE_MIN_HEIGHT,
        DIALOGUE_BODY_TOP_OFFSET + bodyBottom + DIALOGUE_BUBBLE_BODY_BOTTOM_PAD,
      );

      const bubbleFill =
        avatarMeta?.position === "right"
          ? DIALOGUE_BUBBLE_FILL_RIGHT
          : DIALOGUE_BUBBLE_FILL_LEFT;

      const background = new Graphics()
        .roundRect(
          0,
          0,
          bubbleWidth,
          bubbleHeight,
          DIALOGUE_BUBBLE_CORNER_RADIUS,
        )
        .fill({
          color: bubbleFill,
          alpha: DIALOGUE_BUBBLE_FILL_ALPHA,
        })
        .stroke({
          width: DIALOGUE_BUBBLE_STROKE_WIDTH,
          color: DIALOGUE_BUBBLE_STROKE_COLOR,
          alpha: DIALOGUE_BUBBLE_STROKE_ALPHA,
        });

      const nameLabel = new Text({
        text: entry.name,
        style: DIALOGUE_NAME_STYLE,
      });
      nameLabel.position.set(DIALOGUE_NAME_LABEL_X, DIALOGUE_NAME_LABEL_Y);

      bubble.addChild(background, nameLabel);

      if (avatarTexture) {
        const avatar = new Sprite(avatarTexture);
        avatar.anchor.set(0.5);
        avatar.width = DIALOGUE_AVATAR_SIZE;
        avatar.height = DIALOGUE_AVATAR_SIZE;
        avatar.position.set(
          DIALOGUE_AVATAR_X,
          bubbleHeight * DIALOGUE_AVATAR_Y_RATIO,
        );
        bubble.addChild(avatar);
      }

      const bodyY = DIALOGUE_BODY_TOP_OFFSET;

      for (const piece of planned) {
        if (piece.kind === "text") {
          const text = new Text({
            text: piece.content,
            style: DIALOGUE_INLINE_STYLE,
          });
          text.position.set(piece.x, bodyY + piece.y);
          bubble.addChild(text);
          continue;
        }

        if (piece.texture) {
          const sprite = new Sprite(piece.texture);
          sprite.width = DIALOGUE_EMOJI_INLINE;
          sprite.height = DIALOGUE_EMOJI_INLINE;
          sprite.position.set(piece.x, bodyY + piece.y);
          bubble.addChild(sprite);
        } else {
          const fallback = new Text({
            text: `{${piece.token}}`,
            style: DIALOGUE_EMOJI_FALLBACK_STYLE,
          });
          fallback.position.set(piece.x, bodyY + piece.y);
          bubble.addChild(fallback);
        }
      }

      this.deps.content.addChild(bubble);
      blockY += bubbleHeight + DIALOGUE_BUBBLE_GAP_Y;
    });

    return blockY;
  }

  private planInlineRow(
    rawText: string,
    emojiIndex: Map<string, EmojiEntry>,
    bubbleWidth: number,
  ): { planned: PlannedPiece[]; bodyBottom: number } {
    const segments = parseMagicWordsMessage(rawText);
    const maxX = bubbleWidth - DIALOGUE_BODY_PAD_RIGHT;
    let cursorX = DIALOGUE_BODY_PAD_X;
    let cursorY = 0;
    let lineHeight = DIALOGUE_LINE_STRIDE;
    const planned: PlannedPiece[] = [];

    const measureChunk = (chunk: string): { w: number; h: number } => {
      const metrics = CanvasTextMetrics.measureText(
        chunk,
        DIALOGUE_INLINE_STYLE,
      );

      return { w: metrics.width, h: metrics.height };
    };

    segments.forEach((segment) => {
      if (segment.type === "text") {
        const chunks = segment.value
          .split(/(\s+)/)
          .filter((chunk) => chunk.length > 0);

        chunks.forEach((chunk) => {
          const { w, h } = measureChunk(chunk);

          if (cursorX + w > maxX && cursorX > DIALOGUE_BODY_PAD_X) {
            cursorX = DIALOGUE_BODY_PAD_X;
            cursorY += lineHeight;
            lineHeight = DIALOGUE_LINE_STRIDE;
          }

          planned.push({
            kind: "text",
            x: cursorX,
            y: cursorY,
            w,
            h,
            content: chunk,
          });
          cursorX += w;
          lineHeight = Math.max(lineHeight, h + 4);
        });

        return;
      }

      const token = segment.value;
      const meta = emojiIndex.get(token);
      const texture = meta
        ? (this.deps.getEmojiTexture(meta.name) ?? null)
        : null;
      const slotW = DIALOGUE_EMOJI_INLINE + DIALOGUE_EMOJI_GAP;

      if (cursorX + slotW > maxX && cursorX > DIALOGUE_BODY_PAD_X) {
        cursorX = DIALOGUE_BODY_PAD_X;
        cursorY += lineHeight;
        lineHeight = DIALOGUE_LINE_STRIDE;
      }

      const emojiY = cursorY + (lineHeight - DIALOGUE_EMOJI_INLINE) / 2;

      planned.push({
        kind: "emoji",
        x: cursorX,
        y: emojiY,
        texture,
        token,
      });
      cursorX += slotW;
      lineHeight = Math.max(lineHeight, DIALOGUE_EMOJI_INLINE + 4);
    });

    const bodyBottom = cursorY + lineHeight;

    return { planned, bodyBottom };
  }
}
