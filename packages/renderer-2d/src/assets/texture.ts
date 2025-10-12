import { RenderDevice } from "../render_device";

/**
 * GPU texture representation
 */
export class GpuTexture {
  public texture: GPUTexture;
  public view: GPUTextureView;
  public sampler: GPUSampler;
  public size: GPUExtent3D;

  constructor(
    texture: GPUTexture,
    view: GPUTextureView,
    sampler: GPUSampler,
    size: GPUExtent3D
  ) {
    this.texture = texture;
    this.view = view;
    this.sampler = sampler;
    this.size = size;
  }

  /**
   * Create a GPU texture from image data
   */
  public static fromImageData(
    device: RenderDevice,
    imageData: ImageData,
    label?: string
  ): GpuTexture {
    const size: GPUExtent3D = {
      width: imageData.width,
      height: imageData.height,
      depthOrArrayLayers: 1,
    };

    const texture = device.createTexture({
      label,
      size,
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    device.writeTexture(
      { texture },
      imageData.data,
      {
        offset: 0,
        bytesPerRow: imageData.width * 4,
        rowsPerImage: imageData.height,
      },
      size
    );

    const view = texture.createView();

    const sampler = device.createSampler({
      label: label ? `${label}_sampler` : undefined,
      magFilter: "nearest",
      minFilter: "nearest",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });

    return new GpuTexture(texture, view, sampler, size);
  }

  /**
   * Create a GPU texture from an HTMLImageElement
   */
  public static async fromImage(
    device: RenderDevice,
    image: HTMLImageElement,
    label?: string
  ): Promise<GpuTexture> {
    // Draw image to canvas to get ImageData
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }

    // Disable image smoothing for pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);

    return GpuTexture.fromImageData(device, imageData, label);
  }

  /**
   * Create a 1x1 white texture (default texture)
   */
  public static createWhiteTexture(device: RenderDevice): GpuTexture {
    const imageData = new ImageData(
      new Uint8ClampedArray([255, 255, 255, 255]),
      1,
      1
    );
    return GpuTexture.fromImageData(device, imageData, "white_texture");
  }

  /**
   * Destroy the texture
   */
  public destroy(): void {
    this.texture.destroy();
  }
}

/**
 * Texture cache for managing GPU textures
 */
export class TextureCache {
  #textures: Map<string, GpuTexture> = new Map();
  #defaultWhiteTexture?: GpuTexture;

  /**
   * Get or create the default white texture
   */
  public getDefaultWhiteTexture(device: RenderDevice): GpuTexture {
    if (!this.#defaultWhiteTexture) {
      this.#defaultWhiteTexture = GpuTexture.createWhiteTexture(device);
    }
    return this.#defaultWhiteTexture;
  }

  /**
   * Add a texture to the cache
   */
  public add(key: string, texture: GpuTexture): void {
    this.#textures.set(key, texture);
  }

  /**
   * Get a texture from the cache
   */
  public get(key: string): GpuTexture | undefined {
    return this.#textures.get(key);
  }

  /**
   * Check if a texture exists in the cache
   */
  public has(key: string): boolean {
    return this.#textures.has(key);
  }

  /**
   * Remove a texture from the cache
   */
  public remove(key: string): void {
    const texture = this.#textures.get(key);
    if (texture) {
      texture.destroy();
      this.#textures.delete(key);
    }
  }

  /**
   * Clear all textures
   */
  public clear(): void {
    for (const texture of this.#textures.values()) {
      texture.destroy();
    }
    this.#textures.clear();
    if (this.#defaultWhiteTexture) {
      this.#defaultWhiteTexture.destroy();
      this.#defaultWhiteTexture = undefined;
    }
  }
}
