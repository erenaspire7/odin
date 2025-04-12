import { z } from "zod";
import { parse } from "csv-parse";

type ComparisonOperator =
  | "$eq"
  | "$gt"
  | "$gte"
  | "$lt"
  | "$lte"
  | "$ne"
  | "$in"
  | "$nin";
type LogicalOperator = "$and" | "$or" | "$not";

type QueryFilter = {
  [key: string]: any | { [key in ComparisonOperator | LogicalOperator]?: any };
};

type QueryOptions = {
  orderBy?: Record<string, "ASC" | "DESC">;
  limit?: number;
  offset?: number;
};

export class NexusService {
  constructor() {}

  async retrieveData<T extends z.ZodType = z.ZodType>(
    ipfsHash: string,
  ): Promise<DataContext<T>> {
    // change to support caching

    const response = await fetch(
      `https://gateway.lighthouse.storage/ipfs/${ipfsHash}`,
    );

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const data = new Uint8Array(buffer);

      const parsedData = this.parseData(data);
      const schema = this.createSchemaFromJson(parsedData) as T;

      // Create a context that can be used for chaining
      return new DataContext<T>(schema, parsedData as z.infer<T>[]);
    }

    throw new Error("Failed to retrieve data");
  }

  parseData(data: Uint8Array): any {
    const sampleText = new TextDecoder().decode(data);

    // check for JSON
    try {
      const json = JSON.parse(sampleText);

      if (Array.isArray(json)) {
        return json;
      }

      if (typeof json === "object") {
        return [json];
      }
    } catch (e) {
      // Not valid JSON
    }

    // check for CSV
    try {
      const records = parse(sampleText, {
        columns: true,
        skip_empty_lines: true,
      });
      return records;
    } catch (e) {
      // Not valid CSV
    }

    throw Error("Unsupported format!");
  }

  createSchemaFromJsonArray(jsonArray: unknown[]): z.ZodType {
    if (!Array.isArray(jsonArray) || jsonArray.length === 0) {
      return z.unknown();
    }

    // Initialize with the first element's schema
    let mergedSchema = this.createSchemaFromJson(jsonArray[0]);

    // Merge with schemas from other elements
    for (let i = 1; i < jsonArray.length; i++) {
      const currentSchema = this.createSchemaFromJson(jsonArray[i]);
      mergedSchema = this.mergeSchemas(mergedSchema, currentSchema);
    }

    return mergedSchema;
  }

  mergeSchemas(schema1: z.ZodType, schema2: z.ZodType): z.ZodType {
    if (schema1 instanceof z.ZodObject && schema2 instanceof z.ZodObject) {
      const shape1 = schema1.shape;
      const shape2 = schema2.shape;

      const mergedShape: Record<string, z.ZodTypeAny> = { ...shape1 };

      // Add all properties from schema2, making them optional if they don't exist in schema1
      for (const [key, type] of Object.entries(shape2)) {
        if (key in mergedShape) {
          // If property exists in both, merge them (recursively for nested objects)
          if (
            mergedShape[key] instanceof z.ZodObject &&
            type instanceof z.ZodObject
          ) {
            mergedShape[key] = this.mergeSchemas(mergedShape[key], type);
          } else {
            // For non-objects, use union type to support multiple types
            mergedShape[key] = z.union([mergedShape[key], type as z.ZodType]);
          }
        } else {
          // If property only exists in schema2, make it optional
          mergedShape[key] = (type as z.ZodType).optional();
        }
      }

      // Make sure all properties from schema1 are also optional if not in schema2
      for (const key of Object.keys(shape1)) {
        if (!(key in shape2)) {
          mergedShape[key] = mergedShape[key].optional();
        }
      }

      return z.object(mergedShape);
    }

    // If schemas are of different types, create a union
    return z.union([schema1, schema2]);
  }

  createSchemaFromJson(json: unknown): z.ZodType {
    if (typeof json === "object" && json !== null) {
      if (Array.isArray(json)) {
        // For arrays in the data, create an array schema
        return z.array(
          json.length > 0 ? this.createSchemaFromJsonArray(json) : z.unknown(),
        );
      }

      const entries = Object.entries(json as Record<string, unknown>);
      const shape: Record<string, z.ZodTypeAny> = {};

      for (const [key, value] of entries) {
        if (typeof value === "string") shape[key] = z.string();
        else if (typeof value === "number") shape[key] = z.number();
        else if (typeof value === "boolean") shape[key] = z.boolean();
        else if (value === null) shape[key] = z.null();
        else if (Array.isArray(value)) {
          shape[key] = z.array(
            value.length > 0
              ? this.createSchemaFromJsonArray(value)
              : z.unknown(),
          );
        } else if (typeof value === "object") {
          shape[key] = this.createSchemaFromJson(value);
        } else shape[key] = z.unknown();
      }

      return z.object(shape);
    }

    // Handle primitive types
    if (typeof json === "string") return z.string();
    if (typeof json === "number") return z.number();
    if (typeof json === "boolean") return z.boolean();
    if (json === null) return z.null();

    return z.unknown();
  }
}

