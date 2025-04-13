import Anthropic from "@anthropic-ai/sdk";
import Redis from "ioredis";
import fs from "fs";
import _ from "lodash";
import { hash } from "crypto";

// Types
interface GraphNode {
  id: string;
  type: "reasoning" | "planning" | "execution" | "validation";
  agent: string;
  content?: any;
  status: "pending" | "completed" | "validated" | "rejected";
}

interface GraphEdge {
  from: string;
  to: string;
  type: "depends" | "validates" | "refines";
}

interface Agent {
  id: string;
  role: string;
  expertise: string[];
  system_prompt: string;
}

interface ThoughtGraph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge[]>;
}

export class CollaborativeAgentSystem {
  private client: Anthropic;
  private redis: Redis;
  private agents: Map<string, Agent>;
  private thoughtGraph: ThoughtGraph;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.redis = new Redis(process.env.REDIS_URL!);
    this.agents = new Map();
    this.thoughtGraph = {
      nodes: new Map(),
      edges: new Map(),
    };
  }

  /**
   * Register a new agent in the system
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  /**
   * Get a list of all registered agents
   */
  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Create a new node in the thought graph
   */
  async createNode(
    type: "reasoning" | "planning" | "execution" | "validation",
    agentId: string,
    initialContent?: any
  ): Promise<string> {
    const nodeId = hash("sha256", `${agentId}:${type}:${Date.now()}`).toString("hex").substring(0, 10);
    
    const node: GraphNode = {
      id: nodeId,
      type,
      agent: agentId,
      content: initialContent || null,
      status: "pending"
    };
    
    this.thoughtGraph.nodes.set(nodeId, node);
    
    // Cache in Redis
    await this.redis.set(
      this.getNodeKey(nodeId),
      JSON.stringify(node),
      "EX",
      60 * 60 * 24 * 7 // Cache for 7 days
    );
    
    return nodeId;
  }

  /**
   * Connect nodes with an edge
   */
  async createEdge(fromId: string, toId: string, type: "depends" | "validates" | "refines"): Promise<void> {
    const edge: GraphEdge = {
      from: fromId,
      to: toId,
      type
    };
    
    if (!this.thoughtGraph.edges.has(fromId)) {
      this.thoughtGraph.edges.set(fromId, []);
    }
    
    this.thoughtGraph.edges.get(fromId)!.push(edge);
    
    // Cache in Redis
    await this.redis.set(
      this.getEdgeKey(fromId, toId),
      JSON.stringify(edge),
      "EX",
      60 * 60 * 24 * 7 // Cache for 7 days
    );
  }

  /**
   * Update node content and status
   */
  async updateNode(nodeId: string, content: any, status: "pending" | "completed" | "validated" | "rejected"): Promise<void> {
    const node = this.thoughtGraph.nodes.get(nodeId);
    
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }
    
    node.content = content;
    node.status = status;
    
    // Update in Redis
    await this.redis.set(
      this.getNodeKey(nodeId),
      JSON.stringify(node),
      "EX",
      60 * 60 * 24 * 7 // Cache for 7 days
    );
  }

  /**
   * Execute a reasoning step for an agent
   */
  async executeReasoning(agentId: string, context: any, task: string): Promise<string> {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Create a reasoning node
    const nodeId = await this.createNode("reasoning", agentId);
    
    // Generate the reasoning
    const reasoning = await this.generateAgentThinking(agent, context, task);
    
    // Update the node with the reasoning
    await this.updateNode(nodeId, reasoning, "completed");
    
    return nodeId;
  }

  /**
   * Execute a planning step for an agent
   */
  async executePlanning(agentId: string, contextNodeIds: string[], task: string): Promise<string> {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Get context from referenced nodes
    const context = await this.getNodesContent(contextNodeIds);
    
    // Create a planning node
    const nodeId = await this.createNode("planning", agentId);
    
    // Generate the plan
    const plan = await this.generateAgentPlanning(agent, context, task);
    
    // Update the node with the plan
    await this.updateNode(nodeId, plan, "completed");
    
    // Create edges from context nodes to the planning node
    for (const contextNodeId of contextNodeIds) {
      await this.createEdge(contextNodeId, nodeId, "depends");
    }
    
    return nodeId;
  }

  /**
   * Execute a plan validation by another agent
   */
  async executeValidation(validatingAgentId: string, planNodeId: string): Promise<string> {
    const validatingAgent = this.agents.get(validatingAgentId);
    const planNode = this.thoughtGraph.nodes.get(planNodeId);
    
    if (!validatingAgent) {
      throw new Error(`Agent ${validatingAgentId} not found`);
    }
    
    if (!planNode) {
      throw new Error(`Plan node ${planNodeId} not found`);
    }
    
    // Get the plan's agent
    const planAgentId = planNode.agent;
    const planAgent = this.agents.get(planAgentId);
    
    if (!planAgent) {
      throw new Error(`Plan agent ${planAgentId} not found`);
    }
    
    // Create a validation node
    const validationNodeId = await this.createNode("validation", validatingAgentId);
    
    // Get plan content
    const planContent = planNode.content;
    
    // Generate validation
    const validation = await this.validateAgentPlan(validatingAgent, planAgent, planContent);
    
    // Update validation node
    await this.updateNode(validationNodeId, validation, "completed");
    
    // Create edge from plan node to validation node
    await this.createEdge(planNodeId, validationNodeId, "validates");
    
    // Update plan node status based on validation
    if (validation.isValid) {
      await this.updateNode(planNodeId, planNode.content, "validated");
    } else {
      await this.updateNode(planNodeId, planNode.content, "rejected");
    }
    
    return validationNodeId;
  }

  /**
   * Execute a plan refinement based on validation
   */
  async executeRefinement(agentId: string, planNodeId: string, validationNodeId: string): Promise<string> {
    const agent = this.agents.get(agentId);
    const planNode = this.thoughtGraph.nodes.get(planNodeId);
    const validationNode = this.thoughtGraph.nodes.get(validationNodeId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    if (!planNode || !validationNode) {
      throw new Error(`Required nodes not found`);
    }
    
    // Create a refinement node (which is a new planning node)
    const refinementNodeId = await this.createNode("planning", agentId);
    
    // Get content from plan and validation
    const planContent = planNode.content;
    const validationContent = validationNode.content;
    
    // Generate refinement
    const refinement = await this.generatePlanRefinement(agent, planContent, validationContent);
    
    // Update refinement node
    await this.updateNode(refinementNodeId, refinement, "completed");
    
    // Create edges
    await this.createEdge(planNodeId, refinementNodeId, "refines");
    await this.createEdge(validationNodeId, refinementNodeId, "depends");
    
    return refinementNodeId;
  }

  /**
   * Execute the final implementation of a validated plan
   */
  async executeImplementation(agentId: string, planNodeId: string): Promise<string> {
    const agent = this.agents.get(agentId);
    const planNode = this.thoughtGraph.nodes.get(planNodeId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    if (!planNode) {
      throw new Error(`Plan node ${planNodeId} not found`);
    }
    
    if (planNode.status !== "validated") {
      throw new Error(`Cannot implement unvalidated plan`);
    }
    
    // Create an execution node
    const executionNodeId = await this.createNode("execution", agentId);
    
    // Get plan content
    const planContent = planNode.content;
    
    // Execute the plan
    const execution = await this.executePlan(agent, planContent);
    
    // Update execution node
    await this.updateNode(executionNodeId, execution, "completed");
    
    // Create edge from plan to execution
    await this.createEdge(planNodeId, executionNodeId, "depends");
    
    return executionNodeId;
  }

  /**
   * Get the execution sequence based on dependencies
   */
  getExecutionSequence(): string[] {
    const graph: Map<string, string[]> = new Map();
    const inDegree: Map<string, number> = new Map();
    const allNodes: Set<string> = new Set();

    // Build the graph and in-degree maps
    for (const [fromId, edges] of this.thoughtGraph.edges.entries()) {
      allNodes.add(fromId);
      
      if (!graph.has(fromId)) {
        graph.set(fromId, []);
      }
      
      for (const edge of edges) {
        const toId = edge.to;
        allNodes.add(toId);
        
        if (!graph.has(toId)) {
          graph.set(toId, []);
        }
        
        graph.get(fromId)!.push(toId);
        
        // Update in-degree
        inDegree.set(toId, (inDegree.get(toId) || 0) + 1);
      }
    }

    // Initialize in-degree for nodes with no incoming edges
    allNodes.forEach((nodeId) => {
      if (!inDegree.has(nodeId)) {
        inDegree.set(nodeId, 0);
      }
    });

    // Find all start nodes (in-degree = 0)
    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    const result: string[] = [];

    // Process the nodes
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      // Reduce in-degree of neighbors
      const neighbors = graph.get(current) || [];
      for (const neighbor of neighbors) {
        const newDegree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, newDegree);

        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Check for cycles
    if (result.length !== allNodes.size) {
      throw new Error("Circular dependency detected in thought graph");
    }

    return result;
  }

  /**
   * Get a visualization of the thought graph
   */
  getGraphVisualization(): any {
    const nodes = Array.from(this.thoughtGraph.nodes.values()).map(node => ({
      id: node.id,
      label: `${node.type} (${node.agent})`,
      type: node.type,
      agent: node.agent,
      status: node.status
    }));
    
    const edges = Array.from(this.thoughtGraph.edges.entries()).flatMap(
      ([fromId, edgeList]) => edgeList.map(edge => ({
        from: edge.from,
        to: edge.to,
        label: edge.type
      }))
    );
    
    return { nodes, edges };
  }

  /**
   * Generate an agent's thinking process
   */
  private async generateAgentThinking(agent: Agent, context: any, task: string): Promise<any> {
    const message = await this.client.messages.create({
      max_tokens: 1024 * 8,
      system: agent.system_prompt,
      messages: [
        {
          role: "user",
          content: `
          <context>
          ${JSON.stringify(context)}
          </context>
          
          <task>
          ${task}
          </task>
          
          I need you to think through this problem as a ${agent.role} with expertise in ${agent.expertise.join(", ")}.
          Generate your reasoning process before making any decisions.
          `
        }
      ],
      model: "claude-3-5-sonnet-latest",
      tools: [
        {
          name: "generate_reasoning",
          description: "Generate reasoning process for the task",
          input_schema: {
            type: "object",
            properties: {
              reasoning: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    step: { type: "number" },
                    thought: { type: "string" },
                    implications: { type: "string" }
                  },
                  required: ["step", "thought", "implications"]
                }
              },
              key_insights: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["reasoning", "key_insights"]
          }
        }
      ]
    });

    const llmOutput = message.content.filter(
      (el) => el.type === "tool_use" && el.name === "generate_reasoning"
    );

    if (llmOutput.length > 0) {
      // @ts-ignore
      const [result] = llmOutput.input;
      return result;
    }
    
    throw new Error("Failed to generate agent reasoning");
  }

  /**
   * Generate an agent's plan
   */
  private async generateAgentPlanning(agent: Agent, context: any, task: string): Promise<any> {
    const message = await this.client.messages.create({
      max_tokens: 1024 * 8,
      system: agent.system_prompt,
      messages: [
        {
          role: "user",
          content: `
          <context>
          ${JSON.stringify(context)}
          </context>
          
          <task>
          ${task}
          </task>
          
          As a ${agent.role} with expertise in ${agent.expertise.join(", ")}, create a detailed plan to solve this task.
          Your plan should be concrete, actionable, and leverage your specific expertise.
          `
        }
      ],
      model: "claude-3-5-sonnet-latest",
      tools: [
        {
          name: "generate_plan",
          description: "Generate a detailed plan for the task",
          input_schema: {
            type: "object",
            properties: {
              plan_name: { type: "string" },
              objective: { type: "string" },
              approach: { type: "string" },
              steps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    step_number: { type: "number" },
                    action: { type: "string" },
                    justification: { type: "string" },
                    expected_outcome: { type: "string" }
                  },
                  required: ["step_number", "action", "justification", "expected_outcome"]
                }
              },
              required_resources: {
                type: "array",
                items: { type: "string" }
              },
              potential_challenges: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["plan_name", "objective", "approach", "steps"]
          }
        }
      ]
    });

    const llmOutput = message.content.filter(
      (el) => el.type === "tool_use" && el.name === "generate_plan"
    );

    if (llmOutput.length > 0) {
      // @ts-ignore
      const [result] = llmOutput.input;
      return result;
    }
    
    throw new Error("Failed to generate agent plan");
  }

  /**
   * Validate an agent's plan
   */
  private async validateAgentPlan(validatingAgent: Agent, planAgent: Agent, plan: any): Promise<any> {
    const message = await this.client.messages.create({
      max_tokens: 1024 * 8,
      system: validatingAgent.system_prompt,
      messages: [
        {
          role: "user",
          content: `
          <agent_info>
          ${JSON.stringify({
            role: planAgent.role,
            expertise: planAgent.expertise
          })}
          </agent_info>
          
          <plan>
          ${JSON.stringify(plan)}
          </plan>
          
          As a ${validatingAgent.role} with expertise in ${validatingAgent.expertise.join(", ")}, 
          critically evaluate this plan created by a ${planAgent.role}.
          
          Identify strengths, weaknesses, and potential improvements. 
          Your evaluation should be rigorous, fair, and consider both the technical and practical aspects of the plan.
          `
        }
      ],
      model: "claude-3-5-sonnet-latest",
      tools: [
        {
          name: "validate_plan",
          description: "Validate a plan and provide feedback",
          input_schema: {
            type: "object",
            properties: {
              isValid: { type: "boolean" },
              score: { 
                type: "number",
                minimum: 0,
                maximum: 10
              },
              strengths: {
                type: "array",
                items: { type: "string" }
              },
              weaknesses: {
                type: "array",
                items: { type: "string" }
              },
              suggestions: {
                type: "array",
                items: { type: "string" }
              },
              reasoning: { type: "string" }
            },
            required: ["isValid", "score", "strengths", "weaknesses", "suggestions", "reasoning"]
          }
        }
      ]
    });

    const llmOutput = message.content.filter(
      (el) => el.type === "tool_use" && el.name === "validate_plan"
    );

    if (llmOutput.length > 0) {
      // @ts-ignore
      const [result] = llmOutput.input;
      return result;
    }
    
    throw new Error("Failed to validate agent plan");
  }

  /**
   * Generate a refined plan based on validation feedback
   */
  private async generatePlanRefinement(agent: Agent, originalPlan: any, validation: any): Promise<any> {
    const message = await this.client.messages.create({
      max_tokens: 1024 * 8,
      system: agent.system_prompt,
      messages: [
        {
          role: "user",
          content: `
          <original_plan>
          ${JSON.stringify(originalPlan)}
          </original_plan>
          
          <validation_feedback>
          ${JSON.stringify(validation)}
          </validation_feedback>
          
          As a ${agent.role} with expertise in ${agent.expertise.join(", ")}, refine your original plan based on the validation feedback.
          Address the weaknesses identified and incorporate the suggestions where appropriate.
          Produce an improved plan that maintains your original intent while addressing the valid criticisms.
          `
        }
      ],
      model: "claude-3-5-sonnet-latest",
      tools: [
        {
          name: "refine_plan",
          description: "Generate a refined plan based on feedback",
          input_schema: {
            type: "object",
            properties: {
              plan_name: { type: "string" },
              objective: { type: "string" },
              approach: { type: "string" },
              steps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    step_number: { type: "number" },
                    action: { type: "string" },
                    justification: { type: "string" },
                    expected_outcome: { type: "string" }
                  },
                  required: ["step_number", "action", "justification", "expected_outcome"]
                }
              },
              required_resources: {
                type: "array",
                items: { type: "string" }
              },
              potential_challenges: {
                type: "array",
                items: { type: "string" }
              },
              changes_made: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["plan_name", "objective", "approach", "steps", "changes_made"]
          }
        }
      ]
    });

    const llmOutput = message.content.filter(
      (el) => el.type === "tool_use" && el.name === "refine_plan"
    );

    if (llmOutput.length > 0) {
      // @ts-ignore
      const [result] = llmOutput.input;
      return result;
    }
    
    throw new Error("Failed to refine plan");
  }

  /**
   * Execute a validated plan
   */
  private async executePlan(agent: Agent, plan: any): Promise<any> {
    const message = await this.client.messages.create({
      max_tokens: 1024 * 8,
      system: agent.system_prompt,
      messages: [
        {
          role: "user",
          content: `
          <plan>
          ${JSON.stringify(plan)}
          </plan>
          
          As a ${agent.role} with expertise in ${agent.expertise.join(", ")}, execute this validated plan.
          Provide concrete implementations, outputs, or results for each step in the plan.
          `
        }
      ],
      model: "claude-3-5-sonnet-latest",
      tools: [
        {
          name: "execute_plan",
          description: "Execute the plan and provide results",
          input_schema: {
            type: "object",
            properties: {
              execution_summary: { type: "string" },
              step_results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    step_number: { type: "number" },
                    implementation: { type: "string" },
                    output: { type: "string" },
                    success: { type: "boolean" },
                    notes: { type: "string" }
                  },
                  required: ["step_number", "implementation", "output", "success"]
                }
              },
              final_result: { type: "string" },
              performance_metrics: {
                type: "object",
                additionalProperties: true
              }
            },
            required: ["execution_summary", "step_results", "final_result"]
          }
        }
      ]
    });

    const llmOutput = message.content.filter(
      (el) => el.type === "tool_use" && el.name === "execute_plan"
    );

    if (llmOutput.length > 0) {
      // @ts-ignore
      const [result] = llmOutput.input;
      return result;
    }
    
    throw new Error("Failed to execute plan");
  }

  /**
   * Retrieve content from multiple nodes
   */
  private async getNodesContent(nodeIds: string[]): Promise<any[]> {
    const contents: any[] = [];
    
    for (const nodeId of nodeIds) {
      // Try memory first
      let node = this.thoughtGraph.nodes.get(nodeId);
      
      // If not in memory, try Redis
      if (!node) {
        const cachedNode = await this.redis.get(this.getNodeKey(nodeId));
        
        if (cachedNode) {
          node = JSON.parse(cachedNode);
          // Update memory
          this.thoughtGraph.nodes.set(nodeId, node);
        } else {
          throw new Error(`Node ${nodeId} not found`);
        }
      }
      
      contents.push(node.content);
    }
    
    return contents;
  }

  /**
   * Redis key helpers
   */
  private getNodeKey(nodeId: string): string {
    return `agent:node:${nodeId}`;
  }

  private getEdgeKey(fromId: string, toId: string): string {
    return `agent:edge:${fromId}:${toId}`;
  }

  /**
   * Run a full collaborative workflow for a task
   */
  async runCollaborativeWorkflow(task: string, agentIds: string[]): Promise<any> {
    if (agentIds.length < 2) {
      throw new Error("Collaborative workflow requires at least two agents");
    }
    
    const result: any = {
      task,
      workflow: [],
      final_nodes: []
    };
    
    // Step 1: Each agent does initial reasoning
    const reasoningNodeIds: string[] = [];
    
    for (const agentId of agentIds) {
      const nodeId = await this.executeReasoning(agentId, {}, task);
      reasoningNodeIds.push(nodeId);
      
      result.workflow.push({
        step: "reasoning",
        agent: agentId,
        node: nodeId
      });
    }
    
    // Step 2: Each agent creates a plan based on all reasoning
    const planNodeIds: string[] = [];
    
    for (const agentId of agentIds) {
      const nodeId = await this.executePlanning(agentId, reasoningNodeIds, task);
      planNodeIds.push(nodeId);
      
      result.workflow.push({
        step: "planning",
        agent: agentId,
        node: nodeId
      });
    }
    
    // Step 3: Cross-validation of plans
    const validationNodeIds: string[] = [];
    
    for (let i = 0; i < agentIds.length; i++) {
      const validatingAgentId = agentIds[i];
      // Each agent validates the plan of the next agent (circular)
      const planToValidateIdx = (i + 1) % agentIds.length;
      const planNodeId = planNodeIds[planToValidateIdx];
      
      const nodeId = await this.executeValidation(validatingAgentId, planNodeId);
      validationNodeIds.push(nodeId);
      
      result.workflow.push({
        step: "validation",
        agent: validatingAgentId,
        validates_plan: planNodeId,
        node: nodeId
      });
    }
    
    // Step 4: Refinement of rejected plans
    const refinementNodeIds: string[] = [];
    
    for (let i = 0; i < planNodeIds.length; i++) {
      const planNodeId = planNodeIds[i];
      const planNode = this.thoughtGraph.nodes.get(planNodeId)!;
      
      if (planNode.status === "rejected") {
        // Find the validation for this plan
        const validationForPlan = validationNodeIds.find(validId => {
          const edges = this.thoughtGraph.edges.get(planNodeId) || [];
          return edges.some(edge => edge.to === validId && edge.type === "validates");
        });
        
        if (validationForPlan) {
          const refinementNodeId = await this.executeRefinement(
            planNode.agent, 
            planNodeId, 
            validationForPlan
          );
          
          refinementNodeIds.push(refinementNodeId);
          
          result.workflow.push({
            step: "refinement",
            agent: planNode.agent,
            original_plan: planNodeId,
            based_on_validation: validationForPlan,
            node: refinementNodeId
          });
        }
      }
    }
    
    // Step 5: Execute validated plans
    const executionNodeIds: string[] = [];
    
    // Combine original plans and refinements
    const allPlanNodeIds = [...planNodeIds, ...refinementNodeIds];
    
    for (const planNodeId of allPlanNodeIds) {
      const planNode = this.thoughtGraph.nodes.get(planNodeId)!;
      
      if (planNode.status === "validated") {
        const executionNodeId = await this.executeImplementation(planNode.agent, planNodeId);
        executionNodeIds.push(executionNodeId);
        
        result.workflow.push({
          step: "execution",
          agent: planNode.agent,
          plan: planNodeId,
          node: executionNodeId
        });
        
        // Add to final nodes
        result.final_nodes.push(executionNodeId);
      }
    }
    
    // Return the workflow and graph visualization
    result.graph = this.getGraphVisualization();
    
    return result;
  }
}