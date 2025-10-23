import { Point, Transform } from "../../components/transform";
import type {
  CustomSerializer,
  DeserializationContext,
  SerializationContext,
} from "../types";

/**
 * Serializer for Transform class
 * Handles the Transform class with its private fields through public getters
 */
export class TransformSerializer implements CustomSerializer<Transform> {
  name = "transform";

  canSerialize(value: any): boolean {
    return value instanceof Transform;
  }

  serialize(value: Transform, context: SerializationContext): any {
    return {
      __type: "Transform",
      position: {
        x: value.position.x,
        y: value.position.y,
      },
      rotation: value.rotation,
      scale: {
        x: value.scale.x,
        y: value.scale.y,
      },
    };
  }

  deserialize(data: any, context: DeserializationContext): Transform {
    return new Transform(
      data.position || { x: 0, y: 0 },
      data.rotation || 0,
      data.scale || { x: 1, y: 1 }
    );
  }
}
