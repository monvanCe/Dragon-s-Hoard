import type { Container } from "pixi.js";
import type { AppTextures } from "./textures";
import type { EventBus } from "./events";
import type { GlobalStore } from "./store";
import type { Size } from "./core";
import type { ScreenId } from "./screenId";

export type { ScreenId };

export interface SceneContext {
  bus: EventBus;
  state: GlobalStore;
  textures: AppTextures;
  viewport: Size;
}

export interface SceneController {
  id: ScreenId;
  container: Container;
  activate: () => void;
  deactivate: () => void;
  resize: (size: Size) => void;
  update: (deltaMs: number) => void;
}
