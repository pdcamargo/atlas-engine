import { Sprite } from "../renderer/Sprite";
import { Texture } from "../renderer/Texture";
import { Camera } from "../renderer/Camera";
import { Material } from "../materials/Material";
/**
 * RenderBatch groups sprites by material + texture for efficient rendering
 * Supports both individual and instanced rendering based on batch size
 */
export declare class RenderBatch {
    readonly texture: Texture;
    readonly material: Material;
    private sprites;
    private spriteArray;
    private isDirty;
    private instanceData;
    private instanceBuffer?;
    private instanceBufferId;
    private device?;
    private instanceCount;
    private persistentBufferCapacity;
    private spriteToSlotMap;
    private freeSlots;
    private dirtyRanges;
    private static readonly INSTANCING_THRESHOLD;
    private static readonly BYTES_PER_INSTANCE;
    private static readonly FLOATS_PER_INSTANCE;
    private static readonly INITIAL_BUFFER_CAPACITY;
    private static readonly BUFFER_GROWTH_FACTOR;
    enableFrustumCulling: boolean;
    constructor(texture: Texture, material: Material);
    /**
     * Initialize GPU resources
     */
    initialize(device: GPUDevice): void;
    /**
     * Add a sprite to this batch
     * Phase 4: Allocates a persistent slot for the sprite
     */
    addSprite(sprite: Sprite): void;
    /**
     * Remove a sprite from this batch
     * Phase 4: Frees the sprite's slot for reuse
     */
    removeSprite(sprite: Sprite): void;
    /**
     * Check if this batch contains a sprite
     */
    hasSprite(sprite: Sprite): boolean;
    /**
     * Get the number of sprites in this batch
     */
    getCount(): number;
    /**
     * Check if this batch is empty
     */
    isEmpty(): boolean;
    /**
     * Mark this batch as needing an update
     */
    markDirty(): void;
    /**
     * Check if instancing should be used for this batch
     */
    shouldUseInstancing(): boolean;
    /**
     * Get visible sprites from this batch
     */
    private getVisibleSprites;
    /**
     * Get all sprites in this batch (for management)
     */
    getAllSprites(): Sprite[];
    /**
     * Update instance data for all visible sprites
     * Phase 4: Uses persistent buffers with slot allocation and partial updates
     *
     * Key optimizations:
     * - Persistent buffer (no reallocation)
     * - Slot-based addressing (sprites keep same position in buffer)
     * - Only updates dirty sprites (tracks dirty ranges)
     * - Partial GPU uploads (only dirty ranges)
     */
    updateInstanceData(camera: Camera): void;
    /**
     * Ensure the persistent buffer has enough capacity for all sprites
     */
    private ensureBufferCapacity;
    /**
     * Mark a range of slots as dirty (needs GPU upload)
     */
    private markRangeDirty;
    /**
     * Coalesce overlapping/adjacent dirty ranges to minimize GPU uploads
     * Example: [0-5], [3-8], [10-12] → [0-8], [10-12]
     */
    private coalesceDirtyRanges;
    /**
     * Pack a single sprite's data into instance buffer at given offset
     * Extracted to avoid code duplication
     */
    private packSpriteInstanceData;
    /**
     * Get the instance data for GPU upload
     * Returns the data and count from last updateInstanceData call
     */
    getInstanceData(): {
        data: Float32Array;
        count: number;
    };
    /**
     * Get dirty ranges for partial GPU upload
     * Phase 4: Returns only the ranges that changed this frame
     * Returns null if full upload is needed
     */
    getDirtyRanges(): Array<{
        start: number;
        end: number;
    }> | null;
    /**
     * Get instance buffer, creating it if necessary
     * Phase 4: Uses persistent buffer capacity instead of instanceCount
     */
    getOrCreateInstanceBuffer(): GPUBuffer;
    /**
     * Get the buffer ID (increments when buffer is recreated)
     * Used for bind group cache invalidation
     */
    getBufferId(): number;
    /**
     * Get array of visible sprites for individual rendering
     * Optionally filter by camera frustum if enabled
     */
    getSpritesForIndividualRendering(camera?: Camera): Sprite[];
    /**
     * Clean up GPU resources
     */
    destroy(): void;
}
//# sourceMappingURL=RenderBatch.d.ts.map