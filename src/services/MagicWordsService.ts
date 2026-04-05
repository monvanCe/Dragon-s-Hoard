import {
  MAGIC_WORDS_ENDPOINT,
  MAGIC_WORDS_REQUEST_TIMEOUT_MS,
} from "@/constants/app";
import { enrichMagicWordsResponse } from "@/services/MagicWordsEnricher";
import { requestJson } from "@/services/HttpService";
import type { EventBus, GlobalStore, MagicWordsResponse } from "@/types/app";

export type GetMagicWordsOptions = {
  forceRefresh?: boolean;
};

/**
 * Fetches and stores the magic words payload.
 *
 * @param bus Global event bus.
 * @param state Global state store.
 * @param options When `forceRefresh` is true, skips cache and refetches from the endpoint.
 * @returns Promise resolved when the request finishes.
 *
 * @example
 * await getMagicWordsData(bus, state)
 * await getMagicWordsData(bus, state, { forceRefresh: true })
 */
export async function getMagicWordsData(
  bus: EventBus,
  state: GlobalStore,
  options?: GetMagicWordsOptions,
): Promise<void> {
  const currentState = state.getState();

  if (
    !options?.forceRefresh &&
    currentState.magicWordsStatus === "success" &&
    currentState.magicWordsData
  ) {
    bus.emit("magicWordsLoaded", currentState.magicWordsData);

    return;
  }

  state.setState({
    magicWordsStatus: "loading",
    magicWordsError: null,
  });

  try {
    const raw = await requestJson<MagicWordsResponse>(MAGIC_WORDS_ENDPOINT, {
      timeoutMs: MAGIC_WORDS_REQUEST_TIMEOUT_MS,
    });
    const response = enrichMagicWordsResponse(raw);

    state.setState({
      magicWordsStatus: "success",
      magicWordsData: response,
      magicWordsError: null,
    });
    bus.emit("magicWordsLoaded", response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    state.setState({
      magicWordsStatus: "error",
      magicWordsError: message,
    });
    bus.emit("magicWordsFailed", message);
  }
}
