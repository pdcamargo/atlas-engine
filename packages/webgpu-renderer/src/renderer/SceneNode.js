import { Quaternion, Vector3, } from "@atlas/core";
import { mat4 } from "gl-matrix";
const uuidv4 = () => {
    return crypto.randomUUID();
};
/**
 * Base class for all scene graph nodes
 * Supports hierarchical parent-child relationships with transform propagation
 */
export class SceneNode {
    id;
    _parent = null;
    _children = [];
    // Local transform properties
    position = new Vector3();
    rotation = new Quaternion();
    scale = new Vector3(1, 1, 1);
    // Transform matrices
    _localMatrix = mat4.create();
    _worldMatrix = mat4.create();
    _dirty = true;
    // Cached world transform components (to avoid expensive matrix extraction)
    // These are updated when world matrix is computed, avoiding sqrt() operations
    _worldPosition = new Vector3();
    _worldScale = new Vector3(1, 1, 1);
    _worldTransformDirty = true;
    visible = true;
    // Static nodes have transforms calculated once and cached
    // Set to true for nodes that don't move (like level geometry)
    isStatic = false;
    constructor(id) {
        if (id) {
            this.id = id;
        }
        else {
            this.id = uuidv4();
        }
        // Set up change callbacks so animations can mark the node dirty
        this.position.setOnChange(() => this.markDirty());
        this.scale.setOnChange(() => this.markDirty());
    }
    /**
     * Add a child node to this node
     */
    addChild(child) {
        if (child._parent) {
            child._parent.removeChild(child);
        }
        child._parent = this;
        this._children.push(child);
        child.markDirty();
    }
    /**
     * Remove a child node from this node
     */
    removeChild(child) {
        const index = this._children.indexOf(child);
        if (index !== -1) {
            this._children.splice(index, 1);
            child._parent = null;
            child.markDirty();
        }
    }
    /**
     * Remove this node from its parent
     */
    removeFromParent() {
        if (this._parent) {
            this._parent.removeChild(this);
        }
    }
    /**
     * Get all children
     */
    getChildren() {
        return this._children;
    }
    /**
     * Get parent node
     */
    getParent() {
        return this._parent;
    }
    /**
     * Mark this node and all children as needing transform update
     */
    markDirty() {
        this._dirty = true;
        this._worldTransformDirty = true;
        for (const child of this._children) {
            child.markDirty();
        }
    }
    /**
     * Update local transform matrix from position, rotation, scale
     */
    updateLocalMatrix() {
        mat4.fromRotationTranslationScale(this._localMatrix, this.rotation.data, this.position.data, this.scale.data);
    }
    /**
     * Update world matrix by combining parent's world matrix with local matrix
     * Static nodes skip recalculation once computed
     */
    updateWorldMatrix(parentWorldMatrix) {
        // Only recalculate if dirty (or not static yet)
        if (this._dirty) {
            this.updateLocalMatrix();
            if (parentWorldMatrix) {
                mat4.multiply(this._worldMatrix, parentWorldMatrix, this._localMatrix);
            }
            else {
                mat4.copy(this._worldMatrix, this._localMatrix);
            }
            this._dirty = false;
            this._worldTransformDirty = true; // Need to extract world position/scale
        }
        // Update children (they handle their own dirty flags)
        for (const child of this._children) {
            child.updateWorldMatrix(this._worldMatrix);
        }
    }
    /**
     * Get world position (cached, no matrix extraction)
     * Much faster than extracting from matrix every time
     */
    getWorldPosition() {
        if (this._worldTransformDirty) {
            this.updateWorldTransformCache();
        }
        return this._worldPosition;
    }
    /**
     * Get world scale (cached, no expensive sqrt operations)
     * Extracts scale from world matrix only when dirty
     */
    getWorldScale() {
        if (this._worldTransformDirty) {
            this.updateWorldTransformCache();
        }
        return this._worldScale;
    }
    /**
     * Update cached world transform components from world matrix
     * Called only when world matrix changes (not every frame)
     */
    updateWorldTransformCache() {
        const m = this._worldMatrix;
        // Extract position (translation) - simple array access, no math
        this._worldPosition.x = m[12];
        this._worldPosition.y = m[13];
        this._worldPosition.z = m[14];
        // Extract scale - use sqrt only when actually needed (when matrix changes)
        // For flat sprites (no parent), this is just the local scale
        if (this._parent) {
            // Has parent, need to extract from combined matrix
            this._worldScale.x = Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]);
            this._worldScale.y = Math.sqrt(m[4] * m[4] + m[5] * m[5] + m[6] * m[6]);
            this._worldScale.z = Math.sqrt(m[8] * m[8] + m[9] * m[9] + m[10] * m[10]);
        }
        else {
            // No parent, world scale = local scale (no sqrt needed!)
            this._worldScale.copyFrom(this.scale);
        }
        this._worldTransformDirty = false;
    }
    /**
     * Get the world transform matrix
     */
    getWorldMatrix() {
        return this._worldMatrix;
    }
    /**
     * Get the local transform matrix
     */
    getLocalMatrix() {
        return this._localMatrix;
    }
    /**
     * Traverse this node and all children
     * @param callback Function to call for each node
     */
    traverse(callback) {
        callback(this);
        for (const child of this._children) {
            child.traverse(callback);
        }
    }
    setPosition(position) {
        this.position.copyFrom(position);
        this.markDirty();
    }
    setScale(scale) {
        this.scale.copyFrom(scale);
        this.markDirty();
    }
    setRotation(rotation) {
        if (typeof rotation === "number") {
            this.rotation.rotate2D(rotation);
        }
        else {
            this.rotation.copyFrom(rotation);
        }
        this.markDirty();
    }
}
