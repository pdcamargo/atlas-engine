import { createTextureFromImage, createTextureFromSource } from "webgpu-utils";
import type { Handle, ImageAsset } from "@atlas/core";

const uuidv4 = () => {
  return crypto.randomUUID();
};

/**
 * Texture wrapper for WebGPU textures
 */
export class Texture {
  public id: string;
  public gpuTexture: GPUTexture;
  public sampler: GPUSampler;
  public width: number;
  public height: number;

  /** Optional handle to source asset for hot-reload support */
  public sourceHandle?: Handle<ImageAsset>;

  private constructor(
    texture: GPUTexture,
    sampler: GPUSampler,
    id?: string,
    sourceHandle?: Handle<ImageAsset>
  ) {
    this.id = id ?? uuidv4();

    this.gpuTexture = texture;
    this.sampler = sampler;
    this.width = texture.width;
    this.height = texture.height;
    this.sourceHandle = sourceHandle;
  }

  /**
   * Create a texture from a URL
   */
  static async fromURL(
    device: GPUDevice,
    url: string,
    options?: {
      mips?: boolean;
      flipY?: boolean;
      addressModeU?: GPUAddressMode;
      addressModeV?: GPUAddressMode;
      magFilter?: GPUFilterMode;
      minFilter?: GPUFilterMode;
    }
  ): Promise<Texture> {
    const {
      mips = true,
      flipY = true,
      addressModeU = "repeat",
      addressModeV = "repeat",
      magFilter = "linear",
      minFilter = "linear",
    } = options || {};

    const texture = await createTextureFromImage(device, url, {
      mips,
      flipY,
    });

    const sampler = device.createSampler({
      addressModeU,
      addressModeV,
      magFilter,
      minFilter,
      mipmapFilter: mips ? "linear" : "nearest",
    });

    return new Texture(texture, sampler);
  }

  /**
   * Create a texture from an ImageBitmap, HTMLImageElement, HTMLCanvasElement, or HTMLVideoElement
   */
  static fromSource(
    device: GPUDevice,
    source:
      | ImageBitmap
      | HTMLImageElement
      | HTMLCanvasElement
      | HTMLVideoElement,
    options?: {
      mips?: boolean;
      flipY?: boolean;
      addressModeU?: GPUAddressMode;
      addressModeV?: GPUAddressMode;
      magFilter?: GPUFilterMode;
      minFilter?: GPUFilterMode;
      sourceHandle?: Handle<ImageAsset>;
    }
  ): Texture {
    const {
      mips = true,
      flipY = true,
      addressModeU = "repeat",
      addressModeV = "repeat",
      magFilter = "linear",
      minFilter = "linear",
      sourceHandle,
    } = options || {};

    const texture = createTextureFromSource(device, source, {
      mips,
      flipY,
    });

    const sampler = device.createSampler({
      addressModeU,
      addressModeV,
      magFilter,
      minFilter,
      mipmapFilter: mips ? "linear" : "nearest",
    });

    return new Texture(texture, sampler, undefined, sourceHandle);
  }

  /**
   * Destroy the texture
   */
  destroy(): void {
    this.gpuTexture.destroy();
  }
}
