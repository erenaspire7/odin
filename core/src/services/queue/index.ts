import { LLMJudgeService } from "@odin/core/services";
import { RequestContext } from "@mikro-orm/core";
import { QueueRepository, QueueJob, Bounty } from "@odin/core/db";
import {
  JobType,
  AgenticResponseType,
  OrchestrationNode,
} from "@odin/core/types";
import { EntityManager } from "@mikro-orm/core";

export class QueueService {
  private handlers: Record<JobType, (job: QueueJob) => Promise<any>> =
    {} as Record<JobType, (job: QueueJob) => Promise<any>>;

  private running = false;
  private entityManager: EntityManager;
  private llmJudgeService: LLMJudgeService;
  private queueRepository: QueueRepository;

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
    this.llmJudgeService = new LLMJudgeService();
    this.queueRepository = entityManager.getRepository(QueueJob);

    // Register job handlers
    this.registerHandlers();
  }

  private registerHandlers() {
    this.handlers[JobType.ORCHESTRATE_EVALUATION] =
      this.handleOrchestrationJob.bind(this);
    this.handlers[JobType.EXECUTE_EVALUATION] =
      this.handleExecuteEvaluationJob.bind(this);
    this.handlers[JobType.EXECUTE_NODE] = this.handleExecuteNodeJob.bind(this);
    this.handlers[JobType.WEB_SEARCH] = this.handleWebSearchJob.bind(this);
    this.handlers[JobType.LLM_PROMPT] = this.handleLLMPromptJob.bind(this);
  }

  async processNextBatch(batchSize = 5) {
    let processed = 0;

    await RequestContext.create(this.entityManager, async () => {
      for (let i = 0; i < batchSize; i++) {
        const job = await this.queueRepository.getNextJob();
        if (!job) break; // No more jobs available

        try {
          console.log(`Processing job ${job.id} of type ${job.type}`);

          const handler = this.handlers[job.type];
          if (!handler) {
            throw new Error(`No handler registered for job type: ${job.type}`);
          }

          const result = await handler(job);
          await this.queueRepository.completeJob(job, result);
          processed++;

          console.log(`Job ${job.id} completed successfully`);
        } catch (error) {
          console.error(`Error processing job ${job.id}:`, error);

          await this.queueRepository.failJob(
            job,
            error instanceof Error ? error : String(error),
          );

          processed++;
        }
      }
    });

    return processed;
  }

  async enqueueOrchestrationJob(
    bountyId: string,
    agenticResponse: AgenticResponseType,
    options: { priority?: number; maxAttempts?: number } = {},
  ) {
    return RequestContext.create(this.entityManager, async () => {
      return await this.queueRepository.enqueue({
        type: JobType.ORCHESTRATE_EVALUATION,
        payload: { bountyId, agenticResponse },
        options,
      });
    });
  }

  async enqueueEvaluationJob(
    orchestrationPayload: any,
    agenticResponse: AgenticResponseType,
  ) {
    return RequestContext.create(this.entityManager, async () => {
      return await this.queueRepository.enqueue({
        type: JobType.EXECUTE_EVALUATION,
        payload: {
          orchestrationPayload,
          agenticResponse,
        },
        options: {},
      });
    });
  }

  async enqueueNodeExecution(node: OrchestrationNode, stepInput: any) {
    return RequestContext.create(this.entityManager, async () => {
      const type =
        node.type === "web_search"
          ? JobType.WEB_SEARCH
          : node.type === "llm"
            ? JobType.LLM_PROMPT
            : JobType.EXECUTE_NODE;

      return await this.queueRepository.enqueue({
        type,
        payload: {
          node,
          stepInput,
        },
        options: {},
      });
    });
  }

  async enqueueGraphExecution(
    nodes: OrchestrationNode[],
    edges: any[],
    finalAnswer: any,
  ) {
    return RequestContext.create(this.entityManager, async () => {
      // First determine the execution order based on dependencies
      const sequence = this.llmJudgeService.constructDependencySequence(edges);

      // Create a chain of jobs following the sequence
      const jobConfigs = sequence.map((nodeId) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) throw new Error(`Node ${nodeId} not found in graph`);

        const jobType =
          node.type === "web_search"
            ? JobType.WEB_SEARCH
            : node.type === "llm"
              ? JobType.LLM_PROMPT
              : JobType.EXECUTE_NODE;

        return {
          type: jobType,
          payload: {
            node,
            stepInput: finalAnswer, // Initial input, will be updated by previous jobs
            sequence,
            currentIndex: sequence.indexOf(nodeId),
          },
          options: {},
        };
      });

      return await this.queueRepository.createJobChain(jobConfigs);
    });
  }

  async startWorker(pollingIntervalSeconds = 10) {
    if (this.running) return;

    this.running = true;
    console.log("Queue worker started");

    const poll = async () => {
      if (!this.running) return;

      await this.processNextJob();

      setTimeout(poll, pollingIntervalSeconds * 1000);
    };

    // Start polling
    poll();
  }

  async stopWorker() {
    console.log("Queue worker stopping");
    this.running = false;
  }

  private async processNextJob() {
    await RequestContext.create(this.entityManager, async () => {
      try {
        // Get the next job from the queue
        const job = await this.queueRepository.getNextJob();
        if (!job) return; // No jobs available

        console.log(`Processing job ${job.id} of type ${job.type}`);

        try {
          // Get the handler for this job type
          const handler = this.handlers[job.type];
          if (!handler) {
            throw new Error(`No handler registered for job type: ${job.type}`);
          }

          // Execute the handler
          const result = await handler(job);

          // Mark job as completed with result
          await this.queueRepository.completeJob(job, result);
          console.log(`Job ${job.id} completed successfully`);
        } catch (error) {
          console.error(`Error processing job ${job.id}:`, error);

          // Record the failure
          await this.queueRepository.failJob(
            job,
            error instanceof Error ? error : String(error),
          );

          if (job.attempts >= job.maxAttempts) {
            console.log(
              `Job ${job.id} failed permanently after ${job.attempts} attempts`,
            );
          } else {
            console.log(
              `Job ${job.id} will be retried (attempt ${job.attempts}/${job.maxAttempts})`,
            );
          }
        }
      } catch (error) {
        console.error("Error in worker process:", error);
      }
    });
  }

  private async handleOrchestrationJob(job: QueueJob): Promise<any> {
    const { bountyId, agenticResponse } = job.payload;
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

  private async handleExecuteEvaluationJob(job: QueueJob): Promise<any> {
    const { orchestrationPayload, agenticResponse } = job.payload;

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

  private async handleExecuteNodeJob(job: QueueJob): Promise<any> {
    const { node, stepInput, sequence, currentIndex } = job.payload;

    // Execute the node
    const result = await this.llmJudgeService.executeNode(node, stepInput);

    // If this was the last node in the sequence, we're done
    if (sequence && currentIndex === sequence.length - 1) {
      return {
        status: "graph_execution_completed",
        finalResult: result,
      };
    }

    // Otherwise, update the input for the next job in the chain with the result
    if (job.nextJobId) {
      const nextJob = await this.queueRepository.findOne({ id: job.nextJobId });
      if (nextJob) {
        nextJob.payload.stepInput = result;
        await this.entityManager.persistAndFlush(nextJob);
      }
    }

    return result;
  }

  private async handleWebSearchJob(job: QueueJob): Promise<any> {
    const { node, stepInput } = job.payload;
    return await this.llmJudgeService.executeWebSearch(node, stepInput);
  }

  private async handleLLMPromptJob(job: QueueJob): Promise<any> {
    const { node, stepInput } = job.payload;
    return await this.llmJudgeService.executeLLMPrompt(node, stepInput);
  }
}
