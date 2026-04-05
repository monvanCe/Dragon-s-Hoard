import { PANEL_BACKGROUND, PANEL_BORDER } from "@/constants/colors";

/** Shared “task panel” caps (Magic Words, Phoenix, etc.). */
export const PANEL_LAYOUT_MAX_WIDTH = 980;
export const PANEL_LAYOUT_MAX_HEIGHT = 660;
/** Inset from design canvas when fitting the panel. */
export const PANEL_LAYOUT_CANVAS_INSET = 40;

export const PANEL_CORNER_RADIUS = 24;
export const PANEL_STROKE_WIDTH = 3;
/** Alpha when scenes redraw their panel in `resize`. */
export const PANEL_STROKE_ALPHA_SCENE = 0.9;
/** Alpha for {@link createPanel} kit default. */
export const PANEL_STROKE_ALPHA_KIT = 0.85;

/** Re-export fills used by scene panel redraws (single import in scenes). */
export const PANEL_FILL_COLOR = PANEL_BACKGROUND;
export const PANEL_STROKE_COLOR = PANEL_BORDER;
