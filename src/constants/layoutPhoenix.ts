import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
} from "@/constants/designCanvas";
import {
  PANEL_LAYOUT_CANVAS_INSET,
  PANEL_LAYOUT_MAX_HEIGHT,
  PANEL_LAYOUT_MAX_WIDTH,
} from "@/constants/panelChrome";

export function getPhoenixPanelFrame(): {
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

export const PHOENIX_TITLE_Y = 24;
export const PHOENIX_SUBTITLE_Y = 66;
export const PHOENIX_FOOTER_BOTTOM_OFFSET = 40;
export const PHOENIX_EMITTER_BOTTOM_OFFSET = 110;
export const PHOENIX_BACK_BUTTON_X = 150;
export const PHOENIX_BACK_BUTTON_Y = 650;
export const PHOENIX_BACK_BUTTON_W = 200;
export const PHOENIX_BACK_BUTTON_H = 58;

export const PHOENIX_GLOW_OUTER_OFFSET_Y = 12;
export const PHOENIX_GLOW_OUTER_RX = 120;
export const PHOENIX_GLOW_OUTER_RY = 38;
export const PHOENIX_GLOW_OUTER_ALPHA = 0.25;
export const PHOENIX_GLOW_INNER_OFFSET_Y = 8;
export const PHOENIX_GLOW_INNER_RX = 78;
export const PHOENIX_GLOW_INNER_RY = 20;
export const PHOENIX_GLOW_INNER_ALPHA = 0.4;
