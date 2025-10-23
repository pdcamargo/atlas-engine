import { Point } from "../../components/transform";
import type {
  CustomSerializer,
  DeserializationContext,
  SerializationContext,
} from "../types";

/**
 * Serializer for Point class
 * Handles the Point class with its callback mechanism
 */
export class PointSerializer implements CustomSerializer<Point> {
  name = "point";

  canSerialize(value: any): boolean {
    return value instanceof Point;
  }

  serialize(value: Point, context: SerializationContext): any {
    return {
      __type: "Point",
      x: value.x,
      y: value.y,
    };
  }

  deserialize(data: any, context: DeserializationContext): Point {
    // Create a new Point without the callback (it will be set when added to Transform)
    return new Point(data.x ?? 0, data.y ?? 0);
  }
}
