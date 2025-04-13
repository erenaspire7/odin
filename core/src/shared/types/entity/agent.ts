import { z } from "zod";

// Defining the EdgeRelationship enum in Zod
const EdgeRelationshipEnum = z.enum([
  "follows",
  "depends_on",
  "alternative_to",
  "supports",
  "contradicts",
]);

// Edge schema
const EdgeSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  relationship: EdgeRelationshipEnum,
  weight: z.number().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// GraphNode schema
const GraphNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.string(), // categorical classifer
  description: z.string(), // human-readable label
  content: z.string(), // details for the step
  metadata: z.record(z.string(), z.any()).optional(),
});

// ChainOfThought schema
const ChainOfThoughtSchema = z.object({
  format: z.string(),
  nodes: z.array(GraphNodeSchema),
  edges: z.array(EdgeSchema),
});

// ExecutionMetrics schema
const ExecutionMetricsSchema = z.object({
  totalTime: z.number(),
  stepCount: z.number(),
});

// AgenticResponse schema
export const AgenticResponseSchema = z.object({
  agentId: z.string(),
  timestamp: z.number(),
  finalAnswer: z.any(),
  confidenceScore: z.number(),
  executionMetrics: ExecutionMetricsSchema,
  chainOfThought: ChainOfThoughtSchema,
  metadata: z.record(z.string(), z.any()).optional(),
});

export const AgenticResponseHeaderSchema = z.object({
  signature: z.string(),
});

// Inferred types will match your original interfaces
export type AgenticResponseType = z.infer<typeof AgenticResponseSchema>;
// type ExecutionMetricsType = z.infer<typeof ExecutionMetricsSchema>;
// type ChainOfThoughtType = z.infer<typeof ChainOfThoughtSchema>;
export type GraphNodeType = z.infer<typeof GraphNodeSchema>;
// type EdgeType = z.infer<typeof EdgeSchema>;
// type EdgeRelationshipType = z.infer<typeof EdgeRelationshipEnum>;
