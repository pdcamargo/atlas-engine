import type { RenderDevice } from "../render_device";

/**
 * Cache for GPU bind groups to avoid recreating them every frame
 */
export class BindGroupCache {
  #cache: Map<string, GPUBindGroup> = new Map();

  /**
   * Get or create a bind group for a camera uniform
   */
  public getCameraBindGroup(
    device: RenderDevice,
    layout: GPUBindGroupLayout,
    uniformBuffer: GPUBuffer
  ): GPUBindGroup {
    const key = `camera_${uniformBuffer.label || "default"}`;

    let bindGroup = this.#cache.get(key);
    if (!bindGroup) {
      bindGroup = device.createBindGroup({
        label: "camera_bind_group",
        layout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: uniformBuffer,
            },
          },
        ],
      });
      this.#cache.set(key, bindGroup);
    }

    return bindGroup;
  }

  /**
   * Get or create a bind group for a texture
   */
  public getTextureBindGroup(
    device: RenderDevice,
    layout: GPUBindGroupLayout,
    textureView: GPUTextureView,
    sampler: GPUSampler,
    textureKey: string
  ): GPUBindGroup {
    const key = `texture_${textureKey}`;

    let bindGroup = this.#cache.get(key);
    if (!bindGroup) {
      bindGroup = device.createBindGroup({
        label: `texture_bind_group_${textureKey}`,
        layout,
        entries: [
          {
            binding: 0,
            resource: textureView,
          },
          {
            binding: 1,
            resource: sampler,
          },
        ],
      });
      this.#cache.set(key, bindGroup);
    }

    return bindGroup;
  }

  /**
   * Clear the entire cache (useful when resources are destroyed)
   */
  public clear(): void {
    this.#cache.clear();
  }

  /**
   * Remove a specific bind group from cache
   */
  public remove(key: string): void {
    this.#cache.delete(key);
  }

  /**
   * Check if a bind group exists in cache
   */
  public has(key: string): boolean {
    return this.#cache.has(key);
  }
}
