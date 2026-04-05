import { Assets, type Graphics, type RenderTexture, Texture } from "pixi.js";
import { LOCAL_ASSET_PATHS } from "@/constants/assets";
import type { AppTextures } from "@/types/app";
import {
  buildBackdropTexture,
  buildUIButtonTexture,
  buildCardGlowTexture,
  buildPanelBackdropTexture,
  buildParticleSparkTexture,
  buildProceduralBubbleTexture,
  buildProceduralCardTexture,
  buildProceduralEmberTexture,
  buildProceduralFlameTexture,
} from "@/services/buildProceduralAssets";

type BakeRenderer = {
  render: (options: {
    container: Graphics;
    target: RenderTexture;
    clear: boolean;
  }) => void;
};

/**
 * Attempts to load a texture from a public URL.
 *
 * @param url Absolute path served from `public/`.
 * @returns Texture when the asset exists, otherwise `null`.
 */
export async function tryLoadLocalTexture(
  url: string,
): Promise<Texture | null> {
  try {
    return await Assets.load<Texture>(url);
  } catch {
    return null;
  }
}

/**
 * Resolves the full texture registry with optional files under `public/assets/`.
 *
 * @param renderer Active Pixi renderer instance.
 * @returns Resolved textures for every slot.
 */
export async function resolveAppTextures(
  renderer: BakeRenderer,
): Promise<AppTextures> {
  const [
    bgMenu,
    bgAce,
    bgMagic,
    bgPhoenix,
    uiButtonIdle,
    uiButtonHover,
    uiPanelFrame,
    cardFront,
    cardGlow,
    phoenixFlame,
    phoenixEmber,
    particleSpark,
  ] = await Promise.all([
    tryLoadLocalTexture(LOCAL_ASSET_PATHS.backgrounds.menu),
    tryLoadLocalTexture(LOCAL_ASSET_PATHS.backgrounds.ace),
    tryLoadLocalTexture(LOCAL_ASSET_PATHS.backgrounds.magic),
    tryLoadLocalTexture(LOCAL_ASSET_PATHS.backgrounds.phoenix),
    tryLoadLocalTexture(LOCAL_ASSET_PATHS.ui.buttonIdle),
    tryLoadLocalTexture(LOCAL_ASSET_PATHS.ui.buttonHover),
    tryLoadLocalTexture(LOCAL_ASSET_PATHS.ui.panelFrame),
    tryLoadLocalTexture(LOCAL_ASSET_PATHS.ace.cardFront),
    tryLoadLocalTexture(LOCAL_ASSET_PATHS.ace.cardGlow),
    tryLoadLocalTexture(LOCAL_ASSET_PATHS.phoenix.flame),
    tryLoadLocalTexture(LOCAL_ASSET_PATHS.phoenix.ember),
    tryLoadLocalTexture(LOCAL_ASSET_PATHS.particles.spark),
  ]);

  const hoverButton = uiButtonHover ?? uiButtonIdle;

  return {
    bgMenu: bgMenu ?? buildBackdropTexture(renderer, "menu"),
    bgAce: bgAce ?? buildBackdropTexture(renderer, "ace"),
    bgMagic: bgMagic ?? buildBackdropTexture(renderer, "magic"),
    bgPhoenix: bgPhoenix ?? buildBackdropTexture(renderer, "phoenix"),
    uiButtonIdle: uiButtonIdle ?? buildUIButtonTexture(renderer, "idle"),
    uiButtonHover: hoverButton ?? buildUIButtonTexture(renderer, "hover"),
    uiPanelFrame: uiPanelFrame ?? buildPanelBackdropTexture(renderer),
    card: cardFront ?? buildProceduralCardTexture(renderer),
    cardGlow: cardGlow ?? buildCardGlowTexture(renderer),
    flame: phoenixFlame ?? buildProceduralFlameTexture(renderer),
    ember: phoenixEmber ?? buildProceduralEmberTexture(renderer),
    bubble: buildProceduralBubbleTexture(renderer),
    particleSpark: particleSpark ?? buildParticleSparkTexture(renderer),
  };
}

type LoadRemoteTextureOptions = {
  /** When set, aborts the HTTP request (and caps image fallback) after this duration. */
  timeoutMs?: number;
};

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

async function loadRemoteTextureUntimed(url: string): Promise<Texture | null> {
  try {
    const response = await fetch(url, {
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    return Texture.from(bitmap);
  } catch {
    return loadRemoteTextureViaImageElement(url);
  }
}

/**
 * Same as {@link loadRemoteTextureUntimed} but passes `AbortSignal` into `fetch` so the
 * browser cancels the request when `controller.abort()` runs.
 */
async function loadRemoteTextureViaFetch(
  url: string,
  signal: AbortSignal,
): Promise<Texture | null> {
  const response = await fetch(url, {
    mode: "cors",
    credentials: "omit",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    return null;
  }

  const blob = await response.blob();

  if (signal.aborted) {
    return null;
  }

  const bitmap = await createImageBitmap(blob);

  return Texture.from(bitmap);
}

async function loadRemoteTextureTimed(
  url: string,
  timeoutMs: number,
): Promise<Texture | null> {
  const deadline = Date.now() + timeoutMs;
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    return await loadRemoteTextureViaFetch(url, controller.signal);
  } catch (error) {
    if (isAbortError(error)) {
      return null;
    }

    const remaining = deadline - Date.now();

    if (remaining <= 0) {
      return null;
    }

    return loadRemoteTextureViaImageElement(url, remaining);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Loads a remote image via `fetch` so the browser always performs a real network request,
 * then builds a Pixi texture (avoids `Assets.load` sometimes skipping HTTP for cross-origin URLs).
 *
 * @param url Remote image URL (https).
 * @param options Optional `timeoutMs` — uses `AbortController` so the network request is cancelled.
 * @returns Texture or `null` if the request or decode failed.
 */
export async function loadRemoteTextureSafe(
  url: string,
  options?: LoadRemoteTextureOptions,
): Promise<Texture | null> {
  const ms = options?.timeoutMs;

  if (ms == null || ms <= 0) {
    return loadRemoteTextureUntimed(url);
  }

  return loadRemoteTextureTimed(url, ms);
}

/**
 * Fallback loader using an `HTMLImageElement` (classic img request in DevTools Network).
 * When `timeoutMs` is set, clears `src` on expiry so the browser can cancel the load.
 *
 * @param url Remote image URL.
 * @param timeoutMs Optional time budget in milliseconds.
 * @returns Texture or `null`.
 */
function loadRemoteTextureViaImageElement(
  url: string,
  timeoutMs?: number,
): Promise<Texture | null> {
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;

    const finish = (texture: Texture | null) => {
      if (settled) {
        return;
      }

      settled = true;

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }

      image.onload = null;
      image.onerror = null;

      if (texture === null) {
        image.removeAttribute("src");
      }

      resolve(texture);
    };

    const timeoutId =
      timeoutMs != null && timeoutMs > 0
        ? setTimeout(() => finish(null), timeoutMs)
        : undefined;

    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      finish(Texture.from(image));
    };
    image.onerror = () => {
      finish(null);
    };
    image.src = url;
  });
}

/**
 * Loads a remote texture; throws if the image cannot be loaded.
 *
 * @param url Remote image URL.
 * @returns Loaded texture.
 */
export async function loadRemoteTexture(url: string): Promise<Texture> {
  const texture = await loadRemoteTextureSafe(url);

  if (!texture) {
    throw new Error(`Failed to load remote texture: ${url}`);
  }

  return texture;
}
