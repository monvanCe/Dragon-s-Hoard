import type { Application, Container, Renderer } from 'pixi.js'

declare global {
  var __PIXI_APP__: Application | undefined
  var __PIXI_STAGE__: Container | undefined
  var __PIXI_RENDERER__: Renderer | undefined
}

export {}