// QueryResult class to handle post-execution operations
class DatasetTransformer<T> {
  private data: T[];

  constructor(data: T[]) {
    this.data = data;
  }

  transform(modelName: string, type: string) {
    // Apply appropriate transformation based on the training type
    switch (type) {
      case "inference":
        return this.transformForInference(modelName);
      case "supervised-fine-tuning":
        return this.transformForSFT(modelName);
      default:
        throw new Error(`Unsupported training type: ${type}`);
    }
  }

  /**
   * Transform data for inference
   */
  private async transformForInference(modelName: string) {
    // Detect the structure of the data and try to adapt
    const jsonlLines = this.data
      .map((item) => {
        let entry;

        if (item) {
          if (typeof item === "object") {
            // Check for common field patterns
            if ("prompt" in item) {
              entry = JSON.stringify(item);
            } else if ("input" in item) {
              entry = JSON.stringify({ prompt: item.input });
            } else if ("text" in item) {
              entry = JSON.stringify({ prompt: item.text });
            } else if ("question" in item) {
              entry = JSON.stringify({ prompt: item.question });
            } else {
              // Best guess - stringify the whole object as context
              entry = JSON.stringify({
                prompt: `Context: ${JSON.stringify(item)}\n\nBased on the above context, please provide an appropriate response.`,
              });
            }
          }

          entry = JSON.stringify({ prompt: String(item) });
          // apply modelName transformation
        }

        return entry;
      })
      .filter((el) => el != undefined);

    return jsonlLines;
  }

  private async transformForSFT(modelName: string) {
    const jsonlLines = this.data.map((item) => {
      let entry;

      if (item) {
        // Try to detect instruction/input/output patterns
        if (typeof item === "object") {
          // Check for direct SFT format
          if ("instruction" in item && "output" in item) {
            const sftItem: any = {
              instruction: item.instruction,
            };

            // Include input if available
            if ("input" in item) {
              sftItem.input = item.input;
            }

            sftItem.output = item.output;
            entry = JSON.stringify(sftItem);
          }
          // Check for prompt/completion format (OpenAI style)
          else if ("prompt" in item && "completion" in item) {
            entry = JSON.stringify({
              instruction: "Complete the following",
              input: item.prompt,
              output: item.completion,
            });
          }
          // Check for question/answer format
          else if ("question" in item && "answer" in item) {
            entry = JSON.stringify({
              instruction: "Answer the following question",
              input: item.question,
              output: item.answer,
            });
          }
          // Check for context/question/answer format
          else if (
            "context" in item &&
            "question" in item &&
            "answer" in item
          ) {
            entry = JSON.stringify({
              instruction: "Answer the question based on the given context",
              input: `Context: ${item.context}\n\nQuestion: ${item.question}`,
              output: item.answer,
            });
          } else {
            // Make best effort to convert to SFT format
            const keys = Object.keys(item);
            const instruction = "Process the following data";
            const input = JSON.stringify(item);
            const output = "I've processed the data successfully.";

            entry = JSON.stringify({ instruction, input, output });
          }
        } else if (typeof item === "string") {
          // For plain text, try to split by patterns like "Q:" and "A:"
          if (item.includes("Q:") && item.includes("A:")) {
            const parts = item.split("A:");
            const questionPart = parts[0].replace("Q:", "").trim();
            const answerPart = parts[1].trim();

            entry = JSON.stringify({
              instruction: "Answer the following question",
              input: questionPart,
              output: answerPart,
            });
          } else {
            // Fallback for plain text - treat as a sample output
            entry = JSON.stringify({
              instruction: "Generate content like the following example",
              input: "",
              output: item,
            });
          }
        }
      }

      // Default fallback
      entry = JSON.stringify({
        instruction: "Process the following",
        input: String(item),
        output: "Processed successfully.",
      });

      return entry;
    });

    return jsonlLines.join("\n");
  }

