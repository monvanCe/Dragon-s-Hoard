import type { Container, Sprite } from "pixi.js";

export interface CardStackState {
  stackIndex: number;
  root: Container;
  card: Sprite;
  glow: Sprite;
  order: number;
  phase: number;
}
