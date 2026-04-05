import type { ParsedMessageSegment } from '@/types/app'

const EMOJI_PATTERN = /\{([^}]+)\}/g

/**
 * Lists unique `{token}` names appearing across dialogue lines.
 *
 * @param dialogue Dialogue entries from the payload.
 * @returns Sorted unique emoji keys (trimmed).
 */
export function collectEmojiTokenNamesFromDialogue(
  dialogue: ReadonlyArray<{ text: string }>,
): string[] {
  const found = new Set<string>()

  for (const line of dialogue) {
    for (const match of line.text.matchAll(EMOJI_PATTERN)) {
      const token = match[1]?.trim()

      if (token) {
        found.add(token)
      }
    }
  }

  return [...found]
}

/**
 * Splits a magic words message into text and emoji tokens.
 *
 * @param value Raw dialogue string.
 * @returns Parsed segments.
 *
 * @example
 * const segments = parseMagicWordsMessage('Hello {intrigued}')
 */
export function parseMagicWordsMessage(value: string): ParsedMessageSegment[] {
  const segments: ParsedMessageSegment[] = []
  let cursor = 0

  for (const match of value.matchAll(EMOJI_PATTERN)) {
    const token = match[1]?.trim()
    const start = match.index ?? 0

    if (start > cursor) {
      segments.push({
        type: 'text',
        value: value.slice(cursor, start),
      })
    }

    if (token) {
      segments.push({
        type: 'emoji',
        value: token,
      })
    }

    cursor = start + match[0].length
  }

  if (cursor < value.length) {
    segments.push({
      type: 'text',
      value: value.slice(cursor),
    })
  }

  return segments
}
