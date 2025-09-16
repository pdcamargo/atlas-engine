import { Archetype } from "./archetype";
import type { ComponentClass, Entity } from "./types";

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
    const componentClasses = Object.keys(components).map(
      (k) =>
        (components as Record<string, unknown>)[k]!
          .constructor as ComponentClass<unknown>
    );
    this.#moveEntityToArchetype(entity, componentClasses, components);
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

  public debug() {
    // console.log a formatted string of the world archetypes
    console.log(this.#archetypeByEntity);
    console.log(this.#archetypeByKey);
  }
}
