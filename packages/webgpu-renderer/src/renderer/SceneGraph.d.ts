import { SceneNode } from "./SceneNode";
/**
 * Container for scene graph root nodes
 * Provides traversal interface for renderer
 */
export declare class SceneGraph {
    private _roots;
    /**
     * Add a root-level node to the scene graph
     */
    addRoot(node: SceneNode): void;
    /**
     * Remove a root-level node from the scene graph
     */
    removeRoot(node: SceneNode): void;
    /**
     * Get all root nodes
     */
    getRoots(): ReadonlyArray<SceneNode>;
    /**
     * Update world matrices for all nodes in the graph
     */
    updateTransforms(): void;
    /**
     * Traverse all nodes in the scene graph
     */
    traverse(callback: (node: SceneNode) => void): void;
    /**
     * Traverse only visible nodes in the scene graph
     * Skips invisible nodes and their children entirely
     */
    traverseVisible(callback: (node: SceneNode) => void): void;
    /**
     * Recursively traverse a node and its children, respecting visibility
     */
    private traverseNodeVisible;
    /**
     * Clear all roots from the scene graph
     */
    clear(): void;
}
//# sourceMappingURL=SceneGraph.d.ts.map