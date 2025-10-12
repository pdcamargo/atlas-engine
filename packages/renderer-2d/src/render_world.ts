import { World, type Entity } from "@atlas/core";

/**
 * Separate ECS world for rendering
 * Based on Bevy's RenderWorld pattern
 */
export class RenderWorld {
  #world: World;
  #mainToRender: Map<Entity, Entity> = new Map();
  #renderToMain: Map<Entity, Entity> = new Map();

  constructor() {
    this.#world = new World();
  }

  /**
   * Get the underlying ECS world
   */
  public get world(): World {
    return this.#world;
  }

  /**
   * Map a main world entity to its render world counterpart
   */
  public mapEntity(mainEntity: Entity, renderEntity: Entity): void {
    this.#mainToRender.set(mainEntity, renderEntity);
    this.#renderToMain.set(renderEntity, mainEntity);
  }

  /**
   * Get the render entity for a main world entity
   */
  public getRenderEntity(mainEntity: Entity): Entity | undefined {
    return this.#mainToRender.get(mainEntity);
  }

  /**
   * Get the main entity for a render world entity
   */
  public getMainEntity(renderEntity: Entity): Entity | undefined {
    return this.#renderToMain.get(renderEntity);
  }

  /**
   * Check if a main entity has a render counterpart
   */
  public hasRenderEntity(mainEntity: Entity): boolean {
    return this.#mainToRender.has(mainEntity);
  }

  /**
   * Remove entity mapping
   */
  public unmapEntity(mainEntity: Entity): void {
    const renderEntity = this.#mainToRender.get(mainEntity);
    if (renderEntity !== undefined) {
      this.#renderToMain.delete(renderEntity);
    }
    this.#mainToRender.delete(mainEntity);
  }

  /**
   * Get or create a render entity for a main entity
   */
  public getOrCreateRenderEntity(mainEntity: Entity): Entity {
    let renderEntity = this.#mainToRender.get(mainEntity);
    if (renderEntity === undefined) {
      renderEntity = this.#world.createEntity();
      this.mapEntity(mainEntity, renderEntity);
    }
    return renderEntity;
  }

  /**
   * Clear all entity mappings
   */
  public clearMappings(): void {
    this.#mainToRender.clear();
    this.#renderToMain.clear();
  }

  /**
   * Get the number of mapped entities
   */
  public get entityCount(): number {
    return this.#mainToRender.size;
  }
}
