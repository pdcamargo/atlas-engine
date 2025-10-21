import type { PropertyAccessor } from "./types";

/**
 * Default property accessor implementation
 * Supports nested property paths using dot notation (e.g., "position.x")
 */
export class DefaultPropertyAccessor implements PropertyAccessor {
  /**
   * Get a property value from a target object using a path
   * @param target - Target object
   * @param path - Property path (e.g., "position.x")
   * @returns The property value, or undefined if not found
   */
  public get(target: any, path: string): number | undefined {
    if (!target) return undefined;

    const parts = path.split(".");
    let current = target;

    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]!];
      if (current === undefined || current === null) {
        return undefined;
      }
    }

    const finalKey = parts[parts.length - 1]!;
    const value = current[finalKey];

    if (typeof value === "number") {
      return value;
    }

    return undefined;
  }

  /**
   * Set a property value on a target object using a path
   * @param target - Target object
   * @param path - Property path (e.g., "position.x")
   * @param value - Value to set
   */
  public set(target: any, path: string, value: number): void {
    if (!target) return;

    const parts = path.split(".");
    let current = target;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      if (current[part] === undefined || current[part] === null) {
        // Create intermediate objects if they don't exist
        current[part] = {};
      }
      current = current[part];
    }

    const finalKey = parts[parts.length - 1]!;
    current[finalKey] = value;
  }
}

/**
 * Global property accessor instance
 */
export const propertyAccessor = new DefaultPropertyAccessor();
