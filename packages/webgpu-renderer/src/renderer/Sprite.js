import { SceneNode } from "./SceneNode";
import { Texture } from "./Texture";
import { Rect, Color } from "@atlas/core";
import { DEFAULT_SPRITE_MATERIAL } from "../materials/SpriteMaterial";
/**
 * Sprite class for rendering textured quads
 * Supports both pre-loaded Textures and lazy-loaded Handles
 * Now supports custom materials and visual effects
 */
export class Sprite extends SceneNode {
    texture = null;
    width;
    height;
    frame;
    tint;
    // Material system
    material = DEFAULT_SPRITE_MATERIAL;
    // Effects system
    _effects = [];
    constructor(texture = null, width = 1, height = 1, id) {
        super(id);
        this.texture = texture;
        this.width = width;
        this.height = height;
        this.frame = new Rect(0, 0, 1, 1); // Default to full texture
        this.tint = Color.white(); // Default to white tint
    }
    /**
     * Set the texture for this sprite
     */
    setTexture(texture) {
        this.texture = texture;
    }
    /**
     * Get the loaded Texture (returns null if texture is a Handle or not loaded)
     */
    getTexture() {
        return this.texture instanceof Texture ? this.texture : null;
    }
    /**
     * Get the Handle if texture is still loading (returns null if already a Texture)
     */
    getHandle() {
        return this.texture && !(this.texture instanceof Texture)
            ? this.texture
            : null;
    }
    /**
     * Set the size of the sprite
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
    }
    /**
     * Set the frame (texture region) for this sprite
     */
    setFrame(frame) {
        this.frame = frame;
    }
    getTint() {
        return this.tint;
    }
    /**
     * Set the tint color for this sprite
     */
    setTint(tint) {
        this.tint = tint;
        this.markDirty(); // Mark sprite as dirty to trigger re-render
    }
    /**
     * Set the material for this sprite
     */
    setMaterial(material) {
        this.material = material;
    }
    /**
     * Get the material for this sprite
     */
    getMaterial() {
        return this.material;
    }
    /**
     * Add an effect to this sprite
     * Effects are automatically sorted by order
     */
    addEffect(effect) {
        this._effects.push(effect);
        this._effects.sort((a, b) => a.order - b.order);
    }
    /**
     * Remove an effect from this sprite
     */
    removeEffect(effect) {
        const index = this._effects.indexOf(effect);
        if (index !== -1) {
            this._effects.splice(index, 1);
        }
    }
    /**
     * Remove all effects from this sprite
     */
    clearEffects() {
        this._effects = [];
    }
    /**
     * Get all effects attached to this sprite
     */
    getEffects() {
        return this._effects;
    }
    /**
     * Check if this sprite has any effects
     */
    hasEffects() {
        return this._effects.length > 0;
    }
    /**
     * Get enabled effects only
     */
    getEnabledEffects() {
        return this._effects.filter((effect) => effect.enabled);
    }
}
