import { Archetype } from "./archetype";
import type { ComponentClass, Entity } from "./types";
import type { Scene, SceneInstance } from "./scene/scene";
import { SceneSerializer } from "./scene/scene-serializer";
import { SceneSpawner } from "./scene/spawner";

export class World {
  #nextEntityId: Entity = 1;
  #archetypeByKey: Map<string, Archetype> = new Map();
  #archetypeByEntity: Map<Entity, Archetype> = new Map();

  public createEntity(): Entity {
    const id = this.#nextEntityId++;
    // New entities start without components; they are not placed in any archetype yet
    return id;
  }

  public addComponents<T extends Record<string, unknown>>(
    entity: Entity,
    components: T
  ): void {
    const currentArchetype = this.#archetypeByEntity.get(entity);
    if (!currentArchetype) {
      const componentClasses = Object.keys(components).map(
        (k) =>
          (components as Record<string, unknown>)[k]!
            .constructor as ComponentClass<unknown>
      );
      this.#moveEntityToArchetype(entity, componentClasses, components);
      return;
    }

    // Merge existing components with the new ones (new ones override same-class ones)
    const existing = currentArchetype.getEntityComponents(entity) ?? new Map();
    const mergedInstances = new Map<ComponentClass<unknown>, unknown>(existing);
    for (const value of Object.values(components)) {
      if (!value) continue;
      const cls = (value as any).constructor as ComponentClass<unknown>;
      mergedInstances.set(cls, value);
    }
    this.setComponentsFromInstances(entity, mergedInstances);
  }

