import type {
  CustomSerializer,
  DeserializationContext,
  SerializationContext,
} from "../types";

/**
 * Serializer for Map class
 * Handles the Map class with its private fields through public getters
 */
export class MapSerializer implements CustomSerializer<Map<any, any>> {
  name = "map";

  canSerialize(value: any): boolean {
    return value instanceof Map;
  }

  serialize(value: Map<any, any>, context: SerializationContext): any {
    return {
      __type: "Map",
      entries: Array.from(value.entries()),
    };
  }

  deserialize(data: any, context: DeserializationContext): Map<any, any> {
    return new Map(
      data.entries.map((entry: [any, any]) => [entry[0], entry[1]])
    );
  }
}
