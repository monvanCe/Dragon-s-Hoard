import { Container, Graphics, Sprite } from "pixi.js";
import { SceneBackdrop } from "@/components/common/SceneBackdrop";
import { ScaledDesignRoot } from "@/components/common/ScaledDesignRoot";
import {
  createDungeonButton,
  createMutedText,
  createPanel,
  createText,
} from "@/components/common/ui";
import {
  PARTICLE_LIMIT,
  PANEL_CORNER_RADIUS,
  PANEL_FILL_COLOR,
  PANEL_STROKE_ALPHA_SCENE,
  PANEL_STROKE_COLOR,
  PANEL_STROKE_WIDTH,
  PANEL_LAYOUT_MAX_HEIGHT,
  PANEL_LAYOUT_MAX_WIDTH,
  PHOENIX_CORE_ANIM_TIME_SCALE,
  PHOENIX_CORE_FLAME_BASE_SCALE,
  PHOENIX_CORE_FLAME_COUNT,
  PHOENIX_CORE_FLICKER_AMP,
  PHOENIX_CORE_FLICKER_FREQ,
  PHOENIX_CORE_FLICKER_MIN,
  PHOENIX_CORE_PHASE_SPREAD,
  PHOENIX_CORE_PULSE_AMP,
  PHOENIX_CORE_PULSE_MIN,
  PHOENIX_CORE_ROTATION_AMP,
  PHOENIX_CORE_ROTATION_FREQ,
  PHOENIX_CORE_SPREAD,
  PHOENIX_CORE_ANCHOR_Y,
  PHOENIX_EMBER_ANCHOR_Y,
  PHOENIX_EMBER_LIFE_MIN,
  PHOENIX_EMBER_LIFE_RANGE,
  PHOENIX_EMBER_PHYSICS_DT_REF_MS,
  PHOENIX_EMBER_POOL_DEFAULT_SCALE_END,
  PHOENIX_EMBER_ROTATION_BASE,
  PHOENIX_EMBER_ROTATION_INDEX_SCALE,
  PHOENIX_EMBER_SCALE_END_MIN,
  PHOENIX_EMBER_SCALE_END_RANGE,
  PHOENIX_EMBER_SCALE_START_MIN,
  PHOENIX_EMBER_SCALE_START_RANGE,
  PHOENIX_EMBER_SPAWN_X_SPREAD,
  PHOENIX_EMBER_SPAWN_Y_MIN,
  PHOENIX_EMBER_SPAWN_Y_RANGE,
  PHOENIX_EMBER_TINT_THRESHOLD,
  PHOENIX_EMBER_VX_SPREAD,
  PHOENIX_EMBER_VY_MIN,
  PHOENIX_EMBER_VY_RANGE,
  PHOENIX_SPAWN_INTERVAL_MS,
  PHOENIX_GLOW_INNER_ALPHA,
  PHOENIX_GLOW_INNER_COLOR,
  PHOENIX_GLOW_INNER_OFFSET_Y,
  PHOENIX_GLOW_INNER_RX,
  PHOENIX_GLOW_INNER_RY,
  PHOENIX_GLOW_OUTER_ALPHA,
  PHOENIX_GLOW_OUTER_COLOR,
  PHOENIX_GLOW_OUTER_OFFSET_Y,
  PHOENIX_GLOW_OUTER_RX,
  PHOENIX_GLOW_OUTER_RY,
  PHOENIX_TINT_CORE_A,
  PHOENIX_TINT_CORE_B,
  PHOENIX_TINT_EMBER_HOT,
  PHOENIX_TINT_EMBER_WARM,
  TEXT_MUTED,
} from "@/constants/app";
import { DESIGN_WIDTH } from "@/constants/designCanvas";
import {
  getPhoenixPanelFrame,
  PHOENIX_BACK_BUTTON_H,
  PHOENIX_BACK_BUTTON_W,
  PHOENIX_BACK_BUTTON_X,
  PHOENIX_BACK_BUTTON_Y,
  PHOENIX_EMITTER_BOTTOM_OFFSET,
  PHOENIX_FOOTER_BOTTOM_OFFSET,
  PHOENIX_SUBTITLE_Y,
  PHOENIX_TITLE_Y,
} from "@/constants/layoutPhoenix";
import type {
  SceneContext,
  SceneController,
  ScreenId,
  Size,
} from "@/types/app";

interface EmberParticle {
  sprite: Sprite;
  velocityX: number;
  velocityY: number;
  lifetimeMs: number;
  ageMs: number;
  scaleStart: number;
  scaleEnd: number;
}

