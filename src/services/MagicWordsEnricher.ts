import { collectEmojiTokenNamesFromDialogue } from '@/services/MagicWordsParser'
import type { AvatarEntry, DialogueEntry, EmojiEntry, MagicWordsResponse } from '@/types/app'

/**
 * Builds a DiceBear fun-emoji image URL for inline dialogue tokens.
 *
 * @param token Emoji key from curly braces (for example `intrigued`).
 * @returns Remote PNG URL.
 */
function buildFunEmojiUrl(token: string): string {
  const seed = encodeURIComponent(token.charAt(0).toUpperCase() + token.slice(1))

  return `https://api.dicebear.com/9.x/fun-emoji/png?seed=${seed}`
}

/**
 * Builds a DiceBear persona avatar for speakers missing from the payload.
 *
 * @param name Character display name.
 * @returns Remote PNG URL.
 */
function buildPersonaAvatarUrl(name: string): string {
  return `https://api.dicebear.com/9.x/personas/png?seed=${encodeURIComponent(name)}`
}

/**
 * Appends emoji definitions for every `{token}` used in dialogue but absent from `emojies`.
 *
 * @param dialogue Dialogue lines.
 * @param emojies Existing emoji list from the API.
 * @returns Merged emoji list (API first, then synthetic entries).
 */
function mergeMissingEmojies(dialogue: DialogueEntry[], emojies: EmojiEntry[]): EmojiEntry[] {
  const byName = new Map(emojies.map((entry) => [entry.name, entry]))
  const needed = collectEmojiTokenNamesFromDialogue(dialogue)
  const merged = [...emojies]

  for (const name of needed) {
    if (byName.has(name)) {
      continue
    }

    const synthetic: EmojiEntry = { name, url: buildFunEmojiUrl(name) }

    byName.set(name, synthetic)
    merged.push(synthetic)
  }

  return merged
}

/**
 * Appends avatar definitions for every speaker in dialogue but absent from `avatars`.
 *
 * @param dialogue Dialogue lines.
 * @param avatars Existing avatar list from the API.
 * @returns Merged avatar list.
 */
function mergeMissingAvatars(dialogue: DialogueEntry[], avatars: AvatarEntry[]): AvatarEntry[] {
  const byName = new Map(avatars.map((entry) => [entry.name, entry]))
  const speakers = [...new Set(dialogue.map((line) => line.name))]
  const merged = [...avatars]
  let syntheticIndex = 0

  for (const name of speakers) {
    if (byName.has(name)) {
      continue
    }

    const position = syntheticIndex % 2 === 0 ? 'left' : 'right'
    const synthetic: AvatarEntry = {
      name,
      url: buildPersonaAvatarUrl(name),
      position,
    }

    syntheticIndex += 1
    byName.set(name, synthetic)
    merged.push(synthetic)
  }

  return merged
}

/**
 * Returns a copy of the API payload with every referenced emoji token and speaker covered.
 *
 * @param raw Response body from the Magic Words endpoint.
 * @returns Normalized response safe for rendering.
 */
export function enrichMagicWordsResponse(raw: MagicWordsResponse): MagicWordsResponse {
  return {
    dialogue: raw.dialogue,
    emojies: mergeMissingEmojies(raw.dialogue, raw.emojies),
    avatars: mergeMissingAvatars(raw.dialogue, raw.avatars),
  }
}
