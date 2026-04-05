import type { EventBus, EventMap } from '@/types/app'

/**
 * Creates a strongly typed event bus for cross-module orchestration.
 *
 * @returns Event bus instance.
 *
 * @example
 * const bus = createEventBus()
 * bus.emit('navigate', 'ace')
 */
export function createEventBus(): EventBus {
  const listeners = new Map<keyof EventMap, Set<(payload: unknown) => void>>()

  return {
    emit<TEvent extends keyof EventMap>(eventName: TEvent, payload: EventMap[TEvent]): void {
      const eventListeners = listeners.get(eventName)

      if (!eventListeners) {
        return
      }

      eventListeners.forEach((listener) => listener(payload))
    },
    on<TEvent extends keyof EventMap>(
      eventName: TEvent,
      listener: (payload: EventMap[TEvent]) => void,
    ): () => void {
      const eventListeners = listeners.get(eventName) ?? new Set<(payload: unknown) => void>()

      eventListeners.add(listener as (payload: unknown) => void)
      listeners.set(eventName, eventListeners)

      return () => {
        eventListeners.delete(listener as (payload: unknown) => void)

        if (eventListeners.size === 0) {
          listeners.delete(eventName)
        }
      }
    },
  }
}
