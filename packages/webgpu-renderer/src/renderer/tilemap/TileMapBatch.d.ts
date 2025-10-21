import { Mat4 } from "gl-matrix";
import { TileSet } from "./TileSet";
import { Tile } from "./Tile";
import { Color } from "@atlas/core";
/**
 * TileMapBatch batches tiles by tileset for instanced rendering
 * Similar to RenderBatch but optimized for static tilemap data
 */
export declare class TileMapBatch {
    readonly tileSet: TileSet;
    private tiles;
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
     * Add a tile to this batch
     */
    addTile(x: number, y: number, tile: Tile, layerIndex: number, tint?: Color): void;
    /**
     * Clear all tiles from this batch
     */
    clear(): void;
    /**
     * Get the number of tiles in this batch
     */
    getCount(): number;
    /**
     * Check if this batch is empty
     */
    isEmpty(): boolean;
    /**
     * Rebuild instance data for all tiles
     * GPU-optimized: stores position+size, MVP computed in vertex shader
     */
    rebuild(vpMatrix: Mat4, worldMatrix: Mat4, tileWidth: number, tileHeight: number): void;
    /**
     * Get the instance data for GPU upload
     */
    getInstanceData(): {
        data: Float32Array;
        count: number;
    };
    /**
     * Get or create instance buffer (capped at safe size for WebGPU limits)
     */
    getOrCreateInstanceBuffer(): GPUBuffer;
    /**
     * Get unique buffer ID for bind group caching
     */
    getBufferId(): number;
    /**
     * Clean up GPU resources
     */
    destroy(): void;
}
//# sourceMappingURL=TileMapBatch.d.ts.map