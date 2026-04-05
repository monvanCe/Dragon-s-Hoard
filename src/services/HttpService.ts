export type RequestJsonOptions = {
  /** When set, aborts the fetch after this many milliseconds. */
  timeoutMs?: number
}

/**
 * Executes a JSON request with shared error handling.
 *
 * @param input Request URL.
 * @param options Optional `timeoutMs` to abort slow responses.
 * @returns Parsed JSON response.
 *
 * @example
 * const data = await requestJson<MyType>('https://example.com/data')
 */
export async function requestJson<TResponse>(
  input: string,
  options?: RequestJsonOptions,
): Promise<TResponse> {
  const controller = new AbortController()
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  if (options?.timeoutMs != null && options.timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), options.timeoutMs)
  }

  try {
    const response = await fetch(input, { signal: controller.signal })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    return (await response.json()) as TResponse
  } catch (error) {
    const aborted =
      (error instanceof DOMException && error.name === 'AbortError') ||
      (error instanceof Error && error.name === 'AbortError')

    if (aborted) {
      throw new Error('Request timed out')
    }

    throw error
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
  }
}
