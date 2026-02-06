import { z } from 'zod'
import {
  Rarity,
  Attribute,
  CardType,
  EquipmentType,
  SceneType,
  SceneStatus,
  CalcMode,
  SlotType,
} from '@/core/types/enums'

const RaritySchema = z.nativeEnum(Rarity)
const AttributeSchema = z.nativeEnum(Attribute)
const CardTypeSchema = z.nativeEnum(CardType)
const EquipmentTypeSchema = z.nativeEnum(EquipmentType)
const SceneTypeSchema = z.nativeEnum(SceneType)
const SceneStatusSchema = z.nativeEnum(SceneStatus)
const CalcModeSchema = z.nativeEnum(CalcMode)
const SlotTypeSchema = z.nativeEnum(SlotType)

export const AttributesSchema = z.object({
  [Attribute.Physique]: z.number().int().min(1).max(50),
  [Attribute.Charm]: z.number().int().min(1).max(50),
  [Attribute.Wisdom]: z.number().int().min(1).max(50),
  [Attribute.Combat]: z.number().int().min(1).max(50),
  [Attribute.Social]: z.number().int().min(1).max(50),
  [Attribute.Survival]: z.number().int().min(1).max(50),
  [Attribute.Stealth]: z.number().int().min(1).max(50),
  [Attribute.Magic]: z.number().int().min(1).max(50),
})

export const SpecialAttributesSchema = z.object({
  support: z.number().int().min(-10).max(10).optional(),
  reroll: z.number().int().min(0).max(10).optional(),
})

export const AttributeBonusSchema = z.record(z.string(), z.number())

export const CardSchema = z.object({
  card_id: z.string().min(1),
  name: z.string().min(1),
  type: CardTypeSchema,
  rarity: RaritySchema,
  description: z.string(),
  image: z.string(),
  attributes: AttributesSchema.optional(),
  special_attributes: SpecialAttributesSchema.optional(),
  tags: z.array(z.string()).optional(),
  equipment_slots: z.number().int().min(0).max(10).optional(),
  equipment_type: EquipmentTypeSchema.optional(),
  attribute_bonus: AttributeBonusSchema.optional(),
  special_bonus: SpecialAttributesSchema.optional(),
  gem_slots: z.number().int().min(0).max(5).optional(),
}).refine(
  (data) => {
    if (data.type === CardType.Character) {
      return data.attributes !== undefined && data.equipment_slots !== undefined
    }
    return true
  },
  { message: 'Character cards must have attributes and equipment_slots' }
).refine(
  (data) => {
    if (data.type === CardType.Equipment) {
      return data.equipment_type !== undefined
    }
    return true
  },
  { message: 'Equipment cards must have equipment_type' }
)

export const SlotSchema = z.object({
  type: SlotTypeSchema,
  required: z.boolean(),
  locked: z.boolean(),
  slot_index: z.number().int().min(0).optional(),
})

export const CheckConfigSchema = z.object({
  attribute: AttributeSchema,
  calc_mode: CalcModeSchema,
  target: z.number().int().min(1),
  slot_index: z.number().int().min(0).optional(),
})

export const EffectsSchema = z.object({
  gold: z.number().int().optional(),
  reputation: z.number().int().optional(),
  cards_add: z.array(z.string()).optional(),
  cards_remove: z.array(z.string()).optional(),
  tags_add: z.record(z.string(), z.array(z.string())).optional(),
  tags_remove: z.record(z.string(), z.array(z.string())).optional(),
  unlock_scenes: z.array(z.string()).optional(),
  consume_invested: z.boolean().optional(),
  golden_dice: z.number().int().optional(),
  rewind_charges: z.number().int().optional(),
})

export const ResultBranchSchema = z.object({
  narrative: z.string(),
  effects: EffectsSchema,
})

export const DiceCheckSettlementSchema = z.object({
  type: z.literal('dice_check'),
  narrative: z.string().optional(),
  check: CheckConfigSchema,
  results: z.object({
    success: ResultBranchSchema,
    partial_success: ResultBranchSchema.optional(),
    failure: ResultBranchSchema,
    critical_failure: ResultBranchSchema,
  }),
})

export const TradeSettlementSchema = z.object({
  type: z.literal('trade'),
  shop_inventory: z.array(z.string()),
  allow_sell: z.boolean(),
  refresh_cycle: z.number().int().min(1).optional(),
})

export const UnlockConditionsSchema = z.object({
  reputation_min: z.number().int().min(0).max(100).optional(),
  reputation_max: z.number().int().min(0).max(100).optional(),
  required_tags: z.array(z.string()).optional(),
  required_cards: z.array(z.string()).optional(),
  completed_scenes: z.array(z.string()).optional(),
})

export const ChoiceOptionSchema = z.object({
  label: z.string().min(1),
  effects: EffectsSchema,
  conditions: UnlockConditionsSchema.optional(),
})

export const ChoiceSettlementSchema = z.object({
  type: z.literal('choice'),
  options: z.array(ChoiceOptionSchema).min(1),
})

export const SettlementSchema = z.discriminatedUnion('type', [
  DiceCheckSettlementSchema,
  TradeSettlementSchema,
  ChoiceSettlementSchema,
])

export const AbsencePenaltySchema = z.object({
  effects: EffectsSchema,
  narrative: z.string(),
})

export const SceneSchema = z.object({
  scene_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  background_image: z.string(),
  type: SceneTypeSchema,
  duration: z.number().int().min(1),
  slots: z.array(SlotSchema),
  settlement: SettlementSchema,
  unlock_conditions: UnlockConditionsSchema.optional(),
  absence_penalty: AbsencePenaltySchema.nullable().optional(),
})

export const GameStateSchema = z.object({
  current_day: z.number().int().min(1),
  execution_countdown: z.number().int().min(0),
  gold: z.number().int().min(0),
  reputation: z.number().int().min(0).max(100),
  rewind_charges: z.number().int().min(0),
  golden_dice: z.number().int().min(0),
  think_charges: z.number().int().min(0),
})

export const CardsStateSchema = z.object({
  hand: z.array(z.string()),
  equipped: z.record(z.string(), z.array(z.string())),
  locked_in_scenes: z.record(z.string(), z.array(z.string())),
  think_used_today: z.array(z.string()),
})

export const SceneStateSchema = z.object({
  scene_id: z.string(),
  status: SceneStatusSchema,
  remaining_turns: z.number().int().min(0),
  invested_cards: z.array(z.string()),
  slot_states: z.array(SlotSchema.extend({
    invested_card_id: z.string().optional(),
  })),
})

export const ScenesStateSchema = z.object({
  active: z.array(z.string()),
  completed: z.array(z.string()),
  unlocked: z.array(z.string()),
  scene_states: z.record(z.string(), SceneStateSchema),
})

const DifficultySchema = z.enum(['easy', 'normal', 'hard', 'nightmare'])

export const SaveDataSchema = z.object({
  save_id: z.string().min(1),
  timestamp: z.string().datetime(),
  game_state: GameStateSchema,
  cards: CardsStateSchema,
  scenes: ScenesStateSchema,
  achievements_unlocked: z.array(z.string()),
  npc_relations: z.record(z.string(), z.number()),
  difficulty: DifficultySchema,
  random_seed: z.string(),
})

export type CardSchemaType = z.infer<typeof CardSchema>
export type SceneSchemaType = z.infer<typeof SceneSchema>
export type SaveDataSchemaType = z.infer<typeof SaveDataSchema>
