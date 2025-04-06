export type BountyStatus = "draft" | "active" | "completed" | "cancelled";

export type BountyType = "community" | "funded";

export interface BountyExpectedOutput {
  format: string;
  schema: any;
}

export enum EvaluationCriteriaType {
  ManualReview = "manual-review",
  Automated = "automated",
  TestCases = "test-cases",
}

export interface EvaluationCriteria {
  type: EvaluationCriteriaType;
  criteria: string;
}
