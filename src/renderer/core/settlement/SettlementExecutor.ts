import type { Scene, SettlementResult, Effects, CheckResult, DiceCheckSettlement, TradeSettlement, ChoiceSettlement } from '@/core/types'
import { SceneType } from '@/core/types'
import type { CardManager } from '@/core/card/CardManager'
import type { PlayerState } from '@/core/player/PlayerState'
import type { SceneManager } from '@/core/scene/SceneManager'
import { EffectApplier } from './EffectApplier'
import { DiceChecker } from './DiceChecker'
import { calculateDicePool, calculateTotalReroll } from './DicePoolCalculator'
import type { CardModel } from '@/core/card/CardModel'
import { emit } from '@/lib/events'

export class SettlementExecutor {
  private effectApplier: EffectApplier
  private diceChecker: DiceChecker

  constructor(
    private playerState: PlayerState,
    private cardManager: CardManager,
    private sceneManager: SceneManager
  ) {
    this.effectApplier = new EffectApplier(playerState, cardManager, sceneManager)
    this.diceChecker = new DiceChecker()
  }

  settleScene(sceneId: string): SettlementResult | null {
    const scene = this.sceneManager.getScene(sceneId)
    const state = this.sceneManager.getSceneState(sceneId)
    
    if (!scene || !state) {
      return null
    }

    this.sceneManager.markSettling(sceneId)
    
    const investedCards = state.invested_cards
      .map(id => this.cardManager.getCard(id))
      .filter((card): card is CardModel => card !== undefined)

    let result: SettlementResult

    switch (scene.settlement.type) {
      case 'dice_check':
        result = this.settleDiceCheck(scene, scene.settlement, investedCards)
        break
      case 'trade':
        result = this.settleTrade(scene, scene.settlement)
        break
      case 'choice':
        result = this.settleChoice(scene, scene.settlement, 0)
        break
      default:
        throw new Error('Unknown settlement type')
    }

    const returnedCards = this.sceneManager.completeScene(sceneId, this.cardManager)
    result.cards_returned = returnedCards.filter(id => 
      !result.cards_consumed.includes(id)
    )

    emit('scene:settle', { sceneId, result })
    
    return result
  }

  settleDiceCheck(
    scene: Scene, 
    settlement: DiceCheckSettlement,
    investedCards: CardModel[]
  ): SettlementResult {
    const { check, results } = settlement
    const investedCardIds = investedCards.map(c => c.instance_id)

    const dicePool = calculateDicePool(
      investedCards,
      check.attribute,
      check.calc_mode,
      check.slot_index
    )
    const rerollCount = calculateTotalReroll(investedCards, [])

    this.diceChecker.startCheck(dicePool, check.target, rerollCount)
    this.diceChecker.rollInitial()
    const checkState = this.diceChecker.finalize()
    const checkResult = checkState.result!

    let branch = results[checkResult]
    if (!branch && checkResult === 'partial_success') {
      branch = results.failure
    }

    this.effectApplier.apply(branch.effects, investedCardIds)

    const consumedCards: string[] = []
    if (branch.effects.consume_invested) {
      consumedCards.push(...investedCardIds)
    }

    return {
      scene_id: scene.scene_id,
      settlement_type: 'dice_check',
      check_result: checkResult,
      effects_applied: branch.effects,
      narrative: branch.narrative,
      cards_returned: [],
      cards_consumed: consumedCards,
    }
  }

  settleTrade(scene: Scene, _settlement: TradeSettlement): SettlementResult {
    return {
      scene_id: scene.scene_id,
      settlement_type: 'trade',
      effects_applied: {},
      narrative: 'Trade completed.',
      cards_returned: [],
      cards_consumed: [],
    }
  }

  settleChoice(
    scene: Scene,
    settlement: ChoiceSettlement,
    optionIndex: number,
    investedCardIds?: string[]
  ): SettlementResult {
    const option = settlement.options[optionIndex]
    if (!option) {
      throw new Error('Invalid option index')
    }

    this.effectApplier.apply(option.effects, investedCardIds)

    return {
      scene_id: scene.scene_id,
      settlement_type: 'choice',
      effects_applied: option.effects,
      narrative: option.label,
      cards_returned: [],
      cards_consumed: [],
    }
  }

  applyAbsencePenalty(sceneId: string): void {
    const scene = this.sceneManager.getScene(sceneId)
    if (!scene || !scene.absence_penalty) {
      return
    }

    this.effectApplier.apply(scene.absence_penalty.effects)
    this.sceneManager.expireScene(sceneId)
  }

  getDiceChecker(): DiceChecker {
    return this.diceChecker
  }
}
