import { Container, Sprite, type Texture } from 'pixi.js'
import type { Size } from '@/types/app'

/**
 * Full-screen cover sprite for scene backgrounds.
 */
export class SceneBackdrop {
  public readonly view = new Container()
  private readonly sprite: Sprite

  /**
   * @param texture Background texture to stretch with cover scaling.
   */
  constructor(texture: Texture) {
    this.sprite = new Sprite(texture)
    this.sprite.anchor.set(0.5)
    this.view.addChild(this.sprite)
  }

  /**
   * Fits the texture to cover the viewport while preserving aspect ratio.
   *
   * @param size Viewport size in pixels.
   */
  resize(size: Size): void {
    const tw = this.sprite.texture.width
    const th = this.sprite.texture.height
    const scale = Math.max(size.width / tw, size.height / th)

    this.sprite.scale.set(scale)
    this.sprite.position.set(size.width / 2, size.height / 2)
  }
}
