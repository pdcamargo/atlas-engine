import { Mat4 } from "gl-matrix";
import { TileSet } from "./TileSet";
import { Tile } from "./Tile";
import { TileMapObject } from "./TileMapObject";
import { Color } from "@atlas/core";
/**
 * TileMapObjectBatch batches objects by tileset for instanced rendering
 * Similar to TileMapBatch but handles objects with arbitrary positions and sizes
 */
export declare class TileMapObjectBatch {
    readonly tileSet: TileSet;
    private objects;
    private instanceData;
    private instanceBuffer?;
    private device?;
    private instanceCount;
    private bufferId;
    private static readonly BYTES_PER_INSTANCE;
    private static readonly FLOATS_PER_INSTANCE;
    constructor(tileSet: TileSet);
    /**
     * Initialize GPU resources
     */
    initialize(device: GPUDevice): void;
    /**
     * Add an object to this batch
     */
    addObject(object: TileMapObject, tile: Tile, layerTint: Color): void;
    /**
     * Clear all objects from this batch
     */
    clear(): void;
    /**
     * Check if batch is empty
     */
    isEmpty(): boolean;
    /**
     * Get the number of objects in this batch
     */
    getCount(): number;
    /**
     * Get unique buffer ID for bind group caching
     */
    getBufferId(): number;
    /**
     * Rebuild instance data from current objects
     * Objects use world coordinates directly (not tile grid coordinates)
     */
    rebuild(vpMatrix: Mat4, worldMatrix: Mat4): void;
    /**
     * Get instance data for GPU upload
     */
    getInstanceData(): {
        data: Float32Array;
        count: number;
    };
    /**
     * Get or create the instance buffer
     */
    getOrCreateInstanceBuffer(): GPUBuffer;
    /**
     * Destroy GPU resources
     */
    destroy(): void;
}
//# sourceMappingURL=TileMapObjectBatch.d.ts.map