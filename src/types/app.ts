/**
 * Barrel re-exports — consumers keep importing from `@/types/app`.
 * Split modules follow single-responsibility and keep domain boundaries explicit.
 */
export type { Size } from "./core";
export type { AppTextures } from "./textures";
export type { ScreenId, SceneContext, SceneController } from "./scene";
export type { EventMap, EventBus } from "./events";
export type { AppState, GlobalStore } from "./store";
export type {
  DialogueEntry,
  EmojiEntry,
  AvatarEntry,
  MagicWordsResponse,
  ParsedTextSegment,
  ParsedEmojiSegment,
  ParsedMessageSegment,
} from "./magicWords";
export type { CardStackState } from "./cards";
