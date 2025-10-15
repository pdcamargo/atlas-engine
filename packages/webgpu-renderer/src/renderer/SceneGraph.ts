import { SceneNode } from "./SceneNode";

/**
 * Container for scene graph root nodes
 * Provides traversal interface for renderer
 */
export class SceneGraph {
  private _roots: SceneNode[] = [];

  /**
   * Add a root-level node to the scene graph
   */
  addRoot(node: SceneNode): void {
    if (node.getParent()) {
      node.removeFromParent();
    }
    this._roots.push(node);
  }

  /**
   * Remove a root-level node from the scene graph
   */
  removeRoot(node: SceneNode): void {
    const index = this._roots.indexOf(node);
    if (index !== -1) {
      this._roots.splice(index, 1);
    }
  }

  /**
   * Get all root nodes
   */
  getRoots(): ReadonlyArray<SceneNode> {
    return this._roots;
  }

  /**
   * Update world matrices for all nodes in the graph
   */
  updateTransforms(): void {
    for (const root of this._roots) {
      root.updateWorldMatrix();
    }
  }

  /**
   * Traverse all nodes in the scene graph
   */
  traverse(callback: (node: SceneNode) => void): void {
    for (const root of this._roots) {
      root.traverse(callback);
    }
  }

  /**
   * Traverse only visible nodes in the scene graph
   * Skips invisible nodes and their children entirely
   */
  traverseVisible(callback: (node: SceneNode) => void): void {
    for (const root of this._roots) {
      this.traverseNodeVisible(root, callback);
    }
  }

  /**
   * Recursively traverse a node and its children, respecting visibility
   */
  private traverseNodeVisible(
    node: SceneNode,
    callback: (node: SceneNode) => void
  ): void {
    if (!node.visible) {
      return; // Skip this node and all its children
    }

    callback(node);

    // Recursively traverse children
    for (const child of node.getChildren()) {
      this.traverseNodeVisible(child, callback);
    }
  }

  /**
   * Clear all roots from the scene graph
   */
  clear(): void {
    this._roots = [];
  }
}
