import "reflect-metadata";
import { SerializationRegistry } from "./registry";
import type {
  Constructor,
  DeserializationContext,
  SerializationContext,
  SerializedObject,
} from "./types";
import { SerializationMarkers } from "./types";

/**
 * Core serializer class
 * Handles serialization and deserialization of objects with decorator metadata
 */
export class Serializer {
  /**
   * Serialize an object to a JSON-compatible structure
   */
  static serialize(
    obj: any,
    context: Partial<SerializationContext> = {}
  ): any {
    const ctx: SerializationContext = {
      root: obj,
      path: [],
      entityIdMap: context.entityIdMap,
      customData: context.customData || new Map(),
      ...context,
    };

    return this.serializeValue(obj, ctx);
  }

  /**
   * Deserialize from a JSON-compatible structure back to an object
   */
  static deserialize<T = any>(
    data: any,
    context: Partial<DeserializationContext> = {}
  ): T {
    const ctx: DeserializationContext = {
      root: data,
      path: [],
      entityIdMap: context.entityIdMap,
      customData: context.customData || new Map(),
      ...context,
    };

    return this.deserializeValue(data, ctx);
  }

  /**
   * Serialize a single value (recursive)
   */
  private static serializeValue(value: any, context: SerializationContext): any {
    // Handle primitives and null/undefined
    if (value === null) {
      return { [SerializationMarkers.NULL]: true };
    }
    if (value === undefined) {
      return { [SerializationMarkers.UNDEFINED]: true };
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return value;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item, index) => {
        const itemContext = {
          ...context,
          path: [...context.path, `[${index}]`],
        };
        return this.serializeValue(item, itemContext);
      });
    }

    // Handle Date
    if (value instanceof Date) {
      return {
        [SerializationMarkers.TYPE]: "Date",
        value: value.toISOString(),
      };
    }

    // Check for custom serializers
    const customSerializer = SerializationRegistry.findSerializerForValue(value);
    if (customSerializer) {
      return customSerializer.serialize(value, context);
    }

    // Handle plain objects (no constructor or Object constructor)
    if (
      !value.constructor ||
      value.constructor === Object ||
      value.constructor.name === "Object"
    ) {
      const result: any = {};
      for (const [key, val] of Object.entries(value)) {
        const propContext = {
          ...context,
          path: [...context.path, key],
        };
        result[key] = this.serializeValue(val, propContext);
      }
      return result;
    }

    // Handle serializable classes
    const metadata = SerializationRegistry.getClassMetadata(value.constructor);
    if (metadata) {
      return this.serializeObject(value, metadata, context);
    }

    // For unknown types, warn and return undefined (will be skipped)
    console.warn(
      `Class ${value.constructor.name} at path ${context.path.join(".")} is not serializable. Add @Serializable() decorator or register a custom serializer. Skipping.`
    );
    return undefined;
  }

  /**
   * Serialize an object with metadata
   */
  private static serializeObject(
    obj: any,
    metadata: any,
    context: SerializationContext
  ): SerializedObject {
    const result: SerializedObject = {
      [SerializationMarkers.TYPE]: SerializationRegistry.getClassName(
        metadata.constructor
      ),
    };

    for (const [propertyKey, propMetadata] of metadata.properties) {
      const key = propMetadata.options.key || (propertyKey as string);
      const value = obj[propertyKey];

      // Skip undefined optional properties
      if (value === undefined && propMetadata.options.optional) {
        continue;
      }

      const propContext = {
        ...context,
        path: [...context.path, key],
      };

      // Use custom serializer if specified
      if (propMetadata.options.serializer) {
        const serializer = SerializationRegistry.getSerializer(
          propMetadata.options.serializer
        );
        if (serializer) {
          result[key] = serializer.serialize(value, propContext);
          continue;
        }
      }

      result[key] = this.serializeValue(value, propContext);
    }

    return result;
  }

  /**
   * Deserialize a single value (recursive)
   */
  private static deserializeValue(data: any, context: DeserializationContext): any {
    // Handle primitives
    if (
      data === null ||
      typeof data === "string" ||
      typeof data === "number" ||
      typeof data === "boolean"
    ) {
      return data;
    }

    // Handle special markers
    if (typeof data === "object") {
      if (data[SerializationMarkers.NULL]) {
        return null;
      }
      if (data[SerializationMarkers.UNDEFINED]) {
        return undefined;
      }

      // Handle Date
      if (data[SerializationMarkers.TYPE] === "Date" && data.value) {
        return new Date(data.value);
      }

      // Check for custom serializers by checking markers
      for (const [, serializer] of SerializationRegistry.getAllClassMetadata()) {
        // This is a bit of a hack - we'll improve this with custom serializers
      }

      // Try to find a custom deserializer
      if (data[SerializationMarkers.HANDLE] || data[SerializationMarkers.WEAK_HANDLE]) {
        const serializer = SerializationRegistry.getSerializer("handle");
        if (serializer) {
          return serializer.deserialize(data, context);
        }
      }

      if (data[SerializationMarkers.ENTITY_REF]) {
        const serializer = SerializationRegistry.getSerializer("entity");
        if (serializer) {
          return serializer.deserialize(data, context);
        }
      }
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item, index) => {
        const itemContext = {
          ...context,
          path: [...context.path, `[${index}]`],
        };
        return this.deserializeValue(item, itemContext);
      });
    }

    // Handle objects with type information
    if (data[SerializationMarkers.TYPE]) {
      const typeName = data[SerializationMarkers.TYPE];
      const metadata = SerializationRegistry.getClassMetadataByName(typeName);

      if (metadata) {
        return this.deserializeObject(data, metadata, context);
      }

      // Try to find a custom serializer by name (e.g., "transform", "point")
      const serializerName = typeName.toLowerCase();
      const customSerializer = SerializationRegistry.getSerializer(serializerName);
      if (customSerializer) {
        return customSerializer.deserialize(data, context);
      }

      // Unknown type, return as plain object without the __type field
      console.warn(
        `No deserializer found for type ${typeName} at path ${context.path.join(".")}. Returning as plain object.`
      );
      const result: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (key === SerializationMarkers.TYPE) continue;
        const propContext = {
          ...context,
          path: [...context.path, key],
        };
        result[key] = this.deserializeValue(value, propContext);
      }
      return result;
    }

    // Plain object without type
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      const propContext = {
        ...context,
        path: [...context.path, key],
      };
      result[key] = this.deserializeValue(value, propContext);
    }
    return result;
  }

  /**
   * Deserialize an object with metadata
   */
  private static deserializeObject(
    data: any,
    metadata: any,
    context: DeserializationContext
  ): any {
    // Create instance using factory or default constructor
    let instance: any;
    if (metadata.options.factory) {
      instance = metadata.options.factory();
    } else {
      try {
        instance = new metadata.constructor();
      } catch (e) {
        console.error(
          `Failed to create instance of ${metadata.constructor.name}:`,
          e
        );
        throw e;
      }
    }

    // Deserialize properties
    for (const [propertyKey, propMetadata] of metadata.properties) {
      const key = propMetadata.options.key || (propertyKey as string);
      const value = data[key];

      // Use default value if missing
      if (value === undefined) {
        if (propMetadata.options.defaultValue !== undefined) {
          instance[propertyKey] = propMetadata.options.defaultValue;
        }
        continue;
      }

      const propContext = {
        ...context,
        path: [...context.path, key],
      };

      // Use custom serializer if specified
      if (propMetadata.options.serializer) {
        const serializer = SerializationRegistry.getSerializer(
          propMetadata.options.serializer
        );
        if (serializer) {
          instance[propertyKey] = serializer.deserialize(value, propContext);
          continue;
        }
      }

      instance[propertyKey] = this.deserializeValue(value, propContext);
    }

    return instance;
  }
}
