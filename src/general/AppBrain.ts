import { Application, Assets, Container } from 'pixi.js'
import { FpsOverlay } from '@/components/common/FpsOverlay'
import { APP_BACKGROUND, INITIAL_SCREEN_ID } from '@/constants/app'
import { createEventBus } from '@/general/createEventBus'
import { createSceneRegistry } from '@/general/createSceneRegistry'
import { createStore } from '@/general/createStore'
import { resolveAppTextures } from '@/services/AssetService'
import type { AppState, SceneController, ScreenId, Size } from '@/types/app'

export class AppBrain {
  private readonly app = new Application()
  private readonly stageRoot = new Container()
  private readonly scenes = new Map<ScreenId, SceneController>()
  private readonly bus = createEventBus()
  private readonly state = createStore(this.createInitialState())
  private readonly fpsOverlay = new FpsOverlay()

  /**
   * Boots the Pixi application and application services.
   *
   * @param mountNode Root HTML element.
   * @returns Promise resolved when the app is ready.
   *
   * @example
   * const brain = new AppBrain()
   * await brain.bootstrap(document.querySelector('#app') as HTMLDivElement)
   */
  async bootstrap(mountNode: HTMLElement): Promise<void> {
    await this.app.init({
      resizeTo: window,
      background: APP_BACKGROUND,
      antialias: true,
    })

    Assets.setPreferences({ crossOrigin: 'anonymous' })

    globalThis.__PIXI_APP__ = this.app
    globalThis.__PIXI_STAGE__ = this.app.stage
    globalThis.__PIXI_RENDERER__ = this.app.renderer

    mountNode.appendChild(this.app.canvas)
    this.app.stage.addChild(this.stageRoot, this.fpsOverlay.container)

    const textures = await resolveAppTextures(this.app.renderer)
    const size = this.getViewport()
    const sceneContext = {
      bus: this.bus,
      state: this.state,
      textures,
      viewport: size,
    }
    const registry = createSceneRegistry(sceneContext)

    registry.forEach((scene) => {
      this.scenes.set(scene.id, scene)
      this.stageRoot.addChild(scene.container)
      scene.container.visible = false
      scene.resize(size)
    })

    this.bus.on('navigate', (screenId) => {
      this.showScene(screenId)
    })
    this.bus.on('resize', (nextSize) => {
      this.scenes.forEach((scene) => scene.resize(nextSize))
    })

    window.addEventListener('resize', this.handleResize)
    this.app.ticker.add(() => {
      const deltaMs = this.app.ticker.deltaMS

      this.fpsOverlay.update(deltaMs)
      this.scenes.get(this.state.getState().activeScreen)?.update(deltaMs)
    })

    this.showScene(INITIAL_SCREEN_ID)
    this.handleResize()
  }

  /**
   * Tears down listeners and the Pixi application.
   *
   * @returns Void.
   *
   * @example
   * brain.destroy()
   */
  destroy(): void {
    window.removeEventListener('resize', this.handleResize)

    if (globalThis.__PIXI_APP__ === this.app) {
      globalThis.__PIXI_APP__ = undefined
    }

    if (globalThis.__PIXI_STAGE__ === this.app.stage) {
      globalThis.__PIXI_STAGE__ = undefined
    }

    if (globalThis.__PIXI_RENDERER__ === this.app.renderer) {
      globalThis.__PIXI_RENDERER__ = undefined
    }

    this.app.destroy(true, { children: true })
  }

  private readonly handleResize = (): void => {
    this.bus.emit('resize', this.getViewport())
  }

  private showScene(screenId: ScreenId): void {
    this.state.setState({ activeScreen: screenId })
    this.scenes.forEach((scene, id) => {
      if (id === screenId) {
        scene.activate()

        return
      }

      scene.deactivate()
    })
  }

  private getViewport(): Size {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  }

  private createInitialState(): AppState {
    return {
      activeScreen: INITIAL_SCREEN_ID,
      magicWordsStatus: 'idle',
      magicWordsData: null,
      magicWordsError: null,
    }
  }
}
