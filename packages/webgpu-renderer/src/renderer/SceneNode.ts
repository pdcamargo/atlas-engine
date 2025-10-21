import {
  Quaternion,
  QuaternionLike,
  Vector2,
  Vector2Like,
  Vector3,
  Vector3Like,
} from "@atlas/core";
import { mat4, Mat4 } from "gl-matrix";

const uuidv4 = () => {
  return crypto.randomUUID();
};

/**
 * Base class for all scene graph nodes
 * Supports hierarchical parent-child relationships with transform propagation
 */
export class SceneNode {
  public id: string;

  protected _parent: SceneNode | null = null;
  protected _children: SceneNode[] = [];

  // Local transform properties
  public position: Vector3 = new Vector3();
  public rotation: Quaternion = new Quaternion();
  public scale: Vector3 = new Vector3(1, 1, 1);

  // Transform matrices
  protected _localMatrix: Mat4 = mat4.create();
  protected _worldMatrix: Mat4 = mat4.create();
  protected _dirty: boolean = true;

  // Cached world transform components (to avoid expensive matrix extraction)
  // These are updated when world matrix is computed, avoiding sqrt() operations
  protected _worldPosition: Vector3 = new Vector3();
  protected _worldScale: Vector3 = new Vector3(1, 1, 1);
  protected _worldTransformDirty: boolean = true;

  public visible: boolean = true;

  // Static nodes have transforms calculated once and cached
  // Set to true for nodes that don't move (like level geometry)
  public isStatic: boolean = false;

  constructor(id?: string) {
    if (id) {
      this.id = id;
    } else {
      this.id = uuidv4();
    }

    // Set up change callbacks so animations can mark the node dirty
    this.position.setOnChange(() => this.markDirty());
    this.scale.setOnChange(() => this.markDirty());
  }

  /**
   * Add a child node to this node
   */
  addChild(child: SceneNode): void {
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
  removeChild(child: SceneNode): void {
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
  removeFromParent(): void {
    if (this._parent) {
      this._parent.removeChild(this);
    }
  }

  /**
   * Get all children
   */
  getChildren(): ReadonlyArray<SceneNode> {
    return this._children;
  }

  /**
   * Get parent node
   */
  getParent(): SceneNode | null {
    return this._parent;
  }

  /**
   * Mark this node and all children as needing transform update
   */
  markDirty(): void {
    this._dirty = true;
    this._worldTransformDirty = true;
    for (const child of this._children) {
      child.markDirty();
    }
  }

  /**
   * Update local transform matrix from position, rotation, scale
   */
  protected updateLocalMatrix(): void {
    mat4.fromRotationTranslationScale(
      this._localMatrix,
      this.rotation.data,
      this.position.data,
      this.scale.data
    );
  }

  /**
   * Update world matrix by combining parent's world matrix with local matrix
   * Static nodes skip recalculation once computed
   */
  updateWorldMatrix(parentWorldMatrix?: Mat4): void {
    // Only recalculate if dirty (or not static yet)
    if (this._dirty) {
      this.updateLocalMatrix();

      if (parentWorldMatrix) {
        mat4.multiply(this._worldMatrix, parentWorldMatrix, this._localMatrix);
      } else {
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
  getWorldPosition(): Vector3 {
    if (this._worldTransformDirty) {
      this.updateWorldTransformCache();
    }
    return this._worldPosition;
  }

  /**
   * Get world scale (cached, no expensive sqrt operations)
   * Extracts scale from world matrix only when dirty
   */
  getWorldScale(): Vector3 {
    if (this._worldTransformDirty) {
      this.updateWorldTransformCache();
    }
    return this._worldScale;
  }

  /**
   * Update cached world transform components from world matrix
   * Called only when world matrix changes (not every frame)
   */
  protected updateWorldTransformCache(): void {
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
    } else {
      // No parent, world scale = local scale (no sqrt needed!)
      this._worldScale.copyFrom(this.scale);
    }

    this._worldTransformDirty = false;
  }

  /**
   * Get the world transform matrix
   */
  getWorldMatrix(): Mat4 {
    return this._worldMatrix;
  }

  /**
   * Get the local transform matrix
   */
  getLocalMatrix(): Mat4 {
    return this._localMatrix;
  }

  /**
   * Traverse this node and all children
   * @param callback Function to call for each node
   */
  traverse(callback: (node: SceneNode) => void): void {
    callback(this);
    for (const child of this._children) {
      child.traverse(callback);
    }
  }

  public setPosition(position: Vector2Like | Vector2): void;
  public setPosition(position: Vector3Like | Vector3): void;
  public setPosition(
    position: Vector2Like | Vector2 | Vector3Like | Vector3
  ): void {
    this.position.copyFrom(position);

    this.markDirty();
  }

  public setScale(scale: Vector2Like | Vector2): void;
  public setScale(scale: Vector3Like | Vector3): void;
  public setScale(scale: Vector2Like | Vector2 | Vector3Like | Vector3): void {
    this.scale.copyFrom(scale);

    this.markDirty();
  }

  public setRotation(rotation: number): void;
  public setRotation(rotation: QuaternionLike | Quaternion | number): void {
    if (typeof rotation === "number") {
      this.rotation.rotate2D(rotation);
    } else {
      this.rotation.copyFrom(rotation);
    }

    this.markDirty();
  }
}
