import { Vector2, Vector3, Quaternion, Color, Rect } from "../../../math";
import type {
  CustomSerializer,
  DeserializationContext,
  SerializationContext,
} from "../types";

/**
 * Serializer for Vector3 class
 * Handles the Vector3 class with its private fields through public getters
 */
export class Vector3Serializer implements CustomSerializer<Vector3> {
  name = "vector3";

  canSerialize(value: any): boolean {
    return value instanceof Vector3;
  }

  serialize(value: Vector3, context: SerializationContext): any {
    return {
      __type: "Vector3",
      x: value.x,
      y: value.y,
      z: value.z,
    };
  }

  deserialize(data: any, context: DeserializationContext): Vector3 {
    return new Vector3(data.x || 0, data.y || 0, data.z || 0);
  }
}

/**
 * Serializer for Vector3 class
 * Handles the Vector3 class with its private fields through public getters
 */
export class Vector2Serializer implements CustomSerializer<Vector2> {
  name = "vector2";

  canSerialize(value: any): boolean {
    return value instanceof Vector2;
  }

  serialize(value: Vector2, context: SerializationContext): any {
    return {
      __type: "Vector2",
      x: value.x,
      y: value.y,
    };
  }

  deserialize(data: any, context: DeserializationContext): Vector2 {
    return new Vector2(data.x || 0, data.y || 0);
  }
}

/**
 * Serializer for Vector3 class
 * Handles the Vector3 class with its private fields through public getters
 */
export class QuaternionSerializer implements CustomSerializer<Quaternion> {
  name = "quaternion";

  canSerialize(value: any): boolean {
    return value instanceof Quaternion;
  }

  serialize(value: Quaternion, context: SerializationContext): any {
    return {
      __type: "Quaternion",
      x: value.x,
      y: value.y,
      z: value.z,
      w: value.w,
    };
  }

  deserialize(data: any, context: DeserializationContext): Quaternion {
    return new Quaternion(data.x || 0, data.y || 0, data.z || 0, data.w || 1);
  }
}

/**
 * Serializer for Color class
 * Handles the Color class with its private fields through public getters
 */
export class ColorSerializer implements CustomSerializer<Color> {
  name = "color";

  canSerialize(value: any): boolean {
    return value instanceof Color;
  }

  serialize(value: Color, context: SerializationContext): any {
    return {
      __type: "Color",
      r: value.r,
      g: value.g,
      b: value.b,
      a: value.a,
    };
  }

  deserialize(data: any, context: DeserializationContext): Color {
    return new Color(data.r || 0, data.g || 0, data.b || 0, data.a || 1);
  }
}

/**
 * Serializer for Rect class
 * Handles the Rect class with its private fields through public getters
 */
export class RectSerializer implements CustomSerializer<Rect> {
  name = "rect";

  canSerialize(value: any): boolean {
    return value instanceof Rect;
  }

  serialize(value: Rect, context: SerializationContext): any {
    return {
      __type: "Rect",
      x: value.x,
      y: value.y,
      w: value.width,
      h: value.height,
    };
  }

  deserialize(data: any, context: DeserializationContext): Rect {
    return new Rect(data.x || 0, data.y || 0, data.w || 0, data.h || 0);
  }
}
