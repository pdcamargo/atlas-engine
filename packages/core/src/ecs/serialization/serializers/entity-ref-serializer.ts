import type { Entity } from "../../types";
import type {
  CustomSerializer,
  DeserializationContext,
  SerializationContext,
  SerializedEntityRef,
} from "../types";
import { SerializationMarkers } from "../types";

/**
 * Serializer for Entity references
 * Converts entity IDs to scene-local IDs during serialization
 * and maps them back during deserialization
 */
export class EntityRefSerializer implements CustomSerializer<Entity> {
  name = "entity";

  canSerialize(value: any): boolean {
    // Entity is just a number, so we need to rely on explicit use of this serializer
    // or context to determine if a number is an entity reference
    return typeof value === "number" && Number.isInteger(value) && value >= 0;
  }

  serialize(value: Entity, context: SerializationContext): SerializedEntityRef {
    if (!context.entityIdMap) {
      // No mapping available, serialize the raw entity ID
      console.warn(
        "No entityIdMap in context, serializing raw entity ID. This may cause issues on deserialization."
      );
      return {
        [SerializationMarkers.ENTITY_REF]: true,
        id: value,
      };
    }

    const sceneLocalId = context.entityIdMap.get(value);
    if (sceneLocalId === undefined) {
      throw new Error(
        `Entity ${value} not found in entityIdMap at path ${context.path.join(".")}`
      );
    }

    return {
      [SerializationMarkers.ENTITY_REF]: true,
      id: sceneLocalId,
    };
  }

  deserialize(data: SerializedEntityRef, context: DeserializationContext): Entity {
    if (!context.entityIdMap) {
      // No mapping available, deserialize the raw entity ID
      console.warn(
        "No entityIdMap in context, deserializing raw entity ID. This may cause issues."
      );
      return data.id;
    }

    const entity = context.entityIdMap.get(data.id);
    if (entity === undefined) {
      throw new Error(
        `Scene-local ID ${data.id} not found in entityIdMap at path ${context.path.join(".")}`
      );
    }

    return entity;
  }
}
