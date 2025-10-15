import type { Entity } from "@atlas/core";
import type { InstanceData } from "../batching/instance_buffer";

/**
 * Cache for instance data to avoid rebuilding matrices every frame
 * Only entities marked as changed get their instance data rebuilt
 */
export class InstanceDataCache {
  private cache: Map<Entity, InstanceData> = new Map();

  /**
   * Get cached instance data for an entity
   */
  get(entity: Entity): InstanceData | undefined {
    return this.cache.get(entity);
  }

  /**
   * Set instance data for an entity
   */
  set(entity: Entity, data: InstanceData): void {
    this.cache.set(entity, data);
  }

  /**
   * Check if entity has cached data
   */
  has(entity: Entity): boolean {
    return this.cache.has(entity);
  }

  /**
   * Remove entity from cache
   */
  delete(entity: Entity): void {
    this.cache.delete(entity);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }
}
