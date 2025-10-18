import { TileMapObject, TileMapObjectOptions } from "./TileMapObject";
import { Color } from "@atlas/core";
import { TileSet } from "./TileSet";

export interface ObjectLayerBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * TileMapObjectLayer manages a collection of objects at arbitrary positions
 * Unlike tile layers, object layers store objects with floating-point coordinates
 * and custom dimensions
 */
export class TileMapObjectLayer {
  public readonly name: string;
  public visible: boolean = true;
  public tint: Color = Color.white();
  public zIndex: number = 0;

  private objects: Map<string, TileMapObject> = new Map();
  private onDirtyCallback?: () => void;

  constructor(name: string, onDirtyCallback?: () => void) {
    this.name = name;
    this.onDirtyCallback = onDirtyCallback;
  }

  /**
   * Add an object to this layer
   */
  addObject(options: TileMapObjectOptions): TileMapObject {
    const object = new TileMapObject(options);
    this.objects.set(object.id, object);
    this.markDirty();
    return object;
  }

  /**
   * Add an existing object instance to this layer
   */
  addObjectInstance(object: TileMapObject): void {
    if (this.objects.has(object.id)) {
      throw new Error(`Object with id "${object.id}" already exists in layer "${this.name}"`);
    }
    this.objects.set(object.id, object);
    this.markDirty();
  }

  /**
   * Remove an object by ID
   */
  removeObject(id: string): boolean {
    const removed = this.objects.delete(id);
    if (removed) {
      this.markDirty();
    }
    return removed;
  }

  /**
   * Get an object by ID
   */
  getObject(id: string): TileMapObject | undefined {
    return this.objects.get(id);
  }

  /**
   * Check if an object exists
   */
  hasObject(id: string): boolean {
    return this.objects.has(id);
  }

  /**
   * Get all objects
   */
  getAllObjects(): TileMapObject[] {
    return Array.from(this.objects.values());
  }

  /**
   * Get objects within a bounding box
   */
  getObjectsInBounds(
    left: number,
    right: number,
    top: number,
    bottom: number
  ): TileMapObject[] {
    const result: TileMapObject[] = [];

    for (const object of this.objects.values()) {
      const bounds = object.getBounds();
      // Check for overlap
      if (
        bounds.right >= left &&
        bounds.left <= right &&
        bounds.top >= bottom &&
        bounds.bottom <= top
      ) {
        result.push(object);
      }
    }

    return result;
  }

  /**
   * Get objects at a specific point
   */
  getObjectsAtPoint(x: number, y: number): TileMapObject[] {
    const result: TileMapObject[] = [];

    for (const object of this.objects.values()) {
      const bounds = object.getBounds();
      if (
        x >= bounds.left &&
        x <= bounds.right &&
        y >= bounds.bottom &&
        y <= bounds.top
      ) {
        result.push(object);
      }
    }

    return result;
  }

  /**
   * Get objects by type
   */
  getObjectsByType(type: string): TileMapObject[] {
    return Array.from(this.objects.values()).filter((obj) => obj.type === type);
  }

  /**
   * Get objects by name
   */
  getObjectsByName(name: string): TileMapObject[] {
    return Array.from(this.objects.values()).filter((obj) => obj.name === name);
  }

  /**
   * Clear all objects from this layer
   */
  clear(): void {
    if (this.objects.size > 0) {
      this.objects.clear();
      this.markDirty();
    }
  }

  /**
   * Get the number of objects in this layer
   */
  getObjectCount(): number {
    return this.objects.size;
  }

  /**
   * Get the bounds of all objects in this layer
   */
  getBounds(): ObjectLayerBounds | null {
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
  setTint(color: Color): void {
    this.tint.copyFrom(color);
    this.markDirty();
  }

  /**
   * Set layer visibility
   */
  setVisible(visible: boolean): void {
    if (this.visible !== visible) {
      this.visible = visible;
      this.markDirty();
    }
  }

  /**
   * Mark the parent tilemap as dirty
   */
  private markDirty(): void {
    if (this.onDirtyCallback) {
      this.onDirtyCallback();
    }
  }

  /**
   * Get all unique tilesets used in this layer
   */
  getAllTileSets(): Set<TileSet> {
    const tileSets = new Set<TileSet>();

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
  findObjectsByProperty(
    key: string,
    value?: any
  ): TileMapObject[] {
    return Array.from(this.objects.values()).filter((obj) => {
      if (value === undefined) {
        return key in obj.metadata;
      }
      return obj.metadata[key] === value;
    });
  }
}
