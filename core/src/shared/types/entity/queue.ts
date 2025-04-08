export enum JobType {
  ORCHESTRATE_EVALUATION = "orchestrate_evaluation",
  EXECUTE_EVALUATION = "execute_evaluation",
  EXECUTE_NODE = "execute_node",
  WEB_SEARCH = "web_search",
  LLM_PROMPT = "llm_prompt",
}

export enum JobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface QueueJobPayload {
  type: JobType;
  payload: any;
  options: any;
}
