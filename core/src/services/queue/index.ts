import { LLMJudgeService } from "@odin/core/services";
import { Bounty } from "@odin/core/db";
import {
  JobType,
  AgenticResponseType,
  OrchestrationNode,
  OrchestrationEdge,
} from "@odin/core/types";
import { EntityManager } from "@mikro-orm/core";

import { Queue, Worker, ConnectionOptions, Job, FlowProducer } from "bullmq";

export class QueueService {
  private llmJudgeService: LLMJudgeService;
  private connection: ConnectionOptions;
  private queues: Record<JobType, Queue>;
  private workers: Record<JobType, Worker>;
  private flowProducer: FlowProducer;
  private entityManager: EntityManager;

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
    this.llmJudgeService = new LLMJudgeService();
    this.queues = {} as Record<JobType, Queue>;
    this.workers = {} as Record<JobType, Worker>;
    
    this.connection = {
      url: process.env.REDIS_URL,
    };

    this.flowProducer = new FlowProducer({ connection: this.connection });

    Object.values(JobType).forEach((jobType) => {
      this.queues[jobType] = new Queue(`${jobType}`, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });

      this.workers[jobType] = new Worker(
        `${jobType}`,
        async (job) => {
          // Use RequestContext to ensure database connections are managed properly
          switch (jobType) {
            case JobType.ORCHESTRATE_EVALUATION:
              return await this.handleOrchestrationJob(job);
            case JobType.EXECUTE_EVALUATION:
              return await this.handleExecuteEvaluationJob(job);
            case JobType.EXECUTE_NODE:
              return await this.handleExecuteNodeJob(job);
            case JobType.WEB_SEARCH:
              return await this.handleWebSearchJob(job);
            case JobType.LLM_PROMPT:
              return await this.handleLLMPromptJob(job);
            default:
              throw new Error(`No handler registered for job type: ${jobType}`);
          }
        },
        { connection: this.connection },
      );

      // Set up event handlers for the worker
      this.workers[jobType].on("completed", (job: Job, result: any) => {
        console.log(`Job ${job.id} of type ${jobType} completed successfully`);
      });

      this.workers[jobType].on(
        "failed",
        (job: Job | undefined, error: Error) => {
          if (job) {
            console.error(`Job ${job.id} of type ${jobType} failed:`, error);
            console.log(`Attempts: ${job.attemptsMade}/${job.opts.attempts}`);
          }
        },
      );
    });
  }

  async enqueueOrchestrationJob(
    bountyId: string,
    agenticResponse: AgenticResponseType,
    options: { priority?: number; maxAttempts?: number } = {},
  ) {
    return await this.queues[JobType.ORCHESTRATE_EVALUATION].add(
      "orchestrate",
      { bountyId, agenticResponse },
      {
        priority: options.priority,
        attempts: options.maxAttempts || 3,
      },
    );
  }

  async enqueueEvaluationJob(
    orchestrationPayload: any,
    agenticResponse: AgenticResponseType,
  ) {
    return await this.queues[JobType.EXECUTE_EVALUATION].add("evaluate", {
      orchestrationPayload,
      agenticResponse,
    });
  }

  async enqueueNodeExecution(node: OrchestrationNode, stepInput: any) {
    const type =
      node.type === "web_search"
        ? JobType.WEB_SEARCH
        : node.type === "llm"
          ? JobType.LLM_PROMPT
          : JobType.EXECUTE_NODE;

    return await this.queues[type].add(node.id, {
      node,
      stepInput,
    });
  }

  async enqueueGraphExecution(
    nodes: OrchestrationNode[],
    edges: OrchestrationEdge[],
    finalAnswer: any,
  ) {
    // First determine the execution order based on dependencies
    const sequence = this.llmJudgeService.constructDependencySequence(edges);

    const flowJobs = [];
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));

    for (const nodeId of sequence) {
      const node = nodeMap.get(nodeId)!;

      const queueName = this.getQueueNameForNodeType(node.type);

      const parents = edges
        .filter((edge) => edge.to === nodeId)
        .map((edge) => edge.from);

      const jobDef = {
        name: node.id,
        queueName,
        data: {
          node,
          // The stepInput will be populated by parent job results for jobs with dependencies
          // For jobs without dependencies, use the initial input
          stepInput: parents.length === 0 ? finalAnswer : undefined,
        },
        opts: {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: false,
        },
        children: [],
      };

      if (parents.length > 0) {
        // @ts-ignore
        jobDef.children = parents.map((parentId) => ({
          name: parentId,
          data: {
            parentOutput: true, // Flag to indicate this is a parent output
          },
          queueName, // Same queue for parent completion tracking
          opts: {
            attempts: 1,
            removeOnComplete: true,
          },
        }));
      }

      flowJobs.push(jobDef);
    }

    const flow = await this.flowProducer.add({
      name: "graph-execution",
      queueName: `${JobType.EXECUTE_EVALUATION}`,
      data: {
        graphId: `graph-${Date.now()}`,
        sequence,
      },
      children: flowJobs,
      opts: {
        attempts: 1,
        removeOnComplete: true,
      },
    });

    return {
      flowId: flow.job.id,
      nodeCount: nodes.length,
      sequence,
    };
  }

  private async handleOrchestrationJob(job: Job): Promise<any> {
    const { bountyId, agenticResponse } = job.data;
    const bounty = await this.entityManager.findOne(Bounty, { bountyId });

    if (!bounty) {
      throw new Error(`Bounty not found: ${bountyId}`);
    }

    const orchestrationPayload =
      await this.llmJudgeService.orchestrateAgenticEvaluation(
        bounty.evaluationCriteria,
        agenticResponse,
      );

    // Immediately queue the execution job after orchestration
    await this.enqueueEvaluationJob(orchestrationPayload, agenticResponse);

    return orchestrationPayload;
  }

  private async handleExecuteEvaluationJob(job: Job): Promise<any> {
    const { orchestrationPayload, agenticResponse } = job.data;

    // Instead of executing the whole evaluation at once, break it down into node executions
    const { graph } = orchestrationPayload;
    const { nodes, edges } = graph;

    // Queue the graph execution as a chain of jobs
    await this.enqueueGraphExecution(nodes, edges, agenticResponse.finalAnswer);

    return {
      status: "graph_execution_queued",
      nodeCount: nodes.length,
    };
  }

  private async handleExecuteNodeJob(job: Job): Promise<any> {
    const { node, stepInput } = job.data;

    // Execute the node
    const result = await this.llmJudgeService.executeNode(node, stepInput);

    return result;
  }

  private getQueueNameForNodeType(nodeType: string): string {
    switch (nodeType) {
      case "web_search":
        return `${JobType.WEB_SEARCH}`;
      case "llm":
        return `${JobType.LLM_PROMPT}`;
      default:
        return `${JobType.EXECUTE_NODE}`;
    }
  }

  private async handleWebSearchJob(job: Job): Promise<any> {
    const { node, stepInput } = job.data;
    return await this.llmJudgeService.executeWebSearch(node, stepInput);
  }

  private async handleLLMPromptJob(job: Job): Promise<any> {
    const { node, stepInput } = job.data;
    return await this.llmJudgeService.executeLLMPrompt(node, stepInput);
  }
}
