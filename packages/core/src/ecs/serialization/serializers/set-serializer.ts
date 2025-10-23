import type {
  CustomSerializer,
  DeserializationContext,
  SerializationContext,
} from "../types";

/**
 * Serializer for Set class
 * Handles the Set class with its private fields through public getters
 */
export class SetSerializer implements CustomSerializer<Set<any>> {
  name = "map";

  canSerialize(value: any): boolean {
    return value instanceof Set;
  }

  serialize(value: Set<any>, context: SerializationContext): any {
    return {
      __type: "Set",
      values: Array.from(value.values()),
    };
  }

  deserialize(data: any, context: DeserializationContext): Set<any> {
    return new Set(data.values);
  }
}
