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
  private static readonly INSTANCING_THRESHOLD = 10;

  // Bytes per sprite instance: 16 floats (matrix) + 4 floats (frame) + 4 floats (tint) = 24 floats = 96 bytes
  private static readonly BYTES_PER_INSTANCE = 96;
  private static readonly FLOATS_PER_INSTANCE = 24;

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
    return this.sprites.size >= RenderBatch.INSTANCING_THRESHOLD;
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
    const vpMatrix = camera.getViewProjectionMatrix();
    let offset = 0;

    for (const sprite of visibleSprites) {
      // Calculate MVP matrix
      const modelMatrix = sprite.getWorldMatrix();

      // Create scaled model matrix (we'll use a temporary matrix)
      const scaledModel = new Float32Array(16);
      for (let i = 0; i < 16; i++) {
        scaledModel[i] = modelMatrix[i];
      }
      scaledModel[0] *= sprite.width;
      scaledModel[5] *= sprite.height;

      // Calculate MVP
      const mvp = new Float32Array(16);
      this.multiplyMatrices(mvp, vpMatrix.data, scaledModel);

      // Pack data: MVP (16) + frame (4) + tint (4)
      this.instanceData.set(mvp, offset);
      this.instanceData.set(sprite.frame.data, offset + 16);
      this.instanceData.set(sprite.tint.data, offset + 20);

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

  /**
   * Helper: Multiply two 4x4 matrices
   */
  private multiplyMatrices(
    out: Float32Array,
    a: Float32Array | Mat4,
    b: Float32Array
  ): void {
    const a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
    const a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
    const a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
    const a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];

    const b00 = b[0],
      b01 = b[1],
      b02 = b[2],
      b03 = b[3];
    const b10 = b[4],
      b11 = b[5],
      b12 = b[6],
      b13 = b[7];
    const b20 = b[8],
      b21 = b[9],
      b22 = b[10],
      b23 = b[11];
    const b30 = b[12],
      b31 = b[13],
      b32 = b[14],
      b33 = b[15];

    out[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
    out[1] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
    out[2] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
    out[3] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;

    out[4] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
    out[5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
    out[6] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
    out[7] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;

    out[8] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
    out[9] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
    out[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
    out[11] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;

    out[12] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
    out[13] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
    out[14] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
    out[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
  }
}
