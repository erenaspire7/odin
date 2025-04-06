export interface AgenticResponse {
  agentId: string;
  bountyId: string;
  timestamp: number;
  // should match expected output
  finalAnswer: any;
  confidenceScore: number;
  // easy to modify so not sure
  executionMetrics: ExecutionMetrics;
  chainOfThought: ChainOfThought;
  metadata?: Record<string, any>;
}

interface ExecutionMetrics {
  totalTime: number;
  stepCount: number;
}

interface GraphNode {
  id: string;
  type: string;
  description: string;
  content: string;
  edges: Edge[];
  metadata?: Record<string, any>;
}

interface Edge {
  sourceId: string; // The current node
  targetId: string; // The connected node
  relationship: EdgeRelationship;
  weight?: number; // Optional: strength/importance
  metadata?: Record<string, any>; // For any edge-specific data
}

enum EdgeRelationship {
  FOLLOWS = "follows", // Sequential step
  DEPENDS_ON = "depends_on", // Requires output from another node
  ALTERNATIVE_TO = "alternative_to", // Represents different reasoning paths
  SUPPORTS = "supports", // Provides evidence for another node
  CONTRADICTS = "contradicts", // Challenges another node
}

interface ChainOfThought {
  format: string;
  nodes: GraphNode[];
}
