import { Container, Graphics, Sprite } from 'pixi.js'
import { SceneBackdrop } from '@/components/common/SceneBackdrop'
import { ScaledDesignRoot } from '@/components/common/ScaledDesignRoot'
import { createDungeonButton, createMutedText, createText } from '@/components/common/ui'
import {
  ACE_BURST_PER_LAND,
  ACE_BURST_POOL,
  ACE_BURST_DT_MULT,
  ACE_BURST_GRAVITY,
  ACE_BURST_LIFE_MIN,
  ACE_BURST_LIFE_RANGE,
  ACE_BURST_ROTATION_SPEED,
  ACE_BURST_SCALE_MIN,
  ACE_BURST_SCALE_RANGE,
  ACE_BURST_SPEED_MIN,
  ACE_BURST_SPEED_RANGE,
  ACE_BURST_SPAWN_JITTER_Y,
  ACE_BURST_UPWARD_BIAS,
  ACE_CARD_INITIAL_PHASE_STEP,
  ACE_CARD_MOVE_ARC_LIFT,
  ACE_CARD_STACK_VERTICAL_GAP,
  ACE_CARD_TEXTURE_SCALE,
  ACE_IDLE_GLOW_ALPHA_MOVING_AMP,
  ACE_IDLE_GLOW_ALPHA_MOVING_BASE,
  ACE_IDLE_GLOW_ALPHA_REST_AMP,
  ACE_IDLE_GLOW_ALPHA_REST_BASE,
  ACE_IDLE_GLOW_WAVE_MOVING,
  ACE_IDLE_GLOW_WAVE_REST,
  ACE_IDLE_HEAT_PHASE_MULT,
  ACE_IDLE_PHASE_SPEED,
  ACE_IDLE_PULSE_MOVING,
  ACE_IDLE_PULSE_ORDER_PHASE,
  ACE_IDLE_PULSE_PHASE_MULT,
  ACE_IDLE_PULSE_REST,
  ACE_IDLE_WOBBLE_MOVING,
  ACE_IDLE_WOBBLE_PHASE_MULT,
  ACE_IDLE_WOBBLE_REST,
  ACCENT_COLOR,
  ACE_BURST_TINT_HI,
  ACE_BURST_TINT_LO,
  ACE_CARD_TINT_COOL,
  ACE_CARD_TINT_HOT,
  ACE_GLOW_TINT_COOL,
  ACE_GLOW_TINT_HOT,
  ACE_STACK_BASE_FILL,
  CARD_COUNT,
  CARD_FACE_ANCHOR_X,
  CARD_FACE_ANCHOR_Y,
  CARD_MOVE_DURATION_MS,
  CARD_MOVE_INTERVAL_MS,
  STACK_COUNT,
  TEXT_MUTED,
} from '@/constants/app'
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '@/constants/designCanvas'
import {
  ACE_BACK_BUTTON_BOTTOM_OFFSET,
  ACE_BACK_BUTTON_H,
  ACE_BACK_BUTTON_W,
  ACE_BACK_BUTTON_X,
  ACE_BOARD_INSET_X,
  ACE_BOARD_INSET_Y,
  ACE_OVERLAY_BOTTOM_OFFSET,
  ACE_STACK_BASE_CORNER_RADIUS,
  ACE_STACK_BASE_FILL_ALPHA,
  ACE_STACK_BASE_HALF_WIDTH,
  ACE_STACK_BASE_HEIGHT,
  ACE_STACK_BASE_STROKE_ALPHA,
  ACE_STACK_BASE_STROKE_WIDTH,
  ACE_STACK_BASE_WIDTH,
  ACE_STACK_BASE_WAVE_AMPLITUDE,
  ACE_STACK_BASE_WAVE_PHASE,
  ACE_STACK_BASE_Y,
  ACE_SUBTITLE_Y_OFFSET,
  ACE_TITLE_Y_OFFSET,
  getAceBoardLayout,
  getAceStackGap,
} from '@/constants/layoutAce'
import { lerpRgb } from '@/utils/lerpRgb'
import type { CardStackState, SceneContext, SceneController, ScreenId, Size } from '@/types/app'

interface ActiveMove {
  card: CardStackState
  fromStackIndex: number
  toStackIndex: number
  startOrder: number
  targetOrder: number
  elapsedMs: number
}

