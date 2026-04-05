export const FONT_FAMILY_UI = "Georgia, serif";
export const FONT_FAMILY_FPS = "Arial";

export const FONT_WEIGHT_TITLE = "700" as const;

export const FONT_SIZE_MUTED = 16;
export const FONT_SIZE_BUTTON_LABEL = 20;
export const FONT_SIZE_DIALOGUE_INLINE = 19;
export const FONT_SIZE_DIALOGUE_NAME = 22;
export const FONT_SIZE_DIALOGUE_EMOJI_FALLBACK = 15;
export const FONT_SIZE_FPS = 18;

export const LINE_HEIGHT_DIALOGUE_INLINE = 24;

/** Title text drop shadow (Pixi TextStyle). */
export const TEXT_SHADOW_TITLE = {
  alpha: 0.85,
  angle: Math.PI / 2,
  blur: 4,
  color: 0x000000,
  distance: 2,
} as const;

/** Button label drop shadow. */
export const TEXT_SHADOW_BUTTON = {
  alpha: 0.9,
  angle: Math.PI / 2,
  blur: 3,
  color: 0x000000,
  distance: 1,
} as const;
