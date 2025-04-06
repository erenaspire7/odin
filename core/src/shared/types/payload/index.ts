import { z } from "zod";
import {
  BountyExpectedOutputSchema,
  BountyTypeSchema,
  BountyEvaluationCriteriaSchema,
  BountyPrizeSchema,
  BountyStatusSchema,
} from "@odin/core/types";

export interface RegisterUserPayload {
  walletAddress: string;
}

export interface EnrollAgentPayload {
  bountyId: string;
  walletAddress: string;
}

export const EnrollAgentSchema = z.object({
  bountyId: z.string().uuid(),
});

export const CreateBountyPayloadSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(2).max(1000),
  expectedOutput: BountyExpectedOutputSchema,
  evaluationCriteria: BountyEvaluationCriteriaSchema,
  prize: BountyPrizeSchema,
  type: BountyTypeSchema,
  expiresAt: z.date(),
  status: BountyStatusSchema,
});

export type CreateBountyPayload = z.infer<typeof CreateBountyPayloadSchema>;
