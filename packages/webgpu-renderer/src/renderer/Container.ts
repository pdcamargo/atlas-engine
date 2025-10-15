import { SceneNode } from "./SceneNode";

/**
 * Container class for grouping scene nodes
 * Acts as a simple group that can be positioned and its children will move with it
 * No rendering properties - purely for organization and transform hierarchy
 */
export class Container extends SceneNode {
  constructor(id?: string) {
    super(id);
  }
}
