import { Mat4 } from "gl-matrix";
import { Sprite } from "../renderer/Sprite";
import { Texture } from "../renderer/Texture";
import { Camera } from "../renderer/Camera";

/**
 * RenderBatch groups sprites by texture for efficient rendering
 * Supports both individual and instanced rendering based on batch size
 */
export class RenderBatch {
  public readonly texture: Texture;
  private sprites: Set<Sprite> = new Set();
  private spriteArray: Sprite[] = [];
  private isDirty: boolean = true;

  // Instance rendering data
  private instanceData: Float32Array;
  private instanceBuffer?: GPUBuffer;
  private device?: GPUDevice;
  private instanceCount: number = 0; // Track actual number of instances packed

  // Threshold for when to use instancing vs individual draws
  private static readonly INSTANCING_THRESHOLD = 1;

  // Bytes per sprite instance: 2 floats (position) + 2 floats (size) + 4 floats (frame) + 4 floats (tint) = 12 floats = 48 bytes
  private static readonly BYTES_PER_INSTANCE = 48;
  private static readonly FLOATS_PER_INSTANCE = 12;

  // Frustum culling can be expensive for many sprites - make it optional
  public enableFrustumCulling: boolean = false;

  constructor(texture: Texture) {
    this.texture = texture;
    this.instanceData = new Float32Array(0);
  }

  /**
   * Initialize GPU resources
   */
  initialize(device: GPUDevice): void {
    this.device = device;
  }

  /**
   * Add a sprite to this batch
   */
  addSprite(sprite: Sprite): void {
    if (this.sprites.has(sprite)) return;

    this.sprites.add(sprite);
    this.markDirty();
  }

  /**
   * Remove a sprite from this batch
   */
  removeSprite(sprite: Sprite): void {
    if (!this.sprites.has(sprite)) return;

    this.sprites.delete(sprite);
    this.markDirty();
  }

  /**
   * Check if this batch contains a sprite
   */
  hasSprite(sprite: Sprite): boolean {
    return this.sprites.has(sprite);
  }

  /**
   * Get the number of sprites in this batch
   */
  getCount(): number {
    return this.sprites.size;
  }

  /**
   * Check if this batch is empty
   */
  isEmpty(): boolean {
    return this.sprites.size === 0;
  }

  /**
   * Mark this batch as needing an update
   */
  markDirty(): void {
    this.isDirty = true;
  }

  /**
   * Check if instancing should be used for this batch
   */
  shouldUseInstancing(): boolean {
    // return this.sprites.size >= RenderBatch.INSTANCING_THRESHOLD;
    return true;
  }

  /**
   * Get visible sprites from this batch
   */
  private getVisibleSprites(): Sprite[] {
    // Always rebuild to ensure visibility is checked
    const visibleSprites = Array.from(this.sprites).filter(
      (sprite) => sprite.visible
    );

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
  getAllSprites(): Sprite[] {
    return Array.from(this.sprites);
  }

  /**
   * Update instance data for all visible sprites
   * Should be called before rendering if isDirty
   * Includes frustum culling using camera
   */
  updateInstanceData(camera: Camera): void {
    if (!this.shouldUseInstancing()) {
      return; // Don't need instance data for individual rendering
    }

    // Get visible sprites and optionally apply frustum culling
    let visibleSprites = this.getVisibleSprites();

    if (this.enableFrustumCulling) {
      visibleSprites = visibleSprites.filter((sprite) =>
        camera.isInView(sprite)
      );
    }

    this.instanceCount = visibleSprites.length;

    if (this.instanceCount === 0) {
      return;
    }

    // Resize instance data buffer if needed
    const requiredSize = this.instanceCount * RenderBatch.FLOATS_PER_INSTANCE;
    if (this.instanceData.length < requiredSize) {
      this.instanceData = new Float32Array(requiredSize);
    }

    // Pack instance data for each visible sprite
    let offset = 0;

    for (const sprite of visibleSprites) {
      // Get world transform
      const modelMatrix = sprite.getWorldMatrix();

      // Extract world position (x, y) from model matrix
      const worldX = modelMatrix[12];
      const worldY = modelMatrix[13];

      // Extract scale from model matrix and apply sprite dimensions
      const scaleX = Math.sqrt(
        modelMatrix[0] * modelMatrix[0] + modelMatrix[1] * modelMatrix[1]
      );
      const scaleY = Math.sqrt(
        modelMatrix[4] * modelMatrix[4] + modelMatrix[5] * modelMatrix[5]
      );

      const worldSizeX = sprite.width * scaleX;
      const worldSizeY = sprite.height * scaleY;

      // Pack data: position (2) + size (2) + frame (4) + tint (4) = 12 floats
      this.instanceData[offset + 0] = worldX;
      this.instanceData[offset + 1] = worldY;
      this.instanceData[offset + 2] = worldSizeX;
      this.instanceData[offset + 3] = worldSizeY;
      this.instanceData.set(sprite.frame.data, offset + 4);
      this.instanceData.set(sprite.tint.data, offset + 8);

      offset += RenderBatch.FLOATS_PER_INSTANCE;
    }

    this.isDirty = false;
  }

  /**
   * Get the instance data for GPU upload
   * Returns the data and count from last updateInstanceData call
   */
  getInstanceData(): { data: Float32Array; count: number } {
    return {
      data: this.instanceData,
      count: this.instanceCount,
    };
  }

  /**
   * Get instance buffer, creating it if necessary
   */
  getOrCreateInstanceBuffer(): GPUBuffer {
    if (!this.device) {
      throw new Error("RenderBatch not initialized with device");
    }

    const requiredSize = this.instanceCount * RenderBatch.BYTES_PER_INSTANCE;

    // Create or resize buffer if needed
    if (!this.instanceBuffer || this.instanceBuffer.size < requiredSize) {
      // Destroy old buffer
      if (this.instanceBuffer) {
        this.instanceBuffer.destroy();
      }

      // Create new buffer with some extra space to avoid frequent recreations
      const bufferSize = Math.max(requiredSize, 1024) * 1.5; // 50% extra space
      this.instanceBuffer = this.device.createBuffer({
        size: Math.ceil(bufferSize),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        label: `Instance Buffer (Texture ${this.texture.id})`,
      });
    }

    return this.instanceBuffer;
  }

  /**
   * Get array of visible sprites for individual rendering
   * Optionally filter by camera frustum if enabled
   */
  getSpritesForIndividualRendering(camera?: Camera): Sprite[] {
    const visible = this.getVisibleSprites();
    if (camera && this.enableFrustumCulling) {
      return visible.filter((sprite) => camera.isInView(sprite));
    }
    return visible;
  }

  /**
   * Clean up GPU resources
   */
  destroy(): void {
    if (this.instanceBuffer) {
      this.instanceBuffer.destroy();
      this.instanceBuffer = undefined;
    }
  }
}
