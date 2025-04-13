import { z } from "zod";

// Delta operations enum
export enum DeltaOp {
  ADD = "add", // Add a new record
  UPDATE = "update", // Update an existing record
  DELETE = "delete", // Delete a record
  PATCH = "patch", // Partial update to a record
}

// Delta record structure
export interface DeltaRecord<T> {
  op: DeltaOp;
  id: string;
  data?: Partial<T>; // For ADD, UPDATE, PATCH
  path?: string[]; // For PATCH - specify nested property path
}

// Delta package structure
export interface DeltaPackage<T> {
  version: number;
  timestamp: string;
  records: DeltaRecord<T>[];
  schemaUpdate?: any; // Optional schema update
}

/**
 * Utility class for handling delta operations in the NexusService
 */
export class DeltaUtils {
  /**
   * Applies a sequence of deltas to a base dataset
   */
  static applyDeltas<T>(baseData: T[], deltaPackages: DeltaPackage<T>[]): T[] {
    // Sort delta packages by version to ensure correct sequence
    const sortedDeltas = [...deltaPackages].sort(
      (a, b) => a.version - b.version,
    );

    // Start with base data
    let currentData = [...baseData];

    // Apply each delta in sequence
    for (const delta of sortedDeltas) {
      currentData = this.applyDeltaPackage(currentData, delta);
    }

    return currentData;
  }

  /**
   * Applies a single delta package to dataset
   */
  static applyDeltaPackage<T>(
    baseData: T[],
    deltaPackage: DeltaPackage<T>,
  ): T[] {
    // Create a map of existing data indexed by ID for fast lookups
    const dataMap = new Map<string, T>();

    // Add base data to the map
    for (const item of baseData) {
      const typedItem = item as unknown as { id: string } & T;
      dataMap.set(typedItem.id, typedItem);
    }

    // Apply each delta record
    for (const record of deltaPackage.records) {
      switch (record.op) {
        case DeltaOp.ADD:
          if (record.data) {
            // Add metadata for version tracking
            const newItem = {
              ...(record.data as object),
              __version: deltaPackage.version,
              __timestamp: deltaPackage.timestamp,
            } as unknown as T;
            dataMap.set(record.id, newItem);
          }
          break;

        case DeltaOp.UPDATE:
          if (record.data && dataMap.has(record.id)) {
            // Full replace with version update
            const updatedItem = {
              ...(record.data as object),
              __version: deltaPackage.version,
              __timestamp: deltaPackage.timestamp,
            } as unknown as T;
            dataMap.set(record.id, updatedItem);
          }
          break;

        case DeltaOp.PATCH:
          if (record.data && dataMap.has(record.id)) {
            const existingItem = dataMap.get(record.id);
            if (existingItem) {
              let updatedItem: any;

              if (record.path && record.path.length > 0) {
                // Deep update at specified path
                updatedItem = { ...(existingItem as object) };
                let current: any = updatedItem;

                // Navigate to the nested property
                for (let i = 0; i < record.path.length - 1; i++) {
                  const key = record.path[i];
                  if (!current[key]) current[key] = {};
                  current = current[key];
                }

                // Update the property
                const lastKey = record.path[record.path.length - 1];
                current[lastKey] = record.data;
              } else {
                // Shallow merge
                updatedItem = {
                  ...(existingItem as object),
                  ...(record.data as object),
                };
              }

              // Update version metadata
              updatedItem.__version = deltaPackage.version;
              updatedItem.__timestamp = deltaPackage.timestamp;

              dataMap.set(record.id, updatedItem as T);
            }
          }
          break;

        case DeltaOp.DELETE:
          dataMap.delete(record.id);
          break;
      }
    }

    // Convert map back to array
    return Array.from(dataMap.values());
  }

  /**
   * Creates a delta package by comparing two versions of data
   */
  static createDelta<T>(
    oldData: T[],
    newData: T[],
    version: number,
    options: {
      generatePatches?: boolean; // Whether to generate patches instead of full updates
      idField?: string; // Field to use as ID (default: 'id')
    } = {},
  ): DeltaPackage<T> {
    const idField = options.idField || "id";
    const timestamp = new Date().toISOString();
    const records: DeltaRecord<T>[] = [];

    // Map old data by ID
    const oldMap = new Map<string, T>();
    for (const item of oldData) {
      const id = (item as any)[idField];
      if (id) oldMap.set(id, item);
    }

    // Map new data by ID
    const newMap = new Map<string, T>();
    for (const item of newData) {
      const id = (item as any)[idField];
      if (id) newMap.set(id, item);
    }

    // Find added and updated records
    for (const [id, newItem] of newMap.entries()) {
      if (!oldMap.has(id)) {
        // Added record
        records.push({
          op: DeltaOp.ADD,
          id,
          data: newItem,
        });
      } else {
        const oldItem = oldMap.get(id)!;

        // Check if record changed
        if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
          if (options.generatePatches) {
            // Generate patch (only changed fields)
            const patch = this.diffObjects(oldItem, newItem);
            if (Object.keys(patch).length > 0) {
              records.push({
                op: DeltaOp.PATCH,
                id,
                data: patch as Partial<T>,
              });
            }
          } else {
            // Full update
            records.push({
              op: DeltaOp.UPDATE,
              id,
              data: newItem,
            });
          }
        }
      }
    }

    // Find deleted records
    for (const id of oldMap.keys()) {
      if (!newMap.has(id)) {
        records.push({
          op: DeltaOp.DELETE,
          id,
        });
      }
    }

    return {
      version,
      timestamp,
      records,
    };
  }

  /**
   * Creates a diff between two objects (only changed fields)
   */
  private static diffObjects<T>(oldObj: T, newObj: T): Partial<T> {
    const diff: Partial<T> = {};

    // Check all properties in the new object
    for (const key in newObj) {
      if (Object.prototype.hasOwnProperty.call(newObj, key)) {
        const oldVal = (oldObj as any)[key];
        const newVal = (newObj as any)[key];

        // Handle nested objects
        if (
          typeof oldVal === "object" &&
          oldVal !== null &&
          typeof newVal === "object" &&
          newVal !== null &&
          !Array.isArray(oldVal) &&
          !Array.isArray(newVal)
        ) {
          const nestedDiff = this.diffObjects(oldVal, newVal);
          if (Object.keys(nestedDiff).length > 0) {
            (diff as any)[key] = nestedDiff;
          }
        }
        // Handle primitive values and arrays
        else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          (diff as any)[key] = newVal;
        }
      }
    }

    return diff;
  }
}
