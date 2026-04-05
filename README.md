# Softgames Pixi Assignment

Dragon dungeon themed demo built with `TypeScript` and `PixiJS v8`.

## Included Tasks

- `Ace of Shadows`: 144 card sprites across six stacks; every second a new card starts moving, travel lasts two seconds. Cards use a looping fire glow (tint, scale, rotation). When a card lands on a stack, an ember burst spawns around the impact point.
- `Magic Words`: Dialogue from the assignment endpoint with inline emoji tokens rendered as sprites inside rune-styled speech bubbles.
- `Phoenix Flame`: Pooled flame demo with at most ten sprites visible at once (assignment rule).

## Architecture

- `src/general/`: app bootstrap, event bus, global store, app brain
- `src/constants/`: screen IDs, timing, palette, asset path map
- `src/components/`: UI primitives, backdrops, scenes
- `src/services/`: procedural + optional file loading (`resolveAppTextures`), HTTP, parsing
- `src/types/`: shared contracts

## Run Locally

Requirements: `Node.js 20.19+` (or a supported `22.x`), `npm`.

```bash
npm install
npm run dev
```

```bash
npm run build
```

## Art direction (Dragon’s Hoard)

Target mood: **subterranean vault**, **gold filigree**, **ember and coals**, **slight magical smoke**. Keep one consistent style across menu, cards, UI chrome, and VFX so it reads as one product rather than separate tech demos.

## Local asset map (what goes where)

Vite serves `public/` at the site root. Use **PNG** or **WebP** unless you standardize on another Pixi-supported format everywhere.

Constants: [`src/constants/assets.ts`](src/constants/assets.ts). Resolution: [`src/services/AssetService.ts`](src/services/AssetService.ts) (`resolveAppTextures`). If a file is missing, a **procedural** fallback is generated so the build always runs.

### Full-screen backgrounds (cover scaling)

| Disk path | URL | Scene | Recommended spec |
| --- | --- | --- | --- |
| `public/assets/backgrounds/menu.png` | `/assets/backgrounds/menu.png` | Main menu | 1920×1080 or 2048×1152, dark stone vault, torch rim light, optional dragon silhouette |
| `public/assets/backgrounds/ace.png` | `/assets/backgrounds/ace.png` | Ace of Shadows | Same resolution, emphasize **glowing runes** or treasure piles under the stacks |
| `public/assets/backgrounds/magic.png` | `/assets/backgrounds/magic.png` | Magic Words | Cooler shadows, faint arcane sigils, still same dungeon family |
| `public/assets/backgrounds/phoenix.png` | `/assets/backgrounds/phoenix.png` | Phoenix Flame | Warmer magma tones, brazier or forge floor |

Aspect ratio can vary; textures are **cover** scaled (cropped edges on extreme ratios).

### UI chrome

| Disk path | URL | Usage |
| --- | --- | --- |
| `public/assets/ui/button-idle.png` | `/assets/ui/button-idle.png` | Default state for all menu and scene buttons |
| `public/assets/ui/button-hover.png` | `/assets/ui/button-hover.png` | Pointer-over state (same dimensions as idle preferred) |
| `public/assets/ui/panel-frame.png` | `/assets/ui/panel-frame.png` | Menu panel plate (default procedural size is **640×420**; your art can differ — it is scaled to that box) |

Button textures are stretched to the width/height passed in code (roughly **300×58** on menu, **200×58** on secondary actions). For crisp UI, design at **2×** resolution or keep vector export then rasterize.

### Ace of Shadows (cards + VFX)

| Disk path | URL | Usage |
| --- | --- | --- |
| `public/assets/ace/card-front.png` | `/assets/ace/card-front.png` | Face for all 144 sprites (**160×220 px**; scaled in code) |
| `public/assets/ace/card-glow.png` | `/assets/ace/card-glow.png` | **Fiery border overlay** on top of the card: **exactly 160×220 px**, **transparent center**, flame only on the **rounded outer rim** (same outer size as `card-front`) |

Pixel-art generation notes for `card-glow.png` are in [`public/assets/ace/CARD_GLOW_AI_BRIEF.txt`](public/assets/ace/CARD_GLOW_AI_BRIEF.txt).

### Phoenix + shared particles

| Disk path | URL | Usage |
| --- | --- | --- |
| `public/assets/phoenix/flame.png` | `/assets/phoenix/flame.png` | Main flame blob in Phoenix scene (additive blend) |
| `public/assets/phoenix/ember.png` | `/assets/phoenix/ember.png` | Smaller sparks in Phoenix scene |
| `public/assets/particles/spark.png` | `/assets/particles/spark.png` | **Stack landing burst** in Ace (additive); keep small and bright |

### Magic Words (remote by default)

Avatars and inline “emojis” use **URLs from the API**. To localize assets, host PNGs yourself and change the JSON your app loads (mock server, forked blueprint, or proxy) — there is no required filename convention in `public/` for those unless you implement a mapping layer.

## What you still need for a final submission

1. Optional: replace procedural fallbacks with final art following the table above.
2. Public Git repository (PDF).
3. Hosted build URL (PDF).
4. Confirm the mock API and any third-party image hosts are reachable from production.

## Suggested checklist

- `npm install` / `npm run dev`
- Exercise all three tasks on a narrow phone width and a wide desktop width
- Drop final PNGs into `public/assets/...` and refresh
- `npm run build` and deploy `dist/`
