interface NodeTypeDefinitions {
  llm: {
    description: string;
    execution_method: string;
  };
  web_search: {
    description: string;
    execution_method: string;
  };
}

export interface Orchestration {
  node_type_definitions: NodeTypeDefinitions;
  graph: OrchestrationGraph;
}

interface OrchestrationGraph {
  nodes: OrchestrationNode[];
  edges: OrchestrationEdge[];
}

export interface OrchestrationNode {
  id: string;
  type: string;
  description: string;
  input: string[];
  output: string;
  search_parameters?: SearchParameters;
  prompt_template?: string;
  output_schema: string;
}

interface SearchParameters {
  query_template: string;
}

export interface OrchestrationEdge {
  from: string;
  to: string;
}
