import { Container } from 'pixi.js'
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '@/constants/designCanvas'
import type { Size } from '@/types/app'

/**
 * Centers and uniformly scales all children of `inner` as if laid out on a fixed design canvas.
 * Background layers should stay outside this wrapper.
 */
export class ScaledDesignRoot {
  public readonly wrap = new Container()
  public readonly inner = new Container()

  constructor() {
    this.wrap.addChild(this.inner)
    this.inner.position.set(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2)
  }

  /**
   * Fits the design rectangle into the viewport with a uniform scale and centers it.
   *
   * @param viewport Current window dimensions in pixels.
   */
  applyResize(viewport: Size): void {
    const scale = Math.min(viewport.width / DESIGN_WIDTH, viewport.height / DESIGN_HEIGHT)

    this.wrap.position.set(viewport.width / 2, viewport.height / 2)
    this.wrap.scale.set(scale)
  }
}
