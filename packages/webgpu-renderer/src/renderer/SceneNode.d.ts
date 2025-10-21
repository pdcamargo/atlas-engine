import { Quaternion, Vector2, Vector2Like, Vector3, Vector3Like } from "@atlas/core";
import { Mat4 } from "gl-matrix";
/**
 * Base class for all scene graph nodes
 * Supports hierarchical parent-child relationships with transform propagation
 */
export declare class SceneNode {
    id: string;
    protected _parent: SceneNode | null;
    protected _children: SceneNode[];
    position: Vector3;
    rotation: Quaternion;
    scale: Vector3;
    protected _localMatrix: Mat4;
    protected _worldMatrix: Mat4;
    protected _dirty: boolean;
    protected _worldPosition: Vector3;
    protected _worldScale: Vector3;
    protected _worldTransformDirty: boolean;
    visible: boolean;
    isStatic: boolean;
    constructor(id?: string);
    /**
     * Add a child node to this node
     */
    addChild(child: SceneNode): void;
    /**
     * Remove a child node from this node
     */
    removeChild(child: SceneNode): void;
    /**
     * Remove this node from its parent
     */
    removeFromParent(): void;
    /**
     * Get all children
     */
    getChildren(): ReadonlyArray<SceneNode>;
    /**
     * Get parent node
     */
    getParent(): SceneNode | null;
    /**
     * Mark this node and all children as needing transform update
     */
    markDirty(): void;
    /**
     * Update local transform matrix from position, rotation, scale
     */
    protected updateLocalMatrix(): void;
    /**
     * Update world matrix by combining parent's world matrix with local matrix
     * Static nodes skip recalculation once computed
     */
    updateWorldMatrix(parentWorldMatrix?: Mat4): void;
    /**
     * Get world position (cached, no matrix extraction)
     * Much faster than extracting from matrix every time
     */
    getWorldPosition(): Vector3;
    /**
     * Get world scale (cached, no expensive sqrt operations)
     * Extracts scale from world matrix only when dirty
     */
    getWorldScale(): Vector3;
    /**
     * Update cached world transform components from world matrix
     * Called only when world matrix changes (not every frame)
     */
    protected updateWorldTransformCache(): void;
    /**
     * Get the world transform matrix
     */
    getWorldMatrix(): Mat4;
    /**
     * Get the local transform matrix
     */
    getLocalMatrix(): Mat4;
    /**
     * Traverse this node and all children
     * @param callback Function to call for each node
     */
    traverse(callback: (node: SceneNode) => void): void;
    setPosition(position: Vector2Like | Vector2): void;
    setPosition(position: Vector3Like | Vector3): void;
    setScale(scale: Vector2Like | Vector2): void;
    setScale(scale: Vector3Like | Vector3): void;
    setRotation(rotation: number): void;
}
//# sourceMappingURL=SceneNode.d.ts.map