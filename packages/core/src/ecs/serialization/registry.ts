import "reflect-metadata";
import type {
  ClassMetadata,
  Constructor,
  CustomSerializer,
  PropertyMetadata,
  SerializableOptions,
} from "./types";

/**
 * Metadata keys for reflect-metadata
 */
const METADATA_KEYS = {
  SERIALIZABLE: Symbol("serializable"),
  PROPERTIES: Symbol("serializable:properties"),
} as const;

/**
 * Global registry for serialization metadata
 */
export class SerializationRegistry {
  private static classMetadata = new Map<Constructor, ClassMetadata>();
  private static customSerializers = new Map<string, CustomSerializer>();
  private static typeSerializers = new Map<Constructor, CustomSerializer>();

  /**
   * Register a class as serializable
   */
  static registerClass(
    constructor: Constructor,
    options: SerializableOptions = {}
  ): void {
    const existing = this.classMetadata.get(constructor);
    if (existing) {
      // Update options but keep properties
      existing.options = { ...existing.options, ...options };
    } else {
      this.classMetadata.set(constructor, {
        constructor,
        options,
        properties: new Map(),
      });
    }
  }

  /**
   * Register a property as serializable
   */
  static registerProperty(
    constructor: Constructor,
    propertyMetadata: PropertyMetadata
  ): void {
    let classMetadata = this.classMetadata.get(constructor);
    if (!classMetadata) {
      // Auto-register the class if not already registered
      classMetadata = {
        constructor,
        options: {},
        properties: new Map(),
      };
      this.classMetadata.set(constructor, classMetadata);
    }

    classMetadata.properties.set(
      propertyMetadata.propertyKey,
      propertyMetadata
    );
  }

  /**
   * Get metadata for a class
   */
  static getClassMetadata(constructor: Constructor): ClassMetadata | undefined {
    return this.classMetadata.get(constructor);
  }

  /**
   * Get metadata for a class by name
   */
  static getClassMetadataByName(name: string): ClassMetadata | undefined {
    for (const [, metadata] of this.classMetadata) {
      const className = metadata.options.name || metadata.constructor.name;
      if (className === name) {
        return metadata;
      }
    }
    return undefined;
  }

  /**
   * Get all registered class metadata
   */
  static getAllClassMetadata(): Map<Constructor, ClassMetadata> {
    return new Map(this.classMetadata);
  }

  /**
   * Check if a class is registered as serializable
   */
  static isSerializable(constructor: Constructor): boolean {
    return this.classMetadata.has(constructor);
  }

  /**
   * Get the serialization name for a class
   */
  static getClassName(constructor: Constructor): string {
    const metadata = this.classMetadata.get(constructor);
    return metadata?.options.name || constructor.name;
  }

  /**
   * Register a custom serializer
   */
  static registerSerializer(serializer: CustomSerializer): void {
    this.customSerializers.set(serializer.name, serializer);
  }

  /**
   * Register a serializer for a specific type
   */
  static registerTypeSerializer(
    type: Constructor,
    serializer: CustomSerializer
  ): void {
    this.typeSerializers.set(type, serializer);
  }

  /**
   * Get a custom serializer by name
   */
  static getSerializer(name: string): CustomSerializer | undefined {
    return this.customSerializers.get(name);
  }

  /**
   * Get a serializer for a specific type
   */
  static getTypeSerializer(type: Constructor): CustomSerializer | undefined {
    return this.typeSerializers.get(type);
  }

  /**
   * Find a serializer that can handle a given value
   */
  static findSerializerForValue(value: any): CustomSerializer | undefined {
    // First check type serializers
    if (value?.constructor) {
      const typeSerializer = this.typeSerializers.get(value.constructor);
      if (typeSerializer) {
        return typeSerializer;
      }
    }

    // Then check custom serializers
    for (const [, serializer] of this.customSerializers) {
      if (serializer.canSerialize(value)) {
        return serializer;
      }
    }

    return undefined;
  }

  /**
   * Clear all metadata (useful for testing)
   */
  static clear(): void {
    this.classMetadata.clear();
    this.customSerializers.clear();
    this.typeSerializers.clear();
  }
}