interface BurstParticle {
  sprite: Sprite
  vx: number
  vy: number
  life: number
  age: number
  active: boolean
}

export class AceOfShadowsScene implements SceneController {
  public readonly id: ScreenId = 'ace'
  public readonly container = new Container()
  private readonly backdrop: SceneBackdrop
  private readonly scaled = new ScaledDesignRoot()
  private readonly title = createText('Ace of Shadows', 36)
  private readonly subtitle = createMutedText('Dragon hoard stacks — cursed cards never rest.')
  private readonly board = new Container()
  private readonly burstLayer = new Container()
  private readonly overlay = createText('', 17, TEXT_MUTED)
  private readonly stackBases: Graphics[] = []
  private readonly cards: CardStackState[] = []
  private readonly activeMoves: ActiveMove[] = []
  private readonly stackPositions: { x: number; y: number }[] = []
  private readonly bursts: BurstParticle[] = []
  private readonly backButton: Container
  private readonly context: SceneContext
  private accumulatedMoveTime = 0

  constructor(context: SceneContext) {
    this.context = context
    this.backdrop = new SceneBackdrop(context.textures.bgAce)
    this.backButton = createDungeonButton('Back to Hoard', ACE_BACK_BUTTON_W, ACE_BACK_BUTTON_H, () => {
      this.context.bus.emit('navigate', 'menu')
    }, this.context.textures)
    this.container.addChild(this.backdrop.view, this.scaled.wrap)
    this.scaled.inner.addChild(this.title, this.subtitle, this.board, this.overlay, this.backButton)

    this.title.anchor.set(0.5, 0)
    this.subtitle.anchor.set(0.5, 0)
    this.overlay.anchor.set(0.5, 0)

    for (let index = 0; index < STACK_COUNT; index += 1) {
      const stackBase = new Graphics()
        .roundRect(0, 0, ACE_STACK_BASE_WIDTH, ACE_STACK_BASE_HEIGHT, ACE_STACK_BASE_CORNER_RADIUS)
        .fill({ color: ACE_STACK_BASE_FILL, alpha: ACE_STACK_BASE_FILL_ALPHA })
        .stroke({ width: ACE_STACK_BASE_STROKE_WIDTH, color: ACCENT_COLOR, alpha: ACE_STACK_BASE_STROKE_ALPHA })

      this.stackBases.push(stackBase)
      this.board.addChild(stackBase)
    }

    for (let index = 0; index < CARD_COUNT; index += 1) {
      const root = new Container()
      const card = new Sprite(this.context.textures.card)
      const glow = new Sprite(this.context.textures.cardGlow)
      const cardScale = ACE_CARD_TEXTURE_SCALE

      card.anchor.set(CARD_FACE_ANCHOR_X, CARD_FACE_ANCHOR_Y)
      glow.anchor.set(CARD_FACE_ANCHOR_X, CARD_FACE_ANCHOR_Y)
      card.scale.set(cardScale)
      glow.scale.set(cardScale)
      glow.position.set(0, 0)
      root.addChild(card, glow)

      const cardState: CardStackState = {
        stackIndex: index % STACK_COUNT,
        root,
        card,
        glow,
        order: Math.floor(index / STACK_COUNT),
        phase: index * ACE_CARD_INITIAL_PHASE_STEP,
      }

      this.cards.push(cardState)
      this.board.addChild(root)
    }

    for (let index = 0; index < ACE_BURST_POOL; index += 1) {
      const sprite = new Sprite(this.context.textures.particleSpark)

      sprite.anchor.set(0.5)
      sprite.visible = false
      sprite.blendMode = 'add'
      this.burstLayer.addChild(sprite)
      this.bursts.push({
        sprite,
        vx: 0,
        vy: 0,
        life: 0,
        age: 0,
        active: false,
      })
    }

    this.board.addChild(this.burstLayer)
    this.syncCardsToStacks()
  }

  activate(): void {
    this.container.visible = true
  }

  deactivate(): void {
    this.container.visible = false
  }

