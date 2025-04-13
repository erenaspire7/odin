import { z } from "zod";

export interface EvaluationCriteria {
  type: EvaluationCriteriaType;
  criteria: string;
}

export const BountyExpectedOutputFormatEnum = z.enum(["json"]);

export const BountyTypeSchema = z.enum(["pool", "funded"]);

export const EvaluationCriteriaTypeEnum = z.enum([
  "manual-review",
  "automated",
  "test-cases",
]);

export const BountyStatusSchema = z.enum([
  "draft",
  "active",
  "completed",
  "cancelled",
]);

const BountyPrizeDistributionEnum = z.enum([
  "equal",
  "weighted",
  "winner-takes-all",
  "custom",
]);

const BountyDifficultyEnum = z.enum(["Easy", "Medium", "Hard"]);

export const BountyExpectedOutputSchema = z.object({
  format: BountyExpectedOutputFormatEnum,
  schema: z.record(z.string(), z.any()),
});

export const BountyEvaluationCriteriaSchema = z.object({
  type: EvaluationCriteriaTypeEnum,
  criteria: z.string(),
});

export const BountyPrizeSchema = z.object({
  amount: z.number().min(0),
  distribution: BountyPrizeDistributionEnum,
});

export type BountyExpectedOutput = z.infer<typeof BountyExpectedOutputSchema>;

export type BountyType = z.infer<typeof BountyTypeSchema>;

export type BountyStatus = z.infer<typeof BountyStatusSchema>;

export type EvaluationCriteriaType = z.infer<typeof EvaluationCriteriaTypeEnum>;

export type BountyEvaluationCriteria = z.infer<
  typeof BountyEvaluationCriteriaSchema
>;

export type BountyPrize = z.infer<typeof BountyPrizeSchema>;

export type BountyDifficulty = z.infer<typeof BountyDifficultyEnum>;
