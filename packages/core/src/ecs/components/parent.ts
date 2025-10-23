import { Entity } from "../types";
import { Serializable, SerializeProperty } from "../serialization";

/**
 * Component to indicate that the entity has a parent (and the parent entity id)
 */
@Serializable()
export class Parent {
  @SerializeProperty({ serializer: "entity" })
  public parentId: Entity;

  constructor(parentId: Entity) {
    this.parentId = parentId;
  }
}

/**
 * Component to indicate that the entity has children (and the children entity ids)
 */
@Serializable()
export class Children {
  @SerializeProperty()
  public childrenIds: Entity[];

  constructor(childrenIds: Entity[]) {
    this.childrenIds = childrenIds;
  }
}
