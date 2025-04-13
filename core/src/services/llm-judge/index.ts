import Anthropic from "@anthropic-ai/sdk";
import orchestrateSchema from "./schema.json";
import {
  BountyExpectedOutput,
  EvaluationCriteria,
  OrchestrationNode,
  WebSearchResult,
  WebExtractResult,
  OrchestrationEdge,
} from "@odin/core/types";
import fs from "fs";
import _ from "lodash";
import { validateSchemaData } from "@odin/core/utils";
import * as path from "path";
import Redis from "ioredis";
import { hash } from "crypto";

export class LLMJudgeService {
  private client: Anthropic;
  private redis: Redis;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async webSearch(query: string): Promise<WebSearchResult> {
    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        topic: "general",
        search_depth: "basic",
        chunks_per_source: 3,
        max_results: 10,
        time_range: null,
        days: 7,
        include_answer: true,
        include_raw_content: false,
        include_images: false,
        include_image_descriptions: false,
        include_domains: [],
        exclude_domains: [],
      }),
    };

    const response = await fetch("https://api.tavily.com/search", options);

    return await response.json();
  }

  async webExtract(urls: string | string[]): Promise<WebExtractResult> {
    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        urls: urls,
        include_images: false,
        extract_depth: "basic",
      }),
    };

    const response = await fetch("https://api.tavily.com/extract", options);

    return await response.json();
  }

  async orchestrateAgenticEvaluation(
    evaluationCriteria: EvaluationCriteria,
    expectedOutput: BountyExpectedOutput,
  ) {
    const query = `
      <evaluationCriteria>
      ${JSON.stringify(evaluationCriteria)}
      </evaluationCriteria>

      <expectedOutput>
      ${JSON.stringify(expectedOutput)}
      </expectedOutput>

      Use the \`orchestrate_steps\` tool.
    `;

    const message = await this.client.messages.create({
      max_tokens: 1024 * 8,
      system:
        "You are an AI assistant that helps orchestrate steps to be implemented for evaluation. You will be provided with an evaluationCriteria as well as the expectedOutput format. Your task is to provide the steps required to evaluate an agentic answer based on the evaluationCriteria and the expectedOutput. Ensure you strictly provide steps for evaluation.",
      messages: [{ role: "user", content: query }],
      model: "claude-3-5-sonnet-latest",
      tools: [
        {
          name: "orchestrate_steps",
          description: "Orchestrate steps to be executud",
          // @ts-ignore
          input_schema: orchestrateSchema,
        },
      ],
    });

    const llmOutput = message.content.filter(
      (el) => el.type == "tool_use" && el.name == "orchestrate_steps",
    );

    if (llmOutput.length > 0) {
      // @ts-ignore
      const [result] = llmOutput.input;

      if (!validateSchemaData(orchestrateSchema, result)) {
        throw new Error("Invalid LLM Output");
      }

      return result;
    }
  }

  constructDependencySequence(edges: OrchestrationEdge[]) {
    const graph: Map<string, string[]> = new Map();
    const inDegree: Map<string, number> = new Map();
    const allTasks: Set<string> = new Set();

    // Initialize the graph
    edges.forEach((dep) => {
      const { from, to } = dep;
      allTasks.add(from);
      allTasks.add(to);

      if (!graph.has(from)) {
        graph.set(from, []);
      }

      if (!graph.has(to)) {
        graph.set(to, []);
      }

      graph.get(from)!.push(to);

      // Update in-degree
      inDegree.set(to, (inDegree.get(to) || 0) + 1);
    });

    // Initialize in-degree for nodes with no incoming edges
    allTasks.forEach((task) => {
      if (!inDegree.has(task)) {
        inDegree.set(task, 0);
      }
    });

    // Find all start nodes (in-degree = 0)
    const queue: string[] = [];
    inDegree.forEach((degree, task) => {
      if (degree === 0) {
        queue.push(task);
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

    // Check for cycles (if not all tasks are in the result)
    if (result.length !== allTasks.size) {
      throw new Error("Circular dependency detected");
    }

    return result;
  }

  parseTemplate(
    template: string,
    data: Record<string, any>,
    returnArray = true,
  ) {
    const regex = /{{([^{}]+)}}/g;
    let templates = [template];

    // Find all placeholders in the template
    const matches = Array.from(template.matchAll(regex));

    // Process each placeholder
    for (const match of matches) {
      const fullMatch = match[0];
      const key = match[1].trim();
      const value = _.get(data, key);

      if (returnArray) {
        // If value is an array, create multiple templates
        if (Array.isArray(value)) {
          const newTemplates = [];

          // For each existing template version
          for (const currentTemplate of templates) {
            // For each value in the array
            for (const item of value) {
              // Create a new template with this specific array item
              newTemplates.push(currentTemplate.replace(fullMatch, item));
            }
          }

          // Replace current templates with expanded versions
          templates = newTemplates;
        } else {
          // Handle non-array case - just replace in all current templates
          templates = templates.map((currentTemplate) =>
            currentTemplate.replace(
              fullMatch,
              JSON.stringify(value) ?? fullMatch,
            ),
          );
        }
      } else {
        templates = templates.map((currentTemplate) =>
          currentTemplate.replace(
            fullMatch,
            JSON.stringify(value) ?? fullMatch,
          ),
        );
      }
    }

    return templates;
  }

  async executeNode(node: OrchestrationNode, stepInput: any) {
    const { type } = node;

    switch (type) {
      case "web_search":
        return await this.executeWebSearch(node, stepInput);

      case "llm":
        return this.executeLLMPrompt(node, stepInput);

      default:
        throw new Error("Not Supported!");
    }
  }

  // Redis key helpers
  private getNodeOutputKey(nodeId: string) {
    return `odin:node:${nodeId}:output`;
  }

  private getQueryResultKey(nodeId: string, queryIndex: number) {
    return `odin:node:${nodeId}:query:${queryIndex}:results`;
  }

  private getProcessedUrlsKey(nodeId: string, queryIndex: number) {
    return `odin:node:${nodeId}:query:${queryIndex}:processed_urls`;
  }

  private getExtractionKey(nodeId: string, url: string) {
    const encodedUrl = Buffer.from(url).toString("base64");
    return `odin:node:${nodeId}:extraction:${encodedUrl}`;
  }

  private getAnalysisKey(nodeId: string, queryIndex: number, url: string) {
    const shortUrl = Buffer.from(url).toString("base64").substring(0, 10);
    return `odin:node:${nodeId}:analysis:${queryIndex}:${shortUrl}`;
  }

  async executeWebSearch(node: OrchestrationNode, stepInput: any) {
    const { search_parameters, output_schema, output: key } = node;
    const { query_template } = search_parameters!;

    let payload = { ...stepInput };
    const queries = this.parseTemplate(query_template, payload);

    const id = hash("sha256", JSON.stringify(node));
    const nodeOutputKey = this.getNodeOutputKey(id);

    let nodeOutput: any[] = [];
    const existingOutput = await this.redis.get(nodeOutputKey);

    if (existingOutput) {
      nodeOutput = JSON.parse(existingOutput);
    }

    const processedQueries = new Set(
      nodeOutput
        .map((item) => item._query_index)
        .filter((idx) => idx !== undefined),
    );

    for (const [index, query] of queries.entries()) {
      // Skip already processed queries
      if (processedQueries.has(index)) {
        console.log(`Skipping already processed query at index ${index}`);
        continue;
      }

      let searchResults;
      const searchResultsKey = this.getQueryResultKey(id, index);

      const cachedSearchResults = await this.redis.get(searchResultsKey);

      if (cachedSearchResults) {
        searchResults = JSON.parse(cachedSearchResults);
        console.log(`Loaded cached search results for query index ${index}`);
      } else {
        // Perform web search and save results to Redis
        searchResults = await this.webSearch(query);
        await this.redis.set(
          searchResultsKey,
          JSON.stringify(searchResults),
          "EX",
          60 * 60 * 24 * 7, // Cache for 7 days
        );
      }

      let success = false;

      const processedUrlsKey = this.getProcessedUrlsKey(id, index);
      let processedUrls: string[] = [];

      const cachedProcessedUrls = await this.redis.get(processedUrlsKey);
      if (cachedProcessedUrls) {
        processedUrls = JSON.parse(cachedProcessedUrls);
      }

      for (const { url } of searchResults.results) {
        if (success) {
          break;
        }

        if (processedUrls.includes(url)) {
          console.log(`Skipping already processed URL: ${url}`);
          continue;
        }

        let extractionResults;
        const extractionKey = this.getExtractionKey(id, url);

        // Check for cached extraction in Redis
        const cachedExtraction = await this.redis.get(extractionKey);

        if (cachedExtraction) {
          extractionResults = JSON.parse(cachedExtraction);
          console.log(`Loaded cached extraction for URL: ${url}`);
        } else {
          // Perform web extraction and save results to Redis
          extractionResults = await this.webExtract(url);
          await this.redis.set(
            extractionKey,
            JSON.stringify(extractionResults),
            "EX",
            60 * 60 * 24 * 7, // Cache for 7 days
          );
        }

        processedUrls.push(url);
        await this.redis.set(
          processedUrlsKey,
          JSON.stringify(processedUrls),
          "EX",
          60 * 60 * 24 * 7, // Cache for 7 days
        );

        if (extractionResults.results.length > 0) {
          const { raw_content } = extractionResults.results[0];

          const analysisKey = this.getAnalysisKey(id, index, url);

          let llmResult;

          const cachedAnalysis = await this.redis.get(analysisKey);

          if (cachedAnalysis) {
            llmResult = JSON.parse(cachedAnalysis);
          } else {
            const message = await this.client.messages.create({
              max_tokens: 1024 * 8,
              system:
                "You are an AI assistant specializing in analyzing raw data and converting into a structured JSON format based on specific query parameters. Remember to strictly generate a response based on the query and raw_content provided..",
              messages: [
                {
                  role: "user",
                  content: `
                  <query>
                  ${query}
                  </query>

                  <raw-content>
                  ${raw_content}
                  </raw-content>
                  `,
                },
              ],
              model: "claude-3-5-sonnet-latest",
              tools: [
                {
                  name: "analyze_data",
                  description: "Analyze data based off query intent",
                  input_schema: JSON.parse(output_schema),
                },
              ],
            });

            const llmOutput = message.content.filter(
              (el) => el.type == "tool_use" && el.name == "analyze_data",
            );

            if (llmOutput.length > 0) {
              // @ts-ignore
              let [llmResult] = llmOutput.input;
              // Cache LLM result in Redis
              await this.redis.set(
                analysisKey,
                JSON.stringify(llmResult),
                "EX",
                60 * 60 * 24 * 7, // Cache for 7 days
              );
            }
          }

          if (llmResult) {
            if (!validateSchemaData(JSON.parse(output_schema), llmResult)) {
              throw new Error("Invalid LLM Output");
            }

            const resultWithMetadata = {
              ...llmResult,
              _query_index: index,
              _source_url: url,
            };

            nodeOutput.push(resultWithMetadata);
            // Update node output in Redis
            await this.redis.set(
              nodeOutputKey,
              JSON.stringify(nodeOutput),
              "EX",
              60 * 60 * 24 * 7, // Cache for 7 days
            );
            success = true;
          }
        }
      }
    }

    payload = {
      ...payload,
      [key]: nodeOutput.map((item) => {
        // Create a clean copy without our tracking metadata
        const { _query_index, _source_url, ...cleanItem } = item;
        return cleanItem;
      }),
    };

    return payload;
  }

  async executeLLMPrompt(node: OrchestrationNode, stepInput: any) {
    const { prompt_template, output_schema, output: key } = node;

    let payload = { ...stepInput };

    const [content] = this.parseTemplate(prompt_template!, payload);

    const message = await this.client.messages.create({
      max_tokens: 1024 * 8,
      system:
        "You are an AI assistant specializing in evaluating and executing user requests by generating comprehensive, structured, and data-driven analyses. You will reason through each request, employ skills such as summarization, evaluation, and logical breakdowns, and leverage provided data to deliver clear, actionable results.",
      messages: [
        {
          role: "user",
          content,
        },
      ],
      model: "claude-3-5-sonnet-latest",
      tools: [
        {
          name: "execute_prompt",
          description: "Execute prompt based off query intent",
          input_schema: JSON.parse(output_schema),
        },
      ],
    });

    const llmOutput = message.content.filter(
      (el) => el.type == "tool_use" && el.name == "execute_prompt",
    );

    if (llmOutput.length > 0) {
      // @ts-ignore
      const [result] = llmOutput.input;

      if (!validateSchemaData(JSON.parse(output_schema), result)) {
        throw new Error("Invalid LLM Output");
      }

      payload = {
        ...payload,
        [key]: result,
      };
    }

    return payload;
  }
}
