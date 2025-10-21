import { Mat4 } from "gl-matrix";
import { TileSet } from "./TileSet";
import { Tile } from "./Tile";
import { Color } from "@atlas/core";
import { LRUCache } from "../../utils/LRUCache";
export interface ChunkBounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
}
/**
 * TileMapChunk represents a spatial subdivision of a tilemap
 * Each chunk contains a subset of tiles and manages its own batches
 */
export declare class TileMapChunk {
    readonly chunkX: number;
    readonly chunkY: number;
    worldBounds: ChunkBounds;
    private batches;
    private device?;
    private cachedWorldMatrixHash;
    private cachedChunkSize;
    private cachedTileWidth;
    private cachedTileHeight;
    constructor(chunkX: number, chunkY: number);
    /**
     * Initialize GPU resources for this chunk
     */
    initialize(device: GPUDevice): void;
    /**
     * Add a tile to this chunk
     */
    addTile(x: number, y: number, tile: Tile, tileSet: TileSet, layerIndex: number, tint: Color): void;
    /**
     * Calculate world bounds for this chunk (with caching)
     */
    calculateWorldBounds(chunkSize: number, tileWidth: number, tileHeight: number, worldMatrix: Float32Array): void;
    /**
     * Check if this chunk is within the view bounds
     */
    isInView(viewBounds: ChunkBounds): boolean;
    /**
     * Check if this chunk is empty
     */
    isEmpty(): boolean;
    /**
     * Get the number of tiles in this chunk
     */
    getTileCount(): number;
    /**
     * Render all batches in this chunk
     */
    render(renderPass: GPURenderPassEncoder, device: GPUDevice, vpMatrix: Mat4, worldMatrix: Mat4, tileWidth: number, tileHeight: number, spriteInstancedPipeline: GPURenderPipeline, spriteInstancedBindGroupLayout: GPUBindGroupLayout, quadBuffers: {
        buffers: GPUBuffer[];
        bufferLayouts: GPUVertexBufferLayout[];
        numElements: number;
        indexBuffer?: GPUBuffer;
        indexFormat?: GPUIndexFormat;
    }, textureViewCache: Map<string, GPUTextureView>, bindGroupCache: LRUCache<string, GPUBindGroup>, vpMatrixBuffer: GPUBuffer): void;
    /**
     * Clean up GPU resources
     */
    destroy(): void;
}
//# sourceMappingURL=TileMapChunk.d.ts.map