import { Graphics, RenderTexture, Texture } from "pixi.js";

type BakeRenderer = {
  render: (options: {
    container: Graphics;
    target: RenderTexture;
    clear: boolean;
  }) => void;
};

/**
 * Bakes a full-screen style backdrop texture for a scene preset.
 *
 * @param renderer Pixi renderer used for baking.
 * @param preset Visual preset identifier.
 * @returns Backdrop texture.
 */
export function buildBackdropTexture(
  renderer: BakeRenderer,
  preset: "menu" | "ace" | "magic" | "phoenix",
): Texture {
  const w = 512;
  const h = 512;
  const target = RenderTexture.create({ width: w, height: h });
  const g = new Graphics();

  const base =
    preset === "menu"
      ? 0x14081c
      : preset === "ace"
        ? 0x0c0612
        : preset === "magic"
          ? 0x0f1028
          : 0x160c08;

  g.rect(0, 0, w, h).fill(base);

  if (preset === "menu" || preset === "ace") {
    g.roundRect(24, 24, w - 48, h - 48, 32).stroke({
      width: 3,
      color: 0xc9a227,
      alpha: 0.35,
    });
  }

  if (preset === "magic") {
    g.roundRect(24, 24, w - 48, h - 48, 32).stroke({
      width: 2,
      color: 0x6b8cff,
      alpha: 0.4,
    });
  }

  if (preset === "phoenix") {
    g.roundRect(24, 24, w - 48, h - 48, 32).stroke({
      width: 3,
      color: 0xff6b2c,
      alpha: 0.45,
    });
  }

  for (let i = 0; i < 48; i += 1) {
    const px = (i * 97) % w;
    const py = (i * 53 + 17) % h;
    const dim = 1 + (i % 3);
    g.rect(px, py, dim, dim).fill({
      color: 0xf4e4a6,
      alpha: 0.04 + (i % 5) * 0.012,
    });
  }

  if (preset === "ace" || preset === "phoenix") {
    g.ellipse(w * 0.5, h * 0.72, w * 0.45, h * 0.28).fill({
      color: 0xff3c1a,
      alpha: 0.12,
    });
    g.ellipse(w * 0.35, h * 0.55, w * 0.2, h * 0.15).fill({
      color: 0xff9500,
      alpha: 0.08,
    });
  }

  if (preset === "magic") {
    g.ellipse(w * 0.5, h * 0.4, w * 0.35, h * 0.35).fill({
      color: 0x4a6fff,
      alpha: 0.1,
    });
  }

  renderer.render({ container: g, target, clear: true });
  g.destroy();

  return target;
}

/**
 * Bakes a UI button texture for idle or hover states.
 *
 * @param renderer Pixi renderer used for baking.
 * @param variant Button visual state.
 * @returns Button texture.
 */
export function buildUIButtonTexture(
  renderer: BakeRenderer,
  variant: "idle" | "hover",
): Texture {
  const bw = 240;
  const bh = 64;
  const target = RenderTexture.create({ width: bw, height: bh });
  const g = new Graphics();
  const fill = variant === "hover" ? 0x3a1520 : 0x241018;
  const stroke = variant === "hover" ? 0xffcc66 : 0xc9a227;

  g.roundRect(4, 4, bw - 8, bh - 8, 16).fill(fill);
  g.roundRect(4, 4, bw - 8, bh - 8, 16).stroke({
    width: 3,
    color: stroke,
    alpha: 0.95,
  });
  g.roundRect(10, 10, bw - 20, bh - 20, 12).stroke({
    width: 1,
    color: 0xff6b2c,
    alpha: variant === "hover" ? 0.5 : 0.25,
  });

  renderer.render({ container: g, target, clear: true });
  g.destroy();

  return target;
}

/**
 * Bakes a 160×220 fiery card frame: transparent interior, flame on the rounded outer border only.
 *
 * @param renderer Pixi renderer used for baking.
 * @returns Border texture aligned with {@link buildProceduralCardTexture}.
 */
export function buildCardGlowTexture(renderer: BakeRenderer): Texture {
  const w = 160;
  const h = 220;
  const target = RenderTexture.create({ width: w, height: h });
  const g = new Graphics();
  const outerR = 18;

  g.roundRect(1, 1, w - 2, h - 2, outerR).stroke({
    width: 12,
    color: 0xcc2200,
    alpha: 0.95,
  });
  g.roundRect(4, 4, w - 8, h - 8, outerR - 2).stroke({
    width: 6,
    color: 0xff6600,
    alpha: 0.9,
  });
  g.roundRect(6, 6, w - 12, h - 12, outerR - 3).stroke({
    width: 3,
    color: 0xffcc44,
    alpha: 0.85,
  });
  g.roundRect(8, 8, w - 16, h - 16, outerR - 4).stroke({
    width: 1,
    color: 0xfff0aa,
    alpha: 0.65,
  });

  g.circle(w * 0.5 - 28, 14, 5).fill({ color: 0xffaa33, alpha: 0.75 });
  g.circle(w * 0.5 + 22, 18, 4).fill({ color: 0xff4400, alpha: 0.7 });
  g.circle(w * 0.5 + 6, 10, 3).fill({ color: 0xffee88, alpha: 0.8 });
  g.circle(18, h * 0.45, 4).fill({ color: 0xff5500, alpha: 0.55 });
  g.circle(w - 16, h * 0.55, 4).fill({ color: 0xff7700, alpha: 0.55 });

  renderer.render({ container: g, target, clear: true });
  g.destroy();

  return target;
}

