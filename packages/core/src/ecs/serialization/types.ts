import type { AssetId, Handle, WeakHandle } from "../assets/handle";
import type { Entity } from "../types";

/**
 * Constructor type for any class
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Options for @SerializeProperty decorator
 */
export interface SerializePropertyOptions {
  /**
   * Factory function to get the type for this property
   * Useful for nullable types or when TypeScript can't infer the type
   * @example @SerializeProperty({ type: () => MyClass })
   */
  type?: () => Constructor;

  /**
   * Name of a custom serializer to use for this property
   * The serializer must be registered in the SerializerRegistry
   */
  serializer?: string;

  /**
   * Default value to use when deserializing if the property is missing
   */
  defaultValue?: any;

  /**
   * If true, this property is optional and will be skipped if undefined
   */
  optional?: boolean;

  /**
   * Custom key to use in serialized JSON (defaults to property name)
   */
  key?: string;
}

/**
 * Options for @Serializable decorator
 */
export interface SerializableOptions {
  /**
   * Custom name for this class in serialized data
   * Defaults to constructor.name
   */
  name?: string;

  /**
   * Custom factory function to create instances
   * Defaults to calling constructor with no args
   */
  factory?: () => any;
}

/**
 * Metadata for a serializable property
 */
export interface PropertyMetadata {
  /**
   * Property name on the class
   */
  propertyKey: string | symbol;

  /**
   * Type of the property (from reflect-metadata or options.type)
   */
  type?: Constructor;

  /**
   * Options passed to @SerializeProperty
   */
  options: SerializePropertyOptions;
}

/**
 * Metadata for a serializable class
 */
export interface ClassMetadata {
  /**
   * Constructor function
   */
  constructor: Constructor;

  /**
   * Options passed to @Serializable
   */
  options: SerializableOptions;

  /**
   * Property metadata for all serializable properties
   */
  properties: Map<string | symbol, PropertyMetadata>;
}

/**
 * Custom serializer interface
 * Allows registering custom logic for specific types
 */
export interface CustomSerializer<T = any> {
  /**
   * Name/identifier for this serializer
   */
  name: string;

  /**
   * Check if this serializer can handle the given value
   */
  canSerialize: (value: any) => boolean;

  /**
   * Serialize the value to a JSON-compatible structure
   */
  serialize: (value: T, context: SerializationContext) => any;

  /**
   * Deserialize from JSON-compatible structure back to the original type
   */
  deserialize: (data: any, context: DeserializationContext) => T;
}

/**
 * Context provided during serialization
 */
export interface SerializationContext {
  /**
   * The root object being serialized
   */
  root: any;

  /**
   * Path to current property (for debugging)
   */
  path: string[];

  /**
   * Map Entity IDs to scene-local IDs
   */
  entityIdMap?: Map<Entity, number>;

  /**
   * Custom data that can be passed through the serialization process
   */
  customData?: Map<string, any>;
}

/**
 * Context provided during deserialization
 */
export interface DeserializationContext {
  /**
   * The root object being deserialized
   */
  root: any;

  /**
   * Path to current property (for debugging)
   */
  path: string[];

  /**
   * Map scene-local IDs back to Entity IDs
   */
  entityIdMap?: Map<number, Entity>;

  /**
   * Custom data that can be passed through the deserialization process
   */
  customData?: Map<string, any>;
}

/**
 * Serialized representation of an object
 */
export interface SerializedObject {
  /**
   * Type identifier (class name)
   */
  __type: string;

  /**
   * Serialized property data
   */
  [key: string]: any;
}

/**
 * Special marker types for serialization
 */
export const SerializationMarkers = {
  TYPE: "__type",
  HANDLE: "__handle",
  WEAK_HANDLE: "__weakHandle",
  ENTITY_REF: "__entityRef",
  ASSET_ID: "__assetId",
  NULL: "__null",
  UNDEFINED: "__undefined",
} as const;

/**
 * Serialized Handle representation
 */
export interface SerializedHandle {
  [SerializationMarkers.HANDLE]: true;
  [SerializationMarkers.ASSET_ID]: string;
  [SerializationMarkers.TYPE]?: string;
}

/**
 * Serialized WeakHandle representation
 */
export interface SerializedWeakHandle {
  [SerializationMarkers.WEAK_HANDLE]: true;
  [SerializationMarkers.ASSET_ID]: string;
  [SerializationMarkers.TYPE]?: string;
}

/**
 * Serialized Entity reference
 */
export interface SerializedEntityRef {
  [SerializationMarkers.ENTITY_REF]: true;
  id: number; // Scene-local ID
}