  // Get the raw result data
  getRawData(): T[] {
    return this.data;
  }
}

// Context class for chaining operations with type safety
export class DataContext<T extends z.ZodType> {
  private schema: T;
  private data: z.infer<T>[];

  constructor(schema: T, data: z.infer<T>[]) {
    this.schema = schema;
    this.data = data;
  }

  getSchema(): T {
    return this.schema;
  }

  getData(): z.infer<T>[] {
    return this.data;
  }

  query(
    filters: QueryFilter,
    options: QueryOptions = {},
  ): DatasetTransformer<z.infer<T>> {
    const filteredData = this.applyFilters(this.data, filters);

    // Apply sorting
    let results = filteredData;
    if (options.orderBy) {
      results = this.applySorting(results, options.orderBy);
    }

    // Apply pagination
    if (options.limit) {
      const start = options.offset || 0;
      results = results.slice(start, start + options.limit);
    }

    return new DatasetTransformer<z.infer<T>>(results);
  }

  private applyFilters(data: z.infer<T>[], filters: QueryFilter): z.infer<T>[] {
    return data.filter((item) => this.matchesFilters(item, filters));
  }

  private matchesFilters(item: z.infer<T>, filters: QueryFilter): boolean {
    // Implementation
    return Object.entries(filters).every(([key, value]) => {
      // Handle logical operators
      if (key === "$or" && Array.isArray(value)) {
        return value.some((condition) => this.matchesFilters(item, condition));
      }
      if (key === "$and" && Array.isArray(value)) {
        return value.every((condition) => this.matchesFilters(item, condition));
      }
      if (key === "$not" && typeof value === "object") {
        return !this.matchesFilters(item, value);
      }

      // Handle field filter
      return this.matchesFieldFilter(item, key, value);
    });
  }

  private matchesFieldFilter(item: any, key: string, condition: any): boolean {
    // Implementation
    if (typeof condition !== "object" || condition === null) {
      return item[key] === condition;
    }

    return Object.entries(condition as Record<any, any>).every(([op, val]) => {
      switch (op) {
        case "$eq":
          return item[key] === val;
        case "$ne":
          return item[key] !== val;
        case "$gt":
          return item[key] > val;
        case "$gte":
          return item[key] >= val;
        case "$lt":
          return item[key] < val;
        case "$lte":
          return item[key] <= val;
        case "$in":
          return Array.isArray(val) && val.includes(item[key]);
        case "$nin":
          return Array.isArray(val) && !val.includes(item[key]);
        default:
          return true;
      }
    });
  }

  private applySorting(
    data: z.infer<T>[],
    orderBy: Record<string, "ASC" | "DESC">,
  ): z.infer<T>[] {
    return [...data].sort((a, b) => {
      for (const [field, direction] of Object.entries(orderBy)) {
        if (a[field] === b[field]) continue;

        const comparison = a[field] < b[field] ? -1 : 1;
        return direction === "ASC" ? comparison : -comparison;
      }
      return 0;
    });
  }
}