export class PhoenixFlameScene implements SceneController {
  public readonly id: ScreenId = "phoenix";
  public readonly container = new Container();
  private readonly backdrop: SceneBackdrop;
  private readonly scaled = new ScaledDesignRoot();
  private readonly panel = createPanel(PANEL_LAYOUT_MAX_WIDTH, PANEL_LAYOUT_MAX_HEIGHT);
  private readonly title = createText("Phoenix Flame", 34);
  private readonly subtitle = createMutedText(
    "Ten pooled sprites shape a bright flame with embers and pulse motion.",
  );
  private readonly footer = createText(
    `Flames ${PHOENIX_CORE_FLAME_COUNT} · rising embers ${PARTICLE_LIMIT}`,
    18,
    TEXT_MUTED,
  );
  private readonly flameRoot = new Container();
  private readonly coreFlames: Sprite[] = [];
  private readonly emberParticles: EmberParticle[] = [];
  private readonly baseGlow = new Graphics();
  private readonly backButton: Container;
  private readonly context: SceneContext;
  private emitterX = 0;
  private emitterY = 0;
  private spawnAccumulator = 0;
  private coreAnimMs = 0;

  constructor(context: SceneContext) {
    this.context = context;
    this.backdrop = new SceneBackdrop(context.textures.bgPhoenix);
    this.container.addChild(this.backdrop.view, this.scaled.wrap);
    this.scaled.inner.addChild(
      this.panel,
      this.title,
      this.subtitle,
      this.baseGlow,
      this.flameRoot,
      this.footer,
    );
    this.title.anchor.set(0.5, 0);
    this.subtitle.anchor.set(0.5, 0);
    this.footer.anchor.set(0.5, 0);

    this.backButton = createDungeonButton(
      "Back to Hoard",
      PHOENIX_BACK_BUTTON_W,
      PHOENIX_BACK_BUTTON_H,
      () => {
        this.context.bus.emit("navigate", "menu");
      },
      this.context.textures,
    );

    this.backButton.position.set(PHOENIX_BACK_BUTTON_X, PHOENIX_BACK_BUTTON_Y);
    this.scaled.inner.addChild(this.backButton);

    for (let index = 0; index < PHOENIX_CORE_FLAME_COUNT; index += 1) {
      const sprite = new Sprite(this.context.textures.flame);

      sprite.anchor.set(0.5, PHOENIX_CORE_ANCHOR_Y);
      sprite.blendMode = "add";
      sprite.position.set(
        -PHOENIX_CORE_SPREAD * 0.65 +
          (index * (PHOENIX_CORE_SPREAD * 1.3)) /
            Math.max(1, PHOENIX_CORE_FLAME_COUNT - 1),
        2 + (index % 2) * 4,
      );
      sprite.scale.set(PHOENIX_CORE_FLAME_BASE_SCALE);
      sprite.tint = index % 2 === 0 ? PHOENIX_TINT_CORE_A : PHOENIX_TINT_CORE_B;
      this.flameRoot.addChild(sprite);
      this.coreFlames.push(sprite);
    }

    for (let index = 0; index < PARTICLE_LIMIT; index += 1) {
      const sprite = new Sprite(this.context.textures.ember);

      sprite.anchor.set(0.5, PHOENIX_EMBER_ANCHOR_Y);
      sprite.visible = false;
      sprite.blendMode = "add";
      this.flameRoot.addChild(sprite);
      this.emberParticles.push({
        sprite,
        velocityX: 0,
        velocityY: 0,
        lifetimeMs: 0,
        ageMs: 0,
        scaleStart: 1,
        scaleEnd: PHOENIX_EMBER_POOL_DEFAULT_SCALE_END,
      });
    }
  }

  activate(): void {
    this.container.visible = true;
  }

  deactivate(): void {
    this.container.visible = false;
  }

  resize(size: Size): void {
    this.backdrop.resize(size);
    this.scaled.applyResize(size);

    const { panelWidth, panelHeight, left, top } = getPhoenixPanelFrame();

    this.panel.position.set(left, top);
    this.panel.clear();
    this.panel
      .roundRect(0, 0, panelWidth, panelHeight, PANEL_CORNER_RADIUS)
      .fill(PANEL_FILL_COLOR)
      .stroke({
        width: PANEL_STROKE_WIDTH,
        color: PANEL_STROKE_COLOR,
        alpha: PANEL_STROKE_ALPHA_SCENE,
      });
    this.title.position.set(DESIGN_WIDTH / 2, top + PHOENIX_TITLE_Y);
    this.subtitle.position.set(DESIGN_WIDTH / 2, top + PHOENIX_SUBTITLE_Y);
    this.footer.position.set(
      DESIGN_WIDTH / 2,
      top + panelHeight - PHOENIX_FOOTER_BOTTOM_OFFSET,
    );
    this.emitterX = DESIGN_WIDTH / 2;
    this.emitterY = top + panelHeight - PHOENIX_EMITTER_BOTTOM_OFFSET;
    this.flameRoot.position.set(this.emitterX, this.emitterY);
    this.baseGlow.clear();
    this.baseGlow
      .ellipse(
        this.emitterX,
        this.emitterY + PHOENIX_GLOW_OUTER_OFFSET_Y,
        PHOENIX_GLOW_OUTER_RX,
        PHOENIX_GLOW_OUTER_RY,
      )
      .fill({ color: PHOENIX_GLOW_OUTER_COLOR, alpha: PHOENIX_GLOW_OUTER_ALPHA });
    this.baseGlow
      .ellipse(
        this.emitterX,
        this.emitterY + PHOENIX_GLOW_INNER_OFFSET_Y,
        PHOENIX_GLOW_INNER_RX,
        PHOENIX_GLOW_INNER_RY,
      )
      .fill({ color: PHOENIX_GLOW_INNER_COLOR, alpha: PHOENIX_GLOW_INNER_ALPHA });
    this.backButton.position.set(PHOENIX_BACK_BUTTON_X, PHOENIX_BACK_BUTTON_Y);
  }