  resize(size: Size): void {
    this.backdrop.resize(size)
    this.scaled.applyResize(size)

    const { boardWidth, offsetX, offsetY } = getAceBoardLayout()

    this.title.position.set(DESIGN_WIDTH / 2, offsetY + ACE_TITLE_Y_OFFSET)
    this.subtitle.position.set(DESIGN_WIDTH / 2, offsetY + ACE_SUBTITLE_Y_OFFSET)
    this.board.position.set(offsetX + ACE_BOARD_INSET_X, offsetY + ACE_BOARD_INSET_Y)
    this.overlay.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT - ACE_OVERLAY_BOTTOM_OFFSET)
    this.backButton.position.set(ACE_BACK_BUTTON_X, DESIGN_HEIGHT - ACE_BACK_BUTTON_BOTTOM_OFFSET)

    const gap = getAceStackGap(boardWidth)
    this.stackPositions.length = 0

    for (let index = 0; index < STACK_COUNT; index += 1) {
      const x = index * gap
      const y = ACE_STACK_BASE_Y + Math.sin(index * ACE_STACK_BASE_WAVE_PHASE) * ACE_STACK_BASE_WAVE_AMPLITUDE

      this.stackPositions.push({ x, y })
      this.stackBases[index].position.set(x - ACE_STACK_BASE_HALF_WIDTH, y)
    }

