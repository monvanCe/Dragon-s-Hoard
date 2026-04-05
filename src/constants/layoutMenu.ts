import { DESIGN_HEIGHT, DESIGN_WIDTH } from "@/constants/designCanvas";

export const MENU_PANEL_WIDTH = 640;
export const MENU_PANEL_HEIGHT = 420;

export const MENU_TITLE_Y = -180;
export const MENU_SUBTITLE_Y = -115;
export const MENU_BUTTON_ACE_Y = -60;
export const MENU_BUTTON_MAGIC_Y = 10;
export const MENU_BUTTON_PHOENIX_Y = 80;
export const MENU_FOOTER_Y = 150;

export const MENU_BUTTON_WIDTH = 300;
export const MENU_BUTTON_HEIGHT = 58;

/** Root anchor in design space (center of menu stack). */
export function getMenuRootPosition(): { x: number; y: number } {
  return { x: DESIGN_WIDTH / 2, y: DESIGN_HEIGHT / 2 };
}
