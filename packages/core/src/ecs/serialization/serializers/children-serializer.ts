import { Children } from "../../components/parent";
import type { Entity } from "../../types";
import type {
  CustomSerializer,
  DeserializationContext,
  SerializationContext,
} from "../types";
import { SerializationMarkers } from "../types";
import { EntityRefSerializer } from "./entity-ref-serializer";

/**
 * Serializer for Children component
 * Handles array of entity references
 */
export class ChildrenSerializer implements CustomSerializer<Children> {
  name = "children";
  private entitySerializer = new EntityRefSerializer();

  canSerialize(value: any): boolean {
    return value instanceof Children;
  }

  serialize(value: Children, context: SerializationContext): any {
    return {
      [SerializationMarkers.TYPE]: "Children",
      childrenIds: value.childrenIds.map((entityId) =>
        this.entitySerializer.serialize(entityId, context)
      ),
    };
  }

  deserialize(data: any, context: DeserializationContext): Children {
    const childrenIds = data.childrenIds.map((serializedEntity: any) =>
      this.entitySerializer.deserialize(serializedEntity, context)
    );
    return new Children(childrenIds);
  }
}
