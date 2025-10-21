import { TileMapObject } from "./TileMapObject";
import { Color } from "@atlas/core";
/**
 * TileMapObjectLayer manages a collection of objects at arbitrary positions
 * Unlike tile layers, object layers store objects with floating-point coordinates
 * and custom dimensions
 */
export class TileMapObjectLayer {
    name;
    visible = true;
    tint = Color.white();
    zIndex = 0;
    objects = new Map();
    onDirtyCallback;
    constructor(name, onDirtyCallback) {
        this.name = name;
        this.onDirtyCallback = onDirtyCallback;
    }
    /**
     * Add an object to this layer
     */
    addObject(options) {
        const object = new TileMapObject(options);
        this.objects.set(object.id, object);
        this.markDirty();
        return object;
    }
    /**
     * Add an existing object instance to this layer
     */
    addObjectInstance(object) {
        if (this.objects.has(object.id)) {
            throw new Error(`Object with id "${object.id}" already exists in layer "${this.name}"`);
        }
        this.objects.set(object.id, object);
        this.markDirty();
    }
    /**
     * Remove an object by ID
     */
    removeObject(id) {
        const removed = this.objects.delete(id);
        if (removed) {
            this.markDirty();
        }
        return removed;
    }
    /**
     * Get an object by ID
     */
    getObject(id) {
        return this.objects.get(id);
    }
    /**
     * Check if an object exists
     */
    hasObject(id) {
        return this.objects.has(id);
    }
    /**
     * Get all objects
     */
    getAllObjects() {
        return Array.from(this.objects.values());
    }
    /**
     * Get objects within a bounding box
     */
    getObjectsInBounds(left, right, top, bottom) {
        const result = [];
        for (const object of this.objects.values()) {
            const bounds = object.getBounds();
            // Check for overlap
            if (bounds.right >= left &&
                bounds.left <= right &&
                bounds.top >= bottom &&
                bounds.bottom <= top) {
                result.push(object);
            }
        }
        return result;
    }
    /**
     * Get objects at a specific point
     */
    getObjectsAtPoint(x, y) {
        const result = [];
        for (const object of this.objects.values()) {
            const bounds = object.getBounds();
            if (x >= bounds.left &&
                x <= bounds.right &&
                y >= bounds.bottom &&
                y <= bounds.top) {
                result.push(object);
            }
        }
        return result;
    }
    /**
     * Get objects by type
     */
    getObjectsByType(type) {
        return Array.from(this.objects.values()).filter((obj) => obj.type === type);
    }
    /**
     * Get objects by name
     */
    getObjectsByName(name) {
        return Array.from(this.objects.values()).filter((obj) => obj.name === name);
    }
    /**
     * Clear all objects from this layer
     */
    clear() {
        if (this.objects.size > 0) {
            this.objects.clear();
            this.markDirty();
        }
    }
    /**
     * Get the number of objects in this layer
     */
    getObjectCount() {
        return this.objects.size;
    }
    /**
     * Get the bounds of all objects in this layer
     */
    getBounds() {
        if (this.objects.size === 0) {
            return null;
        }
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const object of this.objects.values()) {
            const bounds = object.getBounds();
            minX = Math.min(minX, bounds.left);
            minY = Math.min(minY, bounds.bottom);
            maxX = Math.max(maxX, bounds.right);
            maxY = Math.max(maxY, bounds.top);
        }
        return { minX, minY, maxX, maxY };
    }
    /**
     * Set layer tint color
     */
    setTint(color) {
        this.tint.copyFrom(color);
        this.markDirty();
    }
    /**
     * Set layer visibility
     */
    setVisible(visible) {
        if (this.visible !== visible) {
            this.visible = visible;
            this.markDirty();
        }
    }
    /**
     * Mark the parent tilemap as dirty
     */
    markDirty() {
        if (this.onDirtyCallback) {
            this.onDirtyCallback();
        }
    }
    /**
     * Get all unique tilesets used in this layer
     */
    getAllTileSets() {
        const tileSets = new Set();
        for (const object of this.objects.values()) {
            if (object.tileSet) {
                tileSets.add(object.tileSet);
            }
        }
        return tileSets;
    }
    /**
     * Find objects by custom metadata property
     */
    findObjectsByProperty(key, value) {
        return Array.from(this.objects.values()).filter((obj) => {
            if (value === undefined) {
                return key in obj.metadata;
            }
            return obj.metadata[key] === value;
        });
    }
}
