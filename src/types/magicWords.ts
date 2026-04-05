export interface DialogueEntry {
  name: string;
  text: string;
}

export interface EmojiEntry {
  name: string;
  url: string;
}

export interface AvatarEntry {
  name: string;
  url: string;
  position: "left" | "right";
}

export interface MagicWordsResponse {
  dialogue: DialogueEntry[];
  emojies: EmojiEntry[];
  avatars: AvatarEntry[];
}

export interface ParsedTextSegment {
  type: "text";
  value: string;
}

export interface ParsedEmojiSegment {
  type: "emoji";
  value: string;
}

export type ParsedMessageSegment = ParsedTextSegment | ParsedEmojiSegment;