    this.syncCardsToStacks()
  }

  update(deltaMs: number): void {
    this.accumulatedMoveTime += deltaMs

    while (this.accumulatedMoveTime >= CARD_MOVE_INTERVAL_MS) {
      this.accumulatedMoveTime -= CARD_MOVE_INTERVAL_MS
      this.startMove()
    }

    this.activeMoves.forEach((move) => {
      move.elapsedMs += deltaMs
      const progress = Math.min(move.elapsedMs / CARD_MOVE_DURATION_MS, 1)
      const start = this.getCardPosition(move.fromStackIndex, move.startOrder)
      const end = this.getCardPosition(move.toStackIndex, move.targetOrder)
      const lift = Math.sin(progress * Math.PI) * ACE_CARD_MOVE_ARC_LIFT

      move.card.root.position.set(
        start.x + (end.x - start.x) * progress,
        start.y - (start.y - end.y) * progress - lift,
      )
    })

    for (let index = this.activeMoves.length - 1; index >= 0; index -= 1) {
      const move = this.activeMoves[index]

      if (move.elapsedMs < CARD_MOVE_DURATION_MS) {
        continue
      }

      const land = this.getCardPosition(move.toStackIndex, move.targetOrder)

      this.spawnBurst(land.x, land.y)
      move.card.stackIndex = move.toStackIndex
      move.card.order = move.targetOrder
      this.activeMoves.splice(index, 1)
    }

    this.syncCardsToStacks()
    this.updateCardIdleMotion(deltaMs)
    this.updateBurstParticles(deltaMs)
    this.overlay.text = `Cursed deck in motion · active flights ${this.activeMoves.length} · ember motes ${this.bursts.filter((b) => b.active).length}`
  }

  private updateCardIdleMotion(deltaMs: number): void {
    const moving = new Set(this.activeMoves.map((m) => m.card))

    this.cards.forEach((entry) => {
      entry.phase += deltaMs * ACE_IDLE_PHASE_SPEED
      const isMoving = moving.has(entry)

      const wobble =
        Math.sin(entry.phase * ACE_IDLE_WOBBLE_PHASE_MULT) *
        (isMoving ? ACE_IDLE_WOBBLE_MOVING : ACE_IDLE_WOBBLE_REST)
      const pulse =
        1 +
        Math.sin(
          entry.phase * ACE_IDLE_PULSE_PHASE_MULT +
            entry.order * ACE_IDLE_PULSE_ORDER_PHASE,
        ) *
          (isMoving ? ACE_IDLE_PULSE_MOVING : ACE_IDLE_PULSE_REST)

      const baseScale = ACE_CARD_TEXTURE_SCALE * pulse

      entry.card.rotation = wobble
      entry.card.scale.set(baseScale)
      entry.glow.scale.set(baseScale)
      entry.glow.rotation = wobble
      entry.glow.alpha = isMoving
        ? ACE_IDLE_GLOW_ALPHA_MOVING_BASE +
          Math.sin(entry.phase * ACE_IDLE_GLOW_WAVE_MOVING) * ACE_IDLE_GLOW_ALPHA_MOVING_AMP
        : ACE_IDLE_GLOW_ALPHA_REST_BASE +
          Math.sin(entry.phase * ACE_IDLE_GLOW_WAVE_REST) * ACE_IDLE_GLOW_ALPHA_REST_AMP

      const heat = (Math.sin(entry.phase * ACE_IDLE_HEAT_PHASE_MULT) + 1) / 2
      const fireTint = lerpRgb(ACE_CARD_TINT_HOT, ACE_CARD_TINT_COOL, heat)

      entry.card.tint = fireTint
      entry.glow.tint = lerpRgb(ACE_GLOW_TINT_HOT, ACE_GLOW_TINT_COOL, heat)
    })
  }

  private spawnBurst(x: number, y: number): void {
    let spawned = 0

    for (const particle of this.bursts) {
      if (spawned >= ACE_BURST_PER_LAND) {
        break
      }

      if (particle.active) {
        continue
      }

      const angle = Math.random() * Math.PI * 2
      const speed = ACE_BURST_SPEED_MIN + Math.random() * ACE_BURST_SPEED_RANGE

      particle.active = true
      particle.age = 0
      particle.life = ACE_BURST_LIFE_MIN + Math.random() * ACE_BURST_LIFE_RANGE
      particle.vx = Math.cos(angle) * speed
      particle.vy = Math.sin(angle) * speed - ACE_BURST_UPWARD_BIAS
      particle.sprite.visible = true
      particle.sprite.position.set(x, y + (Math.random() - 0.5) * ACE_BURST_SPAWN_JITTER_Y)
      particle.sprite.alpha = 1
      particle.sprite.scale.set(ACE_BURST_SCALE_MIN + Math.random() * ACE_BURST_SCALE_RANGE)
      particle.sprite.tint = lerpRgb(ACE_BURST_TINT_HI, ACE_BURST_TINT_LO, Math.random())
      spawned += 1
    }
  }

  private updateBurstParticles(deltaMs: number): void {
    for (const particle of this.bursts) {
      if (!particle.active) {
        continue
      }

      particle.age += deltaMs

      if (particle.age >= particle.life) {
        particle.active = false
        particle.sprite.visible = false

        continue
      }

      const dt = deltaMs * ACE_BURST_DT_MULT

      particle.sprite.x += particle.vx * dt
      particle.sprite.y += particle.vy * dt
      particle.vy += ACE_BURST_GRAVITY * dt
      particle.sprite.alpha = 1 - particle.age / particle.life
      particle.sprite.rotation += deltaMs * ACE_BURST_ROTATION_SPEED
    }
  }

  private startMove(): void {
    const stackSizes = this.getStackSizes()
    const sourceIndex = stackSizes.findIndex((count) => count > 0)

    if (sourceIndex === -1) {
      return
    }

    const sourceCards = this.cards
      .filter((card) => card.stackIndex === sourceIndex && !this.activeMoves.some((move) => move.card === card))
      .sort((left, right) => right.order - left.order)
    const topCard = sourceCards[0]

    if (!topCard) {
      return
    }

    const targetIndex = (sourceIndex + 1 + Math.floor(Math.random() * (STACK_COUNT - 1))) % STACK_COUNT
    const targetOrder = stackSizes[targetIndex]

    topCard.stackIndex = -1
    this.activeMoves.push({
      card: topCard,
      fromStackIndex: sourceIndex,
      toStackIndex: targetIndex,
      startOrder: topCard.order,
      targetOrder,
      elapsedMs: 0,
    })
  }

  private getStackSizes(): number[] {
    return Array.from({ length: STACK_COUNT }, (_, index) =>
      this.cards.filter((card) => card.stackIndex === index).length,
    )
  }

  private getCardPosition(stackIndex: number, order: number): { x: number; y: number } {
    const stackPosition = this.stackPositions[stackIndex] ?? { x: 0, y: 0 }

    return {
      x: stackPosition.x,
      y: stackPosition.y - order * ACE_CARD_STACK_VERTICAL_GAP,
    }
  }

  private syncCardsToStacks(): void {
    const stackCards = Array.from({ length: STACK_COUNT }, () => [] as CardStackState[])

    this.cards
      .filter((card) => card.stackIndex >= 0)
      .forEach((card) => {
        stackCards[card.stackIndex]?.push(card)
      })

    stackCards.forEach((items, stackIndex) => {
      items
        .sort((left, right) => left.order - right.order)
        .forEach((card, order) => {
          card.order = order
          const target = this.getCardPosition(stackIndex, order)

          if (this.activeMoves.some((move) => move.card === card)) {
            return
          }

          card.root.position.set(target.x, target.y)
        })
    })
  }
}
