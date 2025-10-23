/**
 * Serialization system for Atlas ECS
 * Provides decorator-based serialization for components and scenes
 */

// Core
export { Serializer } from "./serializer";
export { SerializationRegistry } from "./registry";

// Decorators
export { Serializable, SerializeProperty, makeSerializable } from "./decorators";

// Types
export type {
  Constructor,
  SerializableOptions,
  SerializePropertyOptions,
  CustomSerializer,
  SerializationContext,
  DeserializationContext,
  SerializedObject,
  PropertyMetadata,
  ClassMetadata,
} from "./types";

export { SerializationMarkers } from "./types";

// Built-in serializers
export {
  HandleSerializer,
  EntityRefSerializer,
  PointSerializer,
  ChildrenSerializer,
  TransformSerializer,
  registerBuiltInSerializers,
} from "./serializers";
