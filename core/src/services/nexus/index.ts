import { z } from "zod";

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

      // Infer data type and parse accordingly
      const dataType = this.inferDataType(data);
      const parsedData = this.parseData(data, dataType);
      const schema = this.createSchemaFromJson(parsedData) as T;

      // Create a context that can be used for chaining
      return new DataContext<T>(schema, parsedData as z.infer<T>[]);
    }

    throw new Error("Failed to retrieve data");
  }

  inferDataType(data: any) {
    // Convert beginning of buffer to string for inspection
    const sampleText = new TextDecoder().decode(data.slice(0, 1000));

    // Check for JSON structure
    if (
      (sampleText.trim().startsWith("{") && sampleText.trim().endsWith("}")) ||
      (sampleText.trim().startsWith("[") && sampleText.trim().endsWith("]"))
    ) {
      try {
        JSON.parse(sampleText);
        return "json";
      } catch (e) {
        // Not valid JSON
      }
    }

    // Check for CSV (look for consistent delimiters)
    const lines = sampleText.split("\n").slice(0, 5);
    // if (lines.length > 1) {
    //   const commas = lines.map((line) => (line.match(/,/g) || []).length);
    //   if (commas.length > 1 && new Set(commas).size === 1) {
    //     return "csv";
    //   }
    // }

    // // Check for JSONL - multiple lines where each is valid JSON
    // if (lines.length > 1) {
    //   let validJsonLines = 0;
    //   // Check first few lines (up to 5)
    //   const linesToCheck = Math.min(5, lines.length);

    //   for (let i = 0; i < linesToCheck; i++) {
    //     try {
    //       JSON.parse(lines[i]);
    //       validJsonLines++;
    //     } catch (e) {
    //       // Not a valid JSON line
    //     }
    //   }

    //   // If most lines are valid JSON, it's probably JSONL
    //   if (validJsonLines >= Math.max(2, linesToCheck * 0.7)) {
    //     return "jsonl";
    //   }
    // }

    throw Error("Unsupported format!");
  }

  // convert to json
  parseData(data: any, dataType: string) {
    const text = new TextDecoder().decode(data);

    switch (dataType) {
      case "json":
        return JSON.parse(text);

      // case "jsonl":
      //   try {
      //     return text
      //       .split("\n")
      //       .filter((line) => line.trim())
      //       .map((line) => JSON.parse(line));
      //   } catch (e) {
      //     console.error("Error parsing JSONL:", e);
      //     return text;
      //   }
      // case "csv":
      //   // You'd use a CSV parser here like PapaParse
      //   return text.split("\n").map((line) => line.split(","));
      default:
        throw new Error("Invalid format!");
    }
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

  // type is an enum - inference, supervised-fine-tuning, drpo, orpo
  // returns jsonl output, which is then made downloadable on the UI
  transform(modelName: string, type: string) {
    return "";
  }

  // Get the raw result data
  get(): T[] {
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
