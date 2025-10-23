export { HandleSerializer } from "./handle-serializer";
export { EntityRefSerializer } from "./entity-ref-serializer";
export { ChildrenSerializer } from "./children-serializer";
export { ColorSerializer } from "./math-serializer";
export { QuaternionSerializer } from "./math-serializer";
export { RectSerializer } from "./math-serializer";
export { Vector2Serializer } from "./math-serializer";
export { Vector3Serializer } from "./math-serializer";
export { MapSerializer } from "./map-serializer";
import { SerializationRegistry } from "../registry";
import { HandleSerializer } from "./handle-serializer";
import { EntityRefSerializer } from "./entity-ref-serializer";
import { ChildrenSerializer } from "./children-serializer";
import { Children } from "../../components/parent";
import {
  ColorSerializer,
  QuaternionSerializer,
  RectSerializer,
  Vector2Serializer,
  Vector3Serializer,
} from "./math-serializer";
import { Color, Quaternion, Rect, Vector2, Vector3 } from "../../../math";
import { MapSerializer } from "./map-serializer";
import { SetSerializer } from "./set-serializer";
/**
 * Register all built-in serializers
 * Call this during app initialization
 */
export function registerBuiltInSerializers(): void {
  const handleSerializer = new HandleSerializer();
  const entitySerializer = new EntityRefSerializer();
  const childrenSerializer = new ChildrenSerializer();
  const vector2Serializer = new Vector2Serializer();
  const vector3Serializer = new Vector3Serializer();
  const quaternionSerializer = new QuaternionSerializer();
  const colorSerializer = new ColorSerializer();
  const rectSerializer = new RectSerializer();
  const mapSerializer = new MapSerializer();
  const setSerializer = new SetSerializer();
  // Register by name (for explicit @SerializeProperty({ serializer: 'handle' }))
  SerializationRegistry.registerSerializer(handleSerializer);
  SerializationRegistry.registerSerializer(entitySerializer);
  SerializationRegistry.registerSerializer(childrenSerializer);
  SerializationRegistry.registerSerializer(vector2Serializer);
  SerializationRegistry.registerSerializer(vector3Serializer);
  SerializationRegistry.registerSerializer(quaternionSerializer);
  SerializationRegistry.registerSerializer(colorSerializer);
  SerializationRegistry.registerSerializer(rectSerializer);
  SerializationRegistry.registerSerializer(mapSerializer);
  SerializationRegistry.registerSerializer(setSerializer);
  // Register by type (for automatic detection)
  SerializationRegistry.registerTypeSerializer(Children, childrenSerializer);
  SerializationRegistry.registerTypeSerializer(Vector2, vector2Serializer);
  SerializationRegistry.registerTypeSerializer(Vector3, vector3Serializer);
  SerializationRegistry.registerTypeSerializer(
    Quaternion,
    quaternionSerializer
  );
  SerializationRegistry.registerTypeSerializer(Color, colorSerializer);
  SerializationRegistry.registerTypeSerializer(Rect, rectSerializer);
  SerializationRegistry.registerTypeSerializer(Map, mapSerializer);
  SerializationRegistry.registerTypeSerializer(Set, setSerializer);
}
