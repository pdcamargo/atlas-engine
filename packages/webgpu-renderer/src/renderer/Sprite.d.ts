import { SceneNode } from "./SceneNode";
import { Texture } from "./Texture";
import { Rect, Color, Handle, ImageAsset } from "@atlas/core";
import { Material } from "../materials/Material";
import { Effect } from "../effects/Effect";
/**
 * Sprite class for rendering textured quads
 * Supports both pre-loaded Textures and lazy-loaded Handles
 * Now supports custom materials and visual effects
 */
export declare class Sprite extends SceneNode {
    texture: Texture | Handle<ImageAsset> | null;
    width: number;
    height: number;
    frame: Rect;
    tint: Color;
    material: Material;
    private _effects;
    constructor(texture?: Texture | Handle<ImageAsset> | null, width?: number, height?: number, id?: string);
    /**
     * Set the texture for this sprite
     */
    setTexture(texture: Texture | Handle<ImageAsset>): void;
    /**
     * Get the loaded Texture (returns null if texture is a Handle or not loaded)
     */
    getTexture(): Texture | null;
    /**
     * Get the Handle if texture is still loading (returns null if already a Texture)
     */
    getHandle(): Handle<ImageAsset> | null;
    /**
     * Set the size of the sprite
     */
    setSize(width: number, height: number): void;
    /**
     * Set the frame (texture region) for this sprite
     */
    setFrame(frame: Rect): void;
    getTint(): Color;
    /**
     * Set the tint color for this sprite
     */
    setTint(tint: Color): void;
    /**
     * Set the material for this sprite
     */
    setMaterial(material: Material): void;
    /**
     * Get the material for this sprite
     */
    getMaterial(): Material;
    /**
     * Add an effect to this sprite
     * Effects are automatically sorted by order
     */
    addEffect(effect: Effect): void;
    /**
     * Remove an effect from this sprite
     */
    removeEffect(effect: Effect): void;
    /**
     * Remove all effects from this sprite
     */
    clearEffects(): void;
    /**
     * Get all effects attached to this sprite
     */
    getEffects(): readonly Effect[];
    /**
     * Check if this sprite has any effects
     */
    hasEffects(): boolean;
    /**
     * Get enabled effects only
     */
    getEnabledEffects(): Effect[];
}
//# sourceMappingURL=Sprite.d.ts.map