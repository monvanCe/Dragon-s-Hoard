import { MAGIC_WORDS_REQUEST_TIMEOUT_MS } from "@/constants/app";
import { loadRemoteTextureSafe } from "@/services/AssetService";
import type { Texture } from "pixi.js";

const texturesByUrl = new Map<string, Texture>();

/**
 * Returns a cached texture when present and still valid, otherwise `null`.
 */
export function getMagicWordsRemoteTextureIfCached(
  url: string,
): Texture | null {
  const cached = texturesByUrl.get(url);

  if (cached && !cached.destroyed) {
    return cached;
  }

  if (cached) {
    texturesByUrl.delete(url);
  }

  return null;
}

/**
 * Drops all cached remote textures (e.g. after "Reload Dialogue").
 */
export function clearMagicWordsRemoteTextureCache(): void {
  for (const texture of texturesByUrl.values()) {
    if (!texture.destroyed) {
      texture.destroy(true);
    }
  }

  texturesByUrl.clear();
}

/**
 * Returns a texture for the URL, using an in-memory cache so revisiting Magic Words
 * does not hit the network again for the same asset.
 */
export async function loadMagicWordsRemoteTexture(
  url: string,
): Promise<Texture | null> {
  const cachedHit = getMagicWordsRemoteTextureIfCached(url);

  if (cachedHit) {
    return cachedHit;
  }

  const texture = await loadRemoteTextureSafe(url, {
    timeoutMs: MAGIC_WORDS_REQUEST_TIMEOUT_MS,
  });

  if (texture) {
    texturesByUrl.set(url, texture);
  }

  return texture;
}
