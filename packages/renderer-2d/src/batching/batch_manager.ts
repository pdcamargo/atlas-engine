import type { Handle } from "@atlas/core";
import type { InstanceData } from "./instance_buffer";

/**
 * A batch of sprites that can be rendered together
 */
export class SpriteBatch {
  constructor(
    public material: Handle<any>,
    public texture: Handle<any> | null,
    public instances: InstanceData[],
    public indexStart: number,
    public indexCount: number
  ) {}
}

/**
 * Renderable entity for batching
 */
export interface RenderEntity {
  material: Handle<any>;
  texture: Handle<any> | null;
  instanceData: InstanceData;
  zIndex: number;
}

/**
 * Batch manager for automatic sprite batching
 */
export class BatchManager {
  /**
   * Batch entities by material and texture
   */
  public batch(entities: RenderEntity[]): SpriteBatch[] {
    // Sort entities by material, texture, and z-index
    const sorted = entities.slice().sort((a, b) => {
      // First by z-index
      if (a.zIndex !== b.zIndex) {
        return a.zIndex - b.zIndex;
      }

      // Then by material handle
      const materialCompare = this.#compareHandles(a.material, b.material);
      if (materialCompare !== 0) return materialCompare;

      // Then by texture handle
      return this.#compareHandles(a.texture, b.texture);
    });

    const batches: SpriteBatch[] = [];
    let currentBatch: RenderEntity[] = [];
    let currentMaterial: Handle<any> | null = null;
    let currentTexture: Handle<any> | null = null;

    for (const entity of sorted) {
      // Start new batch if material or texture changes
      if (
        currentMaterial !== null &&
        (!this.#sameHandle(entity.material, currentMaterial) ||
          !this.#sameHandle(entity.texture, currentTexture))
      ) {
        batches.push(
          this.#createBatch(currentMaterial, currentTexture, currentBatch)
        );
        currentBatch = [];
      }

      currentMaterial = entity.material;
      currentTexture = entity.texture;
      currentBatch.push(entity);
    }

    // Add final batch
    if (currentBatch.length > 0 && currentMaterial !== null) {
      batches.push(
        this.#createBatch(currentMaterial, currentTexture, currentBatch)
      );
    }

    return batches;
  }

  #createBatch(
    material: Handle<any>,
    texture: Handle<any> | null,
    entities: RenderEntity[]
  ): SpriteBatch {
    const instances = entities.map((e) => e.instanceData);
    // For instanced rendering: indexCount is for a SINGLE quad (6 indices for 2 triangles)
    // The GPU will draw this quad once per instance
    const indexCount = 6;

    return new SpriteBatch(material, texture, instances, 0, indexCount);
  }

  #sameHandle(a: Handle<any> | null, b: Handle<any> | null): boolean {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    return a.id.equals(b.id);
  }

  #compareHandles(a: Handle<any> | null, b: Handle<any> | null): number {
    if (a === null && b === null) return 0;
    if (a === null) return -1;
    if (b === null) return 1;
    return a.id.toString().localeCompare(b.id.toString());
  }
}
