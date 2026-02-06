import {
  Rarity,
  Attribute,
  CardType,
  EquipmentType,
  SceneType,
  SceneStatus,
  CheckResult,
  CalcMode,
  SlotType,
  Difficulty,
} from './enums'

export type Attributes = Record<Attribute, number>

export interface SpecialAttributes {
  support?: number
  reroll?: number
}

export interface AttributeBonus {
  [key: string]: number
}

export interface Card {
  card_id: string
  name: string
  type: CardType
  rarity: Rarity
  description: string
  image: string
  attributes?: Attributes
  special_attributes?: SpecialAttributes
  tags?: string[]
  equipment_slots?: number
  equipment_type?: EquipmentType
  attribute_bonus?: AttributeBonus
  special_bonus?: SpecialAttributes
  gem_slots?: number
}

export interface CardInstance extends Card {
  instance_id: string
  equipped_items?: string[]
  current_tags: string[]
}

export interface Slot {
  type: SlotType
  required: boolean
  locked: boolean
  slot_index?: number
}

export interface SlotState extends Slot {
  invested_card_id?: string
}

export interface CheckConfig {
  attribute: Attribute
  calc_mode: CalcMode
  target: number
  slot_index?: number
}

export interface Effects {
  gold?: number
  reputation?: number
  cards_add?: string[]
  cards_remove?: string[]
  tags_add?: Record<string, string[]>
  tags_remove?: Record<string, string[]>
  unlock_scenes?: string[]
  consume_invested?: boolean
  golden_dice?: number
  rewind_charges?: number
}

export interface ResultBranch {
  narrative: string
  effects: Effects
}

export interface DiceCheckSettlement {
  type: 'dice_check'
  narrative?: string
  check: CheckConfig
  results: {
    success: ResultBranch
    partial_success?: ResultBranch
    failure: ResultBranch
    critical_failure: ResultBranch
  }
}

export interface TradeSettlement {
  type: 'trade'
  shop_inventory: string[]
  allow_sell: boolean
  refresh_cycle?: number
}

export interface ChoiceOption {
  label: string
  effects: Effects
  conditions?: UnlockConditions
}

export interface ChoiceSettlement {
  type: 'choice'
  options: ChoiceOption[]
}

export type Settlement = DiceCheckSettlement | TradeSettlement | ChoiceSettlement

export interface UnlockConditions {
  reputation_min?: number
  reputation_max?: number
  required_tags?: string[]
  required_cards?: string[]
  completed_scenes?: string[]
}

export interface AbsencePenalty {
  effects: Effects
  narrative: string
}

export interface Scene {
  scene_id: string
  name: string
  description: string
  background_image: string
  type: SceneType
  duration: number
  slots: Slot[]
  settlement: Settlement
  unlock_conditions?: UnlockConditions
  absence_penalty?: AbsencePenalty | null
}

export interface SceneState {
  scene_id: string
  status: SceneStatus
  remaining_turns: number
  invested_cards: string[]
  slot_states: SlotState[]
}

export interface GameState {
  current_day: number
  execution_countdown: number
  gold: number
  reputation: number
  rewind_charges: number
  golden_dice: number
  think_charges: number
}

export interface CardsState {
  hand: string[]
  equipped: Record<string, string[]>
  locked_in_scenes: Record<string, string[]>
  think_used_today: string[]
}

export interface ScenesState {
  active: string[]
  completed: string[]
  unlocked: string[]
  scene_states: Record<string, SceneState>
}

export interface SaveData {
  save_id: string
  timestamp: string
  game_state: GameState
  cards: CardsState
  scenes: ScenesState
  achievements_unlocked: string[]
  npc_relations: Record<string, number>
  difficulty: Difficulty
  random_seed: string
}

export interface DiceRoll {
  value: number
  is_success: boolean
  is_explosion: boolean
  is_rerolled: boolean
  original_value?: number
}

export interface DiceCheckState {
  dice_pool: number
  target: number
  rolls: DiceRoll[]
  explosion_rolls: DiceRoll[]
  reroll_available: number
  reroll_used: number
  golden_dice_used: number
  success_count: number
  result?: CheckResult
  phase: 'rolling' | 'reroll' | 'golden_dice' | 'result'
}

export interface SettlementResult {
  scene_id: string
  settlement_type: 'dice_check' | 'trade' | 'choice'
  check_result?: CheckResult
  effects_applied: Effects
  narrative: string
  cards_returned: string[]
  cards_consumed: string[]
}

export interface ThinkResult {
  card_id: string
  effects: Effects
  narrative: string
}

export type GamePhase = 'dawn' | 'action' | 'settlement' | 'game_over'

export interface GameEndState {
  is_victory: boolean
  ending_type: 'main_victory' | 'survival_victory' | 'hidden_ending' | 'execution_failure' | 'death_failure'
  message: string
}

export * from './enums'
