import type { AppState, GlobalStore } from '@/types/app'

/**
 * Creates the global application store.
 *
 * @param initialState Initial app state.
 * @returns Global store instance.
 *
 * @example
 * const store = createStore({ activeScreen: 'menu', magicWordsStatus: 'idle', magicWordsData: null, magicWordsError: null })
 */
export function createStore(initialState: AppState): GlobalStore {
  let state = initialState
  const listeners = new Set<(nextState: AppState) => void>()

  return {
    getState: () => state,
    setState: (nextState) => {
      state = { ...state, ...nextState }
      listeners.forEach((listener) => listener(state))

      return state
    },
    subscribe: (listener) => {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}