/**
 * Bakes a small spark used for impact bursts.
 *
 * @param renderer Pixi renderer used for baking.
 * @returns Spark texture.
 */
export function buildParticleSparkTexture(renderer: BakeRenderer): Texture {
  const target = RenderTexture.create({ width: 32, height: 32 });
  const g = new Graphics();
  g.circle(16, 16, 10).fill({ color: 0xffe066, alpha: 0.9 });
  g.star(16, 16, 4, 14, 5).fill({ color: 0xffffff, alpha: 0.85 });

  renderer.render({ container: g, target, clear: true });
  g.destroy();

  return target;
}

/**
 * Bakes the procedural playing card face.
 *
 * @param renderer Pixi renderer used for baking.
 * @returns Card texture.
 */
export function buildProceduralCardTexture(renderer: BakeRenderer): Texture {
  const target = RenderTexture.create({ width: 160, height: 220 });
  const g = new Graphics();
  g.roundRect(0, 0, 160, 220, 18)
    .fill(0x1e0f18)
    .stroke({ width: 4, color: 0xc9a227 });
  g.roundRect(10, 10, 140, 200, 14).stroke({
    width: 2,
    color: 0xff6b2c,
    alpha: 0.5,
  });
  g.roundRect(18, 18, 124, 184, 12).fill(0x120810);
  g.star(80, 110, 6, 36, 16).fill(0xff4500);
  g.star(80, 110, 6, 18, 8).fill(0xffcc33);

  renderer.render({ container: g, target, clear: true });
  g.destroy();

  return target;
}

/**
 * Bakes the procedural flame blob.
 *
 * @param renderer Pixi renderer used for baking.
 * @returns Flame texture.
 */
export function buildProceduralFlameTexture(renderer: BakeRenderer): Texture {
  const target = RenderTexture.create({ width: 96, height: 160 });
  const g = new Graphics();
  g.circle(48, 112, 36).fill(0xff702d);
  g.circle(48, 82, 24).fill(0xffd166);
  g.circle(48, 56, 14).fill(0xfff1b5);

  renderer.render({ container: g, target, clear: true });
  g.destroy();

  return target;
}

/**
 * Bakes the procedural ember blob.
 *
 * @param renderer Pixi renderer used for baking.
 * @returns Ember texture.
 */
export function buildProceduralEmberTexture(renderer: BakeRenderer): Texture {
  const target = RenderTexture.create({ width: 48, height: 48 });
  const g = new Graphics();
  g.circle(24, 24, 18).fill(0xffc24b);

  renderer.render({ container: g, target, clear: true });
  g.destroy();

  return target;
}

/**
 * Bakes a decorative bubble texture for optional UI polish.
 *
 * @param renderer Pixi renderer used for baking.
 * @returns Bubble texture.
 */
export function buildProceduralBubbleTexture(renderer: BakeRenderer): Texture {
  const target = RenderTexture.create({ width: 56, height: 56 });
  const g = new Graphics();
  g.roundRect(0, 0, 56, 56, 20)
    .fill(0x1c1024)
    .stroke({ width: 2, color: 0xff9f43 });

  renderer.render({ container: g, target, clear: true });
  g.destroy();

  return target;
}

/**
 * Bakes a large framed panel used behind menu and HUD blocks.
 *
 * @param renderer Pixi renderer used for baking.
 * @returns Panel texture.
 */
export function buildPanelBackdropTexture(renderer: BakeRenderer): Texture {
  const w = 640;
  const h = 420;
  const target = RenderTexture.create({ width: w, height: h });
  const g = new Graphics();

  g.roundRect(0, 0, w, h, 28).fill({ color: 0x120810, alpha: 0.94 });
  g.roundRect(0, 0, w, h, 28).stroke({
    width: 4,
    color: 0xc9a227,
    alpha: 0.95,
  });
  g.roundRect(10, 10, w - 20, h - 20, 22).stroke({
    width: 2,
    color: 0xff6b2c,
    alpha: 0.4,
  });
  g.rect(24, 24, w - 48, 6).fill({ color: 0xffcc66, alpha: 0.12 });

  renderer.render({ container: g, target, clear: true });
  g.destroy();

  return target;
}
