import type { MagicWordsResponse } from "./magicWords";
import type { ScreenId } from "./screenId";

export interface AppState {
  activeScreen: ScreenId;
  magicWordsStatus: "idle" | "loading" | "success" | "error";
  magicWordsData: MagicWordsResponse | null;
  magicWordsError: string | null;
}

export interface GlobalStore {
  getState: () => AppState;
  setState: (nextState: Partial<AppState>) => AppState;
  subscribe: (listener: (state: AppState) => void) => () => void;
}
