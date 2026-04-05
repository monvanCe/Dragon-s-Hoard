import { Container, Graphics, Sprite, Text } from "pixi.js";
import { ACCENT_GOLD, TEXT_MUTED, TEXT_PRIMARY } from "@/constants/colors";
import {
  PANEL_CORNER_RADIUS,
  PANEL_FILL_COLOR,
  PANEL_STROKE_ALPHA_KIT,
  PANEL_STROKE_COLOR,
  PANEL_STROKE_WIDTH,
} from "@/constants/panelChrome";
import {
  FONT_FAMILY_UI,
  FONT_SIZE_BUTTON_LABEL,
  FONT_SIZE_MUTED,
  FONT_WEIGHT_TITLE,
  TEXT_SHADOW_BUTTON,
  TEXT_SHADOW_TITLE,
} from "@/constants/typography";
import type { AppTextures } from "@/types/app";

/**
 * Creates a rounded panel with a border.
 *
 * @param width Panel width.
 * @param height Panel height.
 * @returns Panel graphics instance.
 */
export function createPanel(width: number, height: number): Graphics {
  return new Graphics()
    .roundRect(0, 0, width, height, PANEL_CORNER_RADIUS)
    .fill(PANEL_FILL_COLOR)
    .stroke({
      width: PANEL_STROKE_WIDTH,
      color: PANEL_STROKE_COLOR,
      alpha: PANEL_STROKE_ALPHA_KIT,
    });
}

/**
 * Creates a title text element.
 *
 * @param value Title string.
 * @param size Font size.
 * @param tint Text fill color.
 * @returns Text instance.
 */
export function createText(
  value: string,
  size: number,
  tint = TEXT_PRIMARY,
): Text {
  return new Text({
    text: value,
    style: {
      fill: tint,
      fontFamily: FONT_FAMILY_UI,
      fontSize: size,
      fontWeight: FONT_WEIGHT_TITLE,
      dropShadow: { ...TEXT_SHADOW_TITLE },
    },
  });
}

/**
 * Creates a smaller label text element.
 *
 * @param value Label string.
 * @returns Text instance.
 */
export function createMutedText(value: string): Text {
  return new Text({
    text: value,
    style: {
      fill: TEXT_MUTED,
      fontFamily: FONT_FAMILY_UI,
      fontSize: FONT_SIZE_MUTED,
    },
  });
}

/**
 * Creates a themed button using baked UI textures.
 *
 * @param label Button label.
 * @param width Target width in pixels.
 * @param height Target height in pixels.
 * @param onTap Click handler.
 * @param textures Button texture pair.
 * @returns Interactive container centered on its position.
 */
export function createDungeonButton(
  label: string,
  width: number,
  height: number,
  onTap: () => void,
  textures: Pick<AppTextures, "uiButtonIdle" | "uiButtonHover">,
): Container {
  const container = new Container();
  const background = new Sprite(textures.uiButtonIdle);

  background.anchor.set(0.5);
  background.scale.set(
    width / background.texture.width,
    height / background.texture.height,
  );

  const text = new Text({
    text: label,
    style: {
      fill: TEXT_PRIMARY,
      fontFamily: FONT_FAMILY_UI,
      fontSize: FONT_SIZE_BUTTON_LABEL,
      fontWeight: FONT_WEIGHT_TITLE,
      dropShadow: { ...TEXT_SHADOW_BUTTON },
    },
  });

  text.anchor.set(0.5);

  container.addChild(background, text);
  container.eventMode = "static";
  container.cursor = "pointer";
  container.on("pointertap", onTap);
  container.on("pointerover", () => {
    background.texture = textures.uiButtonHover;
    text.style.fill = ACCENT_GOLD;
  });
  container.on("pointerout", () => {
    background.texture = textures.uiButtonIdle;
    text.style.fill = TEXT_PRIMARY;
  });

  return container;
}
