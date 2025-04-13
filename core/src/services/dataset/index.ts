// API Endpoint
import Anthropic from "@anthropic-ai/sdk";
import {
  Dataset,
  DatasetRepository,
  DeltaHash,
  DeltaHashRepository,
} from "@odin/core/db";
import { RequestContext } from "@mikro-orm/core";
import {
  validateSchema,
  validateSchemaData,
  DeltaUtils,
} from "@odin/core/utils";
import lighthouse from "@lighthouse-web3/sdk";

export class DatasetService {
  private client: Anthropic;

  private datasetRepository: DatasetRepository;
  private deltaHashRepository: DeltaHashRepository;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.datasetRepository =
      RequestContext.getEntityManager()!.getRepository(Dataset);

    this.deltaHashRepository =
      RequestContext.getEntityManager()!.getRepository(DeltaHash);
  }

  async createDataset(
    name: string,
    schema: any,
    description?: string,
    initialData?: any[],
  ) {
    validateSchema(schema);

    const dataset = this.datasetRepository.createDataset({
      name,
      schema,
      description,
    });

    if (initialData && initialData.length > 0) {
      await this.logDelta(dataset.datasetId, initialData, {
        generatePatches: false,
      });
    }

    return dataset;
  }

  // provide JSON data
  async logDelta(
    datasetId: string,
    data: any,
    options: {
      generatePatches?: boolean;
      idField?: string;
    } = {},
  ) {
    const dataset = await this.datasetRepository.getDataset(datasetId);

    if (!dataset) {
      throw new Error();
    }

    if (!Array.isArray(data)) {
      data = [data];
    }

    const preparedData = await this.translateToMatchSchema(
      data,
      dataset.schema,
    );

    let hash;

    const latestHash =
      await this.deltaHashRepository.retrieveLatestHash(datasetId);

    const newVersion = latestHash?.version ?? 1;

    const timestamp = new Date().toISOString();

    let totalRecords = preparedData.length;

    if (latestHash?.hash) {
      // fetch currentData
      const currentData: any[] = [];

      const delta = DeltaUtils.createDelta(
        currentData,
        preparedData,
        newVersion,
        {
          generatePatches: options.generatePatches ?? true,
          idField: options.idField || "id",
        },
      );

      totalRecords = delta.records.length;

      hash = await this.storeDataToIPFS(delta.records);
    } else {
      hash = await this.storeDataToIPFS(preparedData);
    }

    let deltaHash = this.deltaHashRepository.log({
      dataset,
      hash,
      timestamp,
      version: newVersion,
      totalRecords,
    });

    return deltaHash;
  }

  async storeDataToIPFS(payload: any) {
    const { data } = await lighthouse.uploadText(
      JSON.stringify(payload),
      process.env.LIGHTHOUSE_API_KEY!,
    );

    return data.Hash;
  }

  async translateToMatchSchema(data: any[], schema: any) {
    data.forEach(async (value, index) => {
      if (validateSchemaData(schema, value)) {
        let output = await this.convert(schema, value);
        data[index] = output;
      }
    });

    return data;
  }

  async convert(schema: any, value: any) {
    const message = await this.client.messages.create({
      max_tokens: 1024 * 8,
      system:
        "You are an AI assistant specializing in analyzing raw data, extracting and converting into a structured JSON format based on specific query parameters. Remember to strictly generate a response based on the user input.",
      messages: [
        {
          role: "user",
          content: JSON.stringify(value),
        },
      ],
      model: "claude-3-5-sonnet-latest",
      tools: [
        {
          name: "extract_and_convert",
          description: "Helps extract to match a structured output",
          input_schema: JSON.parse(schema),
        },
      ],
    });

    const llmOutput = message.content.filter(
      (el) => el.type == "tool_use" && el.name == "extract_and_convert",
    );

    if (llmOutput.length > 0) {
      // @ts-ignore
      const [result] = llmOutput.input;

      if (!validateSchemaData(JSON.parse(schema), result)) {
        throw new Error("Invalid LLM Output");
      }

      return result;
    }
  }
}