  update(deltaMs: number): void {
    this.coreAnimMs += deltaMs;
    this.updateCoreFlames();

    this.spawnAccumulator += deltaMs;

    while (this.spawnAccumulator >= PHOENIX_SPAWN_INTERVAL_MS) {
      this.spawnAccumulator -= PHOENIX_SPAWN_INTERVAL_MS;
      this.spawnEmber();
    }

    this.emberParticles.forEach((particle, index) => {
      if (!particle.sprite.visible) {
        return;
      }

      particle.ageMs += deltaMs;

      if (particle.ageMs >= particle.lifetimeMs) {
        particle.sprite.visible = false;

        return;
      }

      const progress = particle.ageMs / particle.lifetimeMs;
      particle.sprite.x += particle.velocityX * (deltaMs / PHOENIX_EMBER_PHYSICS_DT_REF_MS);
      particle.sprite.y += particle.velocityY * (deltaMs / PHOENIX_EMBER_PHYSICS_DT_REF_MS);
      particle.sprite.alpha = 1 - progress * progress;
      const scale =
        particle.scaleStart +
        (particle.scaleEnd - particle.scaleStart) * progress;

      particle.sprite.scale.set(scale);
      particle.sprite.rotation +=
        PHOENIX_EMBER_ROTATION_BASE + index * PHOENIX_EMBER_ROTATION_INDEX_SCALE;
    });
  }

  private updateCoreFlames(): void {
    const t = this.coreAnimMs * PHOENIX_CORE_ANIM_TIME_SCALE;

    this.coreFlames.forEach((sprite, index) => {
      const phase = t + index * PHOENIX_CORE_PHASE_SPREAD;
      const pulse = PHOENIX_CORE_PULSE_MIN + PHOENIX_CORE_PULSE_AMP * Math.sin(phase);
      const flicker =
        PHOENIX_CORE_FLICKER_MIN +
        PHOENIX_CORE_FLICKER_AMP *
          Math.sin(phase * PHOENIX_CORE_FLICKER_FREQ + index * 0.8);

      sprite.scale.set(PHOENIX_CORE_FLAME_BASE_SCALE * pulse);
      sprite.alpha = Math.min(1, flicker);
      sprite.rotation = Math.sin(phase * PHOENIX_CORE_ROTATION_FREQ) * PHOENIX_CORE_ROTATION_AMP;
    });
  }

  private spawnEmber(): void {
    const particle = this.emberParticles.find((entry) => !entry.sprite.visible);

    if (!particle) {
      return;
    }

    particle.sprite.visible = true;
    particle.sprite.position.set(
      (Math.random() - 0.5) * PHOENIX_EMBER_SPAWN_X_SPREAD,
      PHOENIX_EMBER_SPAWN_Y_MIN + Math.random() * PHOENIX_EMBER_SPAWN_Y_RANGE,
    );
    particle.sprite.alpha = 1;
    particle.velocityX = (Math.random() - 0.5) * PHOENIX_EMBER_VX_SPREAD;
    particle.velocityY = -(Math.random() * PHOENIX_EMBER_VY_RANGE + PHOENIX_EMBER_VY_MIN);
    particle.lifetimeMs =
      PHOENIX_EMBER_LIFE_MIN + Math.random() * PHOENIX_EMBER_LIFE_RANGE;
    particle.ageMs = 0;
    particle.scaleStart =
      PHOENIX_EMBER_SCALE_START_MIN + Math.random() * PHOENIX_EMBER_SCALE_START_RANGE;
    particle.scaleEnd =
      PHOENIX_EMBER_SCALE_END_MIN + Math.random() * PHOENIX_EMBER_SCALE_END_RANGE;
    particle.sprite.scale.set(particle.scaleStart);
    particle.sprite.rotation = Math.random() * Math.PI * 2;
    particle.sprite.tint =
      Math.random() > PHOENIX_EMBER_TINT_THRESHOLD
        ? PHOENIX_TINT_EMBER_WARM
        : PHOENIX_TINT_EMBER_HOT;
  }
}
