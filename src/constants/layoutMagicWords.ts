import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
} from "@/constants/designCanvas";
import {
  PANEL_LAYOUT_CANVAS_INSET,
  PANEL_LAYOUT_MAX_HEIGHT,
  PANEL_LAYOUT_MAX_WIDTH,
} from "@/constants/panelChrome";

/** Scroll viewport height (design px). */
export const MAGIC_WORDS_DIALOGUE_VIEWPORT_HEIGHT = 440;

export const MAGIC_WORDS_PANEL_INNER_TRIM = 56;
export const MAGIC_WORDS_VIEWPORT_LEFT_PAD = 28;
export const MAGIC_WORDS_VIEWPORT_TOP_PAD = 136;
export const MAGIC_WORDS_DIALOGUE_INNER_MIN = 260;
export const MAGIC_WORDS_MASK_INITIAL_WIDTH = 864;

export const MAGIC_WORDS_TITLE_Y = 22;
export const MAGIC_WORDS_SUBTITLE_Y = 64;
export const MAGIC_WORDS_STATUS_Y = 98;

export const MAGIC_WORDS_BACK_BUTTON_X = 150;
export const MAGIC_WORDS_BACK_BUTTON_Y = 650;
export const MAGIC_WORDS_RELOAD_BUTTON_X = 370;
export const MAGIC_WORDS_RELOAD_BUTTON_Y = 650;
export const MAGIC_WORDS_BACK_BUTTON_W = 200;
export const MAGIC_WORDS_BACK_BUTTON_H = 58;
export const MAGIC_WORDS_RELOAD_BUTTON_W = 210;
export const MAGIC_WORDS_RELOAD_BUTTON_H = 58;

export function getMagicWordsPanelFrame(): {
  panelWidth: number;
  panelHeight: number;
  left: number;
  top: number;
} {
  const panelWidth = Math.min(
    DESIGN_WIDTH - PANEL_LAYOUT_CANVAS_INSET,
    PANEL_LAYOUT_MAX_WIDTH,
  );
  const panelHeight = Math.min(
    DESIGN_HEIGHT - PANEL_LAYOUT_CANVAS_INSET,
    PANEL_LAYOUT_MAX_HEIGHT,
  );
  const left = (DESIGN_WIDTH - panelWidth) / 2;
  const top = (DESIGN_HEIGHT - panelHeight) / 2;

  return { panelWidth, panelHeight, left, top };
}
