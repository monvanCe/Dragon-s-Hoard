import { STACK_COUNT } from "@/constants/gameplayAce";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "@/constants/designCanvas";

export const ACE_BOARD_SIDE_MARGIN = 48;
export const ACE_BOARD_MAX_WIDTH_CAP = 960;
export const ACE_BOARD_VERTICAL_REFERENCE_HEIGHT = 640;
export const ACE_BOARD_MIN_TOP_OFFSET = 72;
export const ACE_BOARD_INSET_X = 72;
export const ACE_BOARD_INSET_Y = 108;
export const ACE_TITLE_Y_OFFSET = 16;
export const ACE_SUBTITLE_Y_OFFSET = 58;
export const ACE_OVERLAY_BOTTOM_OFFSET = 36;
export const ACE_BACK_BUTTON_X = 120;
export const ACE_BACK_BUTTON_BOTTOM_OFFSET = 52;
export const ACE_BACK_BUTTON_W = 200;
export const ACE_BACK_BUTTON_H = 58;

export const ACE_STACK_BASE_FILL_ALPHA = 0.85;
export const ACE_STACK_BASE_STROKE_WIDTH = 2;
export const ACE_STACK_BASE_STROKE_ALPHA = 0.9;

export const ACE_STACK_GAP_MAX = 136;
export const ACE_STACK_GAP_SIDE_TRIM = 160;
export const ACE_STACK_BASE_Y = 400;
export const ACE_STACK_BASE_WAVE_AMPLITUDE = 20;
export const ACE_STACK_BASE_WAVE_PHASE = 0.8;
export const ACE_STACK_BASE_HALF_WIDTH = 66;

export const ACE_STACK_BASE_WIDTH = 132;
export const ACE_STACK_BASE_HEIGHT = 26;
export const ACE_STACK_BASE_CORNER_RADIUS = 12;

/**
 * Resolves board width and top offset for the Ace scene (design space).
 */
export function getAceBoardLayout(): {
  boardWidth: number;
  offsetX: number;
  offsetY: number;
} {
  const boardWidth = Math.min(
    DESIGN_WIDTH - ACE_BOARD_SIDE_MARGIN,
    ACE_BOARD_MAX_WIDTH_CAP,
  );
  const offsetX = (DESIGN_WIDTH - boardWidth) / 2;
  const offsetY = Math.max(
    ACE_BOARD_MIN_TOP_OFFSET,
    (DESIGN_HEIGHT - ACE_BOARD_VERTICAL_REFERENCE_HEIGHT) / 2,
  );

  return { boardWidth, offsetX, offsetY };
}

/**
 * Horizontal gap between stack columns from current board width.
 */
export function getAceStackGap(boardWidth: number): number {
  return Math.min(
    ACE_STACK_GAP_MAX,
    (boardWidth - ACE_STACK_GAP_SIDE_TRIM) / (STACK_COUNT - 1),
  );
}