  public setComponentsFromInstances(
    entity: Entity,
    instances: Map<ComponentClass<unknown>, unknown>
  ): void {
    const componentClasses = [...instances.keys()];
    this.#moveEntityToArchetype(
      entity,
      componentClasses,
      Object.fromEntries(instances)
    );
  }

  #getOrCreateArchetype(
    componentClasses: ReadonlyArray<ComponentClass<unknown>>
  ): Archetype {
    const key = Archetype.keyFrom(componentClasses);
    let arch = this.#archetypeByKey.get(key);
    if (!arch) {
      arch = new Archetype(componentClasses);
      this.#archetypeByKey.set(key, arch);
    }
    return arch;
  }

  #moveEntityToArchetype(
    entity: Entity,
    componentClasses: ReadonlyArray<ComponentClass<unknown>>,
    componentObjects: Record<string, unknown>
  ): void {
    const current = this.#archetypeByEntity.get(entity);
    if (current) {
      current.remove(entity);
    }

    const instances = new Map<ComponentClass<unknown>, unknown>();
    for (const cls of componentClasses) {
      // find instance from provided objects by class match
      const found = Object.values(componentObjects).find(
        (o) =>
          o instanceof (cls as unknown as new (...args: unknown[]) => unknown)
      );
      instances.set(cls, found);
    }

    const target = this.#getOrCreateArchetype(componentClasses);
    target.insert(entity, instances);
    this.#archetypeByEntity.set(entity, target);
  }

  public *query<const T extends readonly ComponentClass<unknown>[]>(
    ...components: T
  ): Generator<
    {
      entity: Entity;
      components: {
        [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
      };
    },
    void,
    void
  > {
    // Iterate over archetypes that contain all requested components
    for (const arch of this.#archetypeByKey.values()) {
      if (!arch.hasAll(components)) continue;
      const rowCount = arch.getRowCount();
      for (let i = 0; i < rowCount; i++) {
        const { tuple, entityId } = arch.readRowAsTuple(components, i);
        yield {
          entity: entityId,
          components: tuple as unknown as {
            [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
          },
        };
      }
    }
  }

  public *queryWhere<const T extends readonly ComponentClass<unknown>[]>(
    withComponents: T,
    withoutComponents: ReadonlyArray<ComponentClass<unknown>>
  ): Generator<
    {
      entity: Entity;
      components: {
        [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
      };
    },
    void,
    void
  > {
    for (const arch of this.#archetypeByKey.values()) {
      if (!arch.hasAll(withComponents)) continue;
      if (withoutComponents.length > 0 && arch.hasAny(withoutComponents))
        continue;
      const rowCount = arch.getRowCount();
      for (let i = 0; i < rowCount; i++) {
        const { tuple, entityId } = arch.readRowAsTuple(withComponents, i);
        yield {
          entity: entityId,
          components: tuple as unknown as {
            [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
          },
        };
      }
    }
  }

  public eachWhere<const T extends readonly ComponentClass<unknown>[]>(
    withComponents: T,
    withoutComponents: ReadonlyArray<ComponentClass<unknown>>,
    fn: (
      entity: Entity,
      components: {
        [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
      }
    ) => void
  ): void {
    const temp: unknown[] = new Array(withComponents.length);
    for (const arch of this.#archetypeByKey.values()) {
      if (!arch.hasAll(withComponents)) continue;
      if (withoutComponents.length > 0 && arch.hasAny(withoutComponents))
        continue;
      const rowCount = arch.getRowCount();
      for (let i = 0; i < rowCount; i++) {
        const entityId = arch.fillRowInto(withComponents, i, temp);
        fn(
          entityId,
          temp as unknown as {
            [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
          }
        );
      }
    }
  }

  public getComponent<T>(
    entity: Entity,
    componentClass: ComponentClass<T>
  ): T | undefined {
    const archetype = this.#archetypeByEntity.get(entity);
    if (!archetype) return undefined;

    const entityIndex = archetype.getEntityIndex(entity);
    if (entityIndex === undefined) return undefined;

    return archetype.getComponentAt(entityIndex, componentClass);
  }

  public hasComponent(
    entity: Entity,
    componentClass: ComponentClass<unknown>
  ): boolean {
    const archetype = this.#archetypeByEntity.get(entity);
    if (!archetype) return false;

    return archetype.hasComponentClass(componentClass);
  }

  public getEntityComponents(
    entity: Entity
  ): Map<ComponentClass<unknown>, unknown> | null {
    const archetype = this.#archetypeByEntity.get(entity);
    if (!archetype) return null;
    return archetype.getEntityComponents(entity);
  }

  public removeComponent(
    entity: Entity,
    componentClass: ComponentClass<unknown>
  ): boolean {
    const currentArchetype = this.#archetypeByEntity.get(entity);
    if (!currentArchetype) return false;

    if (!currentArchetype.hasComponentClass(componentClass)) return false;

    // Get current components
    const currentComponents = currentArchetype.getEntityComponents(entity);
    if (!currentComponents) return false;

    // Remove the specified component
    currentComponents.delete(componentClass);

    // If no components left, remove entity entirely
    if (currentComponents.size === 0) {
      currentArchetype.remove(entity);
      this.#archetypeByEntity.delete(entity);
      return true;
    }

    // Move to new archetype without the removed component
    const newComponentClasses = [...currentComponents.keys()];
    this.#moveEntityToArchetype(
      entity,
      newComponentClasses,
      Object.fromEntries(currentComponents)
    );

    return true;
  }

  public debug() {
    // Sort by number of entities (descending) for better readability
    const archetypes = Array.from(this.#archetypeByKey.values())
      .map((arch) => ({
        arch,
        components: arch.getComponentClasses().map((c) => c.name),
        count: arch.getRowCount(),
      }))
      .sort((a, b) => b.count - a.count);

    const lines = ["World Archetypes:", "["];

    for (const { components, count } of archetypes) {
      if (count === 0) continue; // Skip empty archetypes
      const componentList =
        components.length > 0 ? components.join(", ") : "(no components)";
      lines.push(
        `  [${componentList}]: ${count} ${count === 1 ? "entity" : "entities"}`
      );
    }

    lines.push("]");

    const totalEntities = archetypes.reduce((sum, a) => sum + a.count, 0);
    lines.push(
      `\nTotal: ${totalEntities} ${totalEntities === 1 ? "entity" : "entities"} across ${archetypes.filter((a) => a.count > 0).length} archetype(s)`
    );

    console.log(lines.join("\n"));
  }

  /**
   * Save entities to a scene
   * @param entities List of entity IDs to save
   * @param metadata Optional metadata for the scene
   */
  public saveScene(entities: Entity[], metadata: any = {}): Scene {
    return SceneSerializer.fromWorld(this, entities, metadata);
  }

  /**
   * Spawn a scene into this world
   * @param scene The scene to spawn
   * @returns SceneInstance with entity mappings
   */
  public spawnScene(scene: Scene): SceneInstance {
    return SceneSpawner.spawn(this, scene);
  }
}
