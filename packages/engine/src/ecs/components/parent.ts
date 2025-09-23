import { Entity } from "../types";

/**
 * Component to indicate that the entity has a parent (and the parent entity id)
 */
export class Parent {
  constructor(public parentId: Entity) {}
}

/**
 * Component to indicate that the entity has children (and the children entity ids)
 */
export class Children {
  constructor(public childrenIds: Entity[]) {}
}
