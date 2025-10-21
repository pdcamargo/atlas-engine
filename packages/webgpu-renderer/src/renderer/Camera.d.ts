import { Mat4, Vector3 } from "@atlas/core";
import { Sprite } from "./Sprite";
/**
 * Base camera class
 */
export declare abstract class Camera {
    position: Vector3;
    target: Vector3;
    up: Vector3;
    protected _aspectRatio: number;
    protected _viewMatrix: Mat4;
    protected _projectionMatrix: Mat4;
    protected _viewProjectionMatrix: Mat4;
    protected _viewDirty: boolean;
    protected _projectionDirty: boolean;
    protected _viewProjectionDirty: boolean;
    /**
     * Mark view matrix as dirty
     */
    markViewDirty(): void;
    /**
     * Mark projection matrix as dirty
     */
    markProjectionDirty(): void;
    /**
     * Get the aspect ratio
     */
    getAspectRatio(): number;
    /**
     * Set the aspect ratio
     */
    setAspectRatio(aspectRatio: number): void;
    /**
     * Update view matrix
     */
    protected updateViewMatrix(): void;
    /**
     * Update projection matrix (to be implemented by subclasses)
     */
    protected abstract updateProjectionMatrix(): void;
    /**
     * Get the view matrix
     */
    getViewMatrix(): Mat4;
    /**
     * Get the projection matrix
     */
    getProjectionMatrix(): Mat4;
    /**
     * Get the combined view-projection matrix (cached)
     */
    getViewProjectionMatrix(): Mat4;
    /**
     * Check if a sprite is within the camera's view frustum
     * To be implemented by subclasses
     */
    abstract isInView(sprite: Sprite): boolean;
}
/**
 * Perspective camera
 */
export declare class PerspectiveCamera extends Camera {
    fov: number;
    near: number;
    far: number;
    constructor(fov?: number, aspect?: number, near?: number, far?: number);
    protected updateProjectionMatrix(): void;
    /**
     * Check if a sprite is within the perspective camera's view frustum
     * Uses a simplified frustum test
     */
    isInView(sprite: Sprite): boolean;
}
/**
 * Orthographic camera
 */
export declare class OrthographicCamera extends Camera {
    left: number;
    right: number;
    bottom: number;
    top: number;
    near: number;
    far: number;
    constructor(left?: number, right?: number, bottom?: number, top?: number, near?: number, far?: number);
    /**
     * Set orthographic bounds
     */
    setBounds(left: number, right: number, bottom: number, top: number): void;
    /**
     * Update bounds to maintain aspect ratio
     */
    updateBoundsForAspectRatio(): void;
    /**
     * Override setAspectRatio to automatically update bounds
     */
    setAspectRatio(aspectRatio: number): void;
    protected updateProjectionMatrix(): void;
    /**
     * Check if a sprite is within the orthographic camera's view frustum
     * Uses AABB (Axis-Aligned Bounding Box) intersection test
     */
    isInView(sprite: Sprite): boolean;
}
//# sourceMappingURL=Camera.d.ts.map