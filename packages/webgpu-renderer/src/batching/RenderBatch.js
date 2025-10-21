/**
 * RenderBatch groups sprites by material + texture for efficient rendering
 * Supports both individual and instanced rendering based on batch size
 */
export class RenderBatch {
    texture;
    material;
    sprites = new Set();
    spriteArray = [];
    isDirty = true;
    // Instance rendering data
    instanceData;
    instanceBuffer;
    instanceBufferId = 0; // Increments when buffer is recreated (for cache invalidation)
    device;
    instanceCount = 0; // Track actual number of instances packed
    // Phase 4: Persistent buffer optimization
    persistentBufferCapacity = 0; // Current buffer capacity in sprites
    spriteToSlotMap = new Map(); // Maps sprite → buffer slot index
    freeSlots = []; // Available slots for new sprites
    dirtyRanges = []; // Dirty buffer ranges to upload
    // Threshold for when to use instancing vs individual draws
    static INSTANCING_THRESHOLD = 1;
    // Bytes per sprite instance: 2 floats (position) + 2 floats (size) + 4 floats (frame) + 4 floats (tint) = 12 floats = 48 bytes
    static BYTES_PER_INSTANCE = 48;
    static FLOATS_PER_INSTANCE = 12;
    // Persistent buffer settings
    static INITIAL_BUFFER_CAPACITY = 1000; // Start with 1000 sprites
    static BUFFER_GROWTH_FACTOR = 1.5; // Grow by 50% when full
    // Frustum culling can be expensive for many sprites - make it optional
    enableFrustumCulling = false;
    constructor(texture, material) {
        this.texture = texture;
        this.material = material;
        this.instanceData = new Float32Array(0);
    }
    /**
     * Initialize GPU resources
     */
    initialize(device) {
        this.device = device;
    }
    /**
     * Add a sprite to this batch
     * Phase 4: Allocates a persistent slot for the sprite
     */
    addSprite(sprite) {
        if (this.sprites.has(sprite))
            return;
        this.sprites.add(sprite);
        // Allocate a slot for this sprite
        let slot;
        if (this.freeSlots.length > 0) {
            // Reuse a free slot
            slot = this.freeSlots.pop();
        }
        else {
            // Allocate a new slot
            slot = this.spriteToSlotMap.size;
        }
        this.spriteToSlotMap.set(sprite, slot);
        this.markDirty();
    }
    /**
     * Remove a sprite from this batch
     * Phase 4: Frees the sprite's slot for reuse
     */
    removeSprite(sprite) {
        if (!this.sprites.has(sprite))
            return;
        this.sprites.delete(sprite);
        // Free the sprite's slot
        const slot = this.spriteToSlotMap.get(sprite);
        if (slot !== undefined) {
            this.spriteToSlotMap.delete(sprite);
            this.freeSlots.push(slot);
        }
        this.markDirty();
    }
    /**
     * Check if this batch contains a sprite
     */
    hasSprite(sprite) {
        return this.sprites.has(sprite);
    }
    /**
     * Get the number of sprites in this batch
     */
    getCount() {
        return this.sprites.size;
    }
    /**
     * Check if this batch is empty
     */
    isEmpty() {
        return this.sprites.size === 0;
    }
    /**
     * Mark this batch as needing an update
     */
    markDirty() {
        this.isDirty = true;
    }
    /**
     * Check if instancing should be used for this batch
     */
    shouldUseInstancing() {
        // return this.sprites.size >= RenderBatch.INSTANCING_THRESHOLD;
        return true;
    }
    /**
     * Get visible sprites from this batch
     */
    getVisibleSprites() {
        // Always rebuild to ensure visibility is checked
        const visibleSprites = Array.from(this.sprites).filter((sprite) => sprite.visible);
        // Update cached array for iteration (includes all sprites)
        if (this.isDirty) {
            this.spriteArray = Array.from(this.sprites);
            this.isDirty = false;
        }
        return visibleSprites;
    }
    /**
     * Get all sprites in this batch (for management)
     */
    getAllSprites() {
        return Array.from(this.sprites);
    }
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
    updateInstanceData(camera) {
        if (!this.shouldUseInstancing()) {
            return;
        }
        // Get visible sprites and optionally apply frustum culling
        let visibleSprites = this.getVisibleSprites();
        if (this.enableFrustumCulling) {
            visibleSprites = visibleSprites.filter((sprite) => camera.isInView(sprite));
        }
        this.instanceCount = visibleSprites.length;
        if (this.instanceCount === 0) {
            return;
        }
        // Ensure buffer is large enough for all sprites (using persistent allocation)
        this.ensureBufferCapacity();
        // Clear dirty ranges from previous frame
        this.dirtyRanges = [];
        if (this.isDirty) {
            // Full rebuild - batch structure changed (sprites added/removed)
            // Pack all visible sprites into their allocated slots
            for (const sprite of visibleSprites) {
                const slot = this.spriteToSlotMap.get(sprite);
                if (slot !== undefined) {
                    const offset = slot * RenderBatch.FLOATS_PER_INSTANCE;
                    this.packSpriteInstanceData(sprite, offset);
                    this.markRangeDirty(slot, slot + 1);
                }
            }
            this.isDirty = false;
        }
        else {
            // Partial update - only update dirty sprites
            // This is the common case: sprites move but batch structure is stable
            for (const sprite of visibleSprites) {
                // Check if this sprite's transform changed
                if (sprite._dirty || sprite._worldTransformDirty) {
                    const slot = this.spriteToSlotMap.get(sprite);
                    if (slot !== undefined) {
                        const offset = slot * RenderBatch.FLOATS_PER_INSTANCE;
                        this.packSpriteInstanceData(sprite, offset);
                        this.markRangeDirty(slot, slot + 1);
                    }
                }
            }
        }
        // Coalesce dirty ranges to minimize GPU uploads
        this.coalesceDirtyRanges();
    }
    /**
     * Ensure the persistent buffer has enough capacity for all sprites
     */
    ensureBufferCapacity() {
        const requiredCapacity = Math.max(this.spriteToSlotMap.size, RenderBatch.INITIAL_BUFFER_CAPACITY);
        if (this.persistentBufferCapacity < requiredCapacity) {
            // Grow buffer capacity
            const newCapacity = Math.ceil(requiredCapacity * RenderBatch.BUFFER_GROWTH_FACTOR);
            const newSize = newCapacity * RenderBatch.FLOATS_PER_INSTANCE;
            // Create new Float32Array with larger capacity
            const newInstanceData = new Float32Array(newSize);
            // Copy old data if it exists
            if (this.instanceData.length > 0) {
                newInstanceData.set(this.instanceData);
            }
            this.instanceData = newInstanceData;
            this.persistentBufferCapacity = newCapacity;
            // Force buffer recreation on GPU side
            if (this.instanceBuffer) {
                this.instanceBuffer.destroy();
                this.instanceBuffer = undefined;
            }
        }
    }
    /**
     * Mark a range of slots as dirty (needs GPU upload)
     */
    markRangeDirty(startSlot, endSlot) {
        this.dirtyRanges.push({ start: startSlot, end: endSlot });
    }
    /**
     * Coalesce overlapping/adjacent dirty ranges to minimize GPU uploads
     * Example: [0-5], [3-8], [10-12] → [0-8], [10-12]
     */
    coalesceDirtyRanges() {
        if (this.dirtyRanges.length <= 1)
            return;
        // Sort by start position
        this.dirtyRanges.sort((a, b) => a.start - b.start);
        // Merge overlapping/adjacent ranges
        const coalesced = [];
        let current = this.dirtyRanges[0];
        for (let i = 1; i < this.dirtyRanges.length; i++) {
            const next = this.dirtyRanges[i];
            // If ranges overlap or are adjacent, merge them
            if (next.start <= current.end) {
                current.end = Math.max(current.end, next.end);
            }
            else {
                // Gap found, save current and start new range
                coalesced.push(current);
                current = next;
            }
        }
        coalesced.push(current);
        this.dirtyRanges = coalesced;
    }
    /**
     * Pack a single sprite's data into instance buffer at given offset
     * Extracted to avoid code duplication
     */
    packSpriteInstanceData(sprite, offset) {
        // Get cached world position (no matrix extraction, just array access)
        const worldPos = sprite.getWorldPosition();
        const worldX = worldPos.x;
        const worldY = worldPos.y;
        // Get cached world scale (no sqrt operations!)
        const worldScale = sprite.getWorldScale();
        const worldSizeX = sprite.width * worldScale.x;
        const worldSizeY = sprite.height * worldScale.y;
        // Pack data: position (2) + size (2) + frame (4) + tint (4) = 12 floats
        this.instanceData[offset + 0] = worldX;
        this.instanceData[offset + 1] = worldY;
        this.instanceData[offset + 2] = worldSizeX;
        this.instanceData[offset + 3] = worldSizeY;
        this.instanceData.set(sprite.frame.data, offset + 4);
        this.instanceData.set(sprite.tint.data, offset + 8);
    }
    /**
     * Get the instance data for GPU upload
     * Returns the data and count from last updateInstanceData call
     */
    getInstanceData() {
        return {
            data: this.instanceData,
            count: this.instanceCount,
        };
    }
    /**
     * Get dirty ranges for partial GPU upload
     * Phase 4: Returns only the ranges that changed this frame
     * Returns null if full upload is needed
     */
    getDirtyRanges() {
        if (this.dirtyRanges.length === 0) {
            return null; // Nothing dirty
        }
        // If dirty ranges cover >80% of buffer, just upload everything
        // (avoids overhead of multiple small uploads)
        const totalDirtySlots = this.dirtyRanges.reduce((sum, range) => sum + (range.end - range.start), 0);
        const coverage = totalDirtySlots / Math.max(this.instanceCount, 1);
        if (coverage > 0.8) {
            return null; // Upload everything
        }
        return this.dirtyRanges;
    }
    /**
     * Get instance buffer, creating it if necessary
     * Phase 4: Uses persistent buffer capacity instead of instanceCount
     */
    getOrCreateInstanceBuffer() {
        if (!this.device) {
            throw new Error("RenderBatch not initialized with device");
        }
        // Use persistent buffer capacity (not instanceCount) to avoid recreations
        const requiredSize = this.persistentBufferCapacity * RenderBatch.BYTES_PER_INSTANCE;
        // Create buffer if it doesn't exist or is too small
        if (!this.instanceBuffer || this.instanceBuffer.size < requiredSize) {
            // Destroy old buffer
            if (this.instanceBuffer) {
                this.instanceBuffer.destroy();
            }
            // Create new buffer using persistent capacity
            this.instanceBuffer = this.device.createBuffer({
                size: requiredSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                label: `Instance Buffer (Texture ${this.texture.id}, Cap: ${this.persistentBufferCapacity})`,
            });
            // Increment buffer ID to invalidate cached bind groups
            this.instanceBufferId++;
        }
        return this.instanceBuffer;
    }
    /**
     * Get the buffer ID (increments when buffer is recreated)
     * Used for bind group cache invalidation
     */
    getBufferId() {
        return this.instanceBufferId;
    }
    /**
     * Get array of visible sprites for individual rendering
     * Optionally filter by camera frustum if enabled
     */
    getSpritesForIndividualRendering(camera) {
        const visible = this.getVisibleSprites();
        if (camera && this.enableFrustumCulling) {
            return visible.filter((sprite) => camera.isInView(sprite));
        }
        return visible;
    }
    /**
     * Clean up GPU resources
     */
    destroy() {
        if (this.instanceBuffer) {
            this.instanceBuffer.destroy();
            this.instanceBuffer = undefined;
        }
    }
}
