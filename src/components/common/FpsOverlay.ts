import { Container, Graphics, Text } from "pixi.js";
import {
  FPS_HUD_CORNER_RADIUS,
  FPS_HUD_FILL,
  FPS_HUD_HEIGHT,
  FPS_HUD_LABEL_PAD_X,
  FPS_HUD_LABEL_PAD_Y,
  FPS_HUD_TEXT_FILL,
  FPS_HUD_WIDTH,
  FPS_HUD_BG_ALPHA,
  FPS_OVERLAY_MARGIN_X,
  FPS_OVERLAY_MARGIN_Y,
} from "@/constants/fpsHud";
import { FPS_SAMPLE_SIZE } from "@/constants/timing";
import { FONT_FAMILY_FPS, FONT_SIZE_FPS, FONT_WEIGHT_TITLE } from "@/constants/typography";

export class FpsOverlay {
  public readonly container = new Container();
  private readonly valueLabel = new Text({
    text: "FPS 00",
    style: {
      fill: FPS_HUD_TEXT_FILL,
      fontFamily: FONT_FAMILY_FPS,
      fontSize: FONT_SIZE_FPS,
      fontWeight: FONT_WEIGHT_TITLE,
    },
  });
  private readonly samples: number[] = [];

  constructor() {
    const background = new Graphics()
      .roundRect(0, 0, FPS_HUD_WIDTH, FPS_HUD_HEIGHT, FPS_HUD_CORNER_RADIUS)
      .fill({ color: FPS_HUD_FILL, alpha: FPS_HUD_BG_ALPHA });

    this.valueLabel.position.set(FPS_HUD_LABEL_PAD_X, FPS_HUD_LABEL_PAD_Y);
    this.container.position.set(FPS_OVERLAY_MARGIN_X, FPS_OVERLAY_MARGIN_Y);
    this.container.addChild(background, this.valueLabel);
  }

  /**
   * Pushes a frame delta and refreshes the displayed average FPS.
   *
   * @param deltaMs Frame delta in milliseconds.
   * @returns Void.
   *
   * @example
   * overlay.update(16.67)
   */
  update(deltaMs: number): void {
    const fps = deltaMs > 0 ? 1000 / deltaMs : 0;

    this.samples.push(fps);

    if (this.samples.length > FPS_SAMPLE_SIZE) {
      this.samples.shift();
    }

    const total = this.samples.reduce((sum, value) => sum + value, 0);
    const average = this.samples.length > 0 ? total / this.samples.length : 0;

    this.valueLabel.text = `FPS ${Math.round(average).toString().padStart(2, "0")}`;
  }
}
