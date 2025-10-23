export { HandleSerializer } from "./handle-serializer";
export { EntityRefSerializer } from "./entity-ref-serializer";
export { PointSerializer } from "./point-serializer";
export { ChildrenSerializer } from "./children-serializer";
export { TransformSerializer } from "./transform-serializer";

import { SerializationRegistry } from "../registry";
import { HandleSerializer } from "./handle-serializer";
import { EntityRefSerializer } from "./entity-ref-serializer";
import { PointSerializer } from "./point-serializer";
import { ChildrenSerializer } from "./children-serializer";
import { TransformSerializer } from "./transform-serializer";
import { Point, Transform } from "../../components/transform";
import { Children } from "../../components/parent";

/**
 * Register all built-in serializers
 * Call this during app initialization
 */
export function registerBuiltInSerializers(): void {
  const handleSerializer = new HandleSerializer();
  const entitySerializer = new EntityRefSerializer();
  const pointSerializer = new PointSerializer();
  const childrenSerializer = new ChildrenSerializer();
  const transformSerializer = new TransformSerializer();

  // Register by name (for explicit @SerializeProperty({ serializer: 'handle' }))
  SerializationRegistry.registerSerializer(handleSerializer);
  SerializationRegistry.registerSerializer(entitySerializer);
  SerializationRegistry.registerSerializer(pointSerializer);
  SerializationRegistry.registerSerializer(childrenSerializer);
  SerializationRegistry.registerSerializer(transformSerializer);

  // Register by type (for automatic detection)
  SerializationRegistry.registerTypeSerializer(Point, pointSerializer);
  SerializationRegistry.registerTypeSerializer(Children, childrenSerializer);
  SerializationRegistry.registerTypeSerializer(Transform, transformSerializer);
}
