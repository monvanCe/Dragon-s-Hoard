import type { Container, FederatedPointerEvent } from "pixi.js";

export type MagicWordsDialogueTouchScrollHandlers = {
  isScrollable: () => boolean;
  /** Same sign as Pixi wheel `deltaY` (positive = dialogue scrolls down). */
  addScrollDelta: (deltaY: number) => void;
};

/**
 * Vertical drag-to-scroll for the Magic Words dialogue viewport (wheel has no `deltaY` on touch).
 */
export class MagicWordsDialogueTouchScrollController {
  private readonly surface: Container;
  private readonly handlers: MagicWordsDialogueTouchScrollHandlers;
  private activePointerId: number | null = null;
  private lastGlobalY = 0;

  constructor(surface: Container, handlers: MagicWordsDialogueTouchScrollHandlers) {
    this.surface = surface;
    this.handlers = handlers;
    surface.eventMode = "static";
    surface.cursor = "grab";
    surface.on("pointerdown", this.onPointerDown);
    surface.on("pointermove", this.onPointerMove);
    surface.on("pointerup", this.onPointerUp);
    surface.on("pointerupoutside", this.onPointerUp);
    surface.on("pointercancel", this.onPointerUp);
  }

  destroy(): void {
    this.surface.off("pointerdown", this.onPointerDown);
    this.surface.off("pointermove", this.onPointerMove);
    this.surface.off("pointerup", this.onPointerUp);
    this.surface.off("pointerupoutside", this.onPointerUp);
    this.surface.off("pointercancel", this.onPointerUp);
    this.endDrag();
  }

  private endDrag(): void {
    this.activePointerId = null;
    this.surface.cursor = "grab";
  }

  private onPointerDown = (event: FederatedPointerEvent): void => {
    if (!this.handlers.isScrollable()) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    this.activePointerId = event.pointerId;
    this.lastGlobalY = event.global.y;
    this.surface.cursor = "grabbing";

    const native = event.nativeEvent as PointerEvent | undefined;

    if (native?.target && "setPointerCapture" in native.target) {
      try {
        (native.target as Element).setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  private onPointerMove = (event: FederatedPointerEvent): void => {
    if (this.activePointerId !== event.pointerId) {
      return;
    }

    if (!this.handlers.isScrollable()) {
      this.endDrag();
      return;
    }

    const dy = event.global.y - this.lastGlobalY;
    this.lastGlobalY = event.global.y;
    // Match wheel: addScrollDelta(+dy) scrolls down; finger moving down should scroll up → opposite sign.
    this.handlers.addScrollDelta(-dy);
  };

  private onPointerUp = (event: FederatedPointerEvent): void => {
    if (this.activePointerId !== event.pointerId) {
      return;
    }

    const native = event.nativeEvent as PointerEvent | undefined;

    if (native?.target && "releasePointerCapture" in native.target) {
      try {
        (native.target as Element).releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }

    this.endDrag();
  };
}
