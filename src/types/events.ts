import type { MagicWordsResponse } from "./magicWords";
import type { ScreenId } from "./screenId";
import type { Size } from "./core";

export interface EventMap {
  navigate: ScreenId;
  resize: Size;
  magicWordsRequested: void;
  magicWordsLoaded: MagicWordsResponse;
  magicWordsFailed: string;
}

export interface EventBus {
  emit<TEvent extends keyof EventMap>(
    eventName: TEvent,
    payload: EventMap[TEvent],
  ): void;
  on<TEvent extends keyof EventMap>(
    eventName: TEvent,
    listener: (payload: EventMap[TEvent]) => void,
  ): () => void;
}
