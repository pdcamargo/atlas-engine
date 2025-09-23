import type { ComponentClass, Entity } from "./types";

export class Archetype {
  #componentClasses: ReadonlyArray<ComponentClass<unknown>>;
  #componentClassSet: Set<ComponentClass<unknown>>;
  #entityIds: Entity[] = [];
  #entityIndexById: Map<Entity, number> = new Map();
  #columns: Map<ComponentClass<unknown>, unknown[]> = new Map();

  constructor(componentClasses: ReadonlyArray<ComponentClass<unknown>>) {
    this.#componentClasses = [...componentClasses].sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    );
    this.#componentClassSet = new Set(this.#componentClasses);
    for (const cls of this.#componentClasses) {
      this.#columns.set(cls, []);
    }
  }

  public getComponentClasses(): ReadonlyArray<ComponentClass<unknown>> {
    return this.#componentClasses;
  }

  public getKey(): string {
    return Archetype.keyFrom(this.#componentClasses);
  }

  public static keyFrom(
    classes: ReadonlyArray<ComponentClass<unknown>>
  ): string {
    const names = [...classes]
      .map((c) => c.name)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return names.join("|");
  }

  public hasAll(components: ReadonlyArray<ComponentClass<unknown>>): boolean {
    for (const c of components) {
      if (!this.#componentClassSet.has(c)) return false;
    }
    return true;
  }

  public hasAny(components: ReadonlyArray<ComponentClass<unknown>>): boolean {
    for (const c of components) {
      if (this.#componentClassSet.has(c)) return true;
    }
    return false;
  }

  public insert(
    entityId: Entity,
    componentInstances: Map<ComponentClass<unknown>, unknown>
  ): void {
    const rowIndex = this.#entityIds.length;
    this.#entityIds.push(entityId);
    this.#entityIndexById.set(entityId, rowIndex);
    for (const cls of this.#componentClasses) {
      const column = this.#columns.get(cls)!;
      column.push(componentInstances.get(cls));
    }
  }

  public remove(
    entityId: Entity
  ): Map<ComponentClass<unknown>, unknown> | null {
    const rowIndex = this.#entityIndexById.get(entityId);
    if (rowIndex === undefined) return null;

    const lastIndex = this.#entityIds.length - 1;
    const removedComponents = new Map<ComponentClass<unknown>, unknown>();

    for (const cls of this.#componentClasses) {
      const column = this.#columns.get(cls)!;
      const removed = column[rowIndex];
      removedComponents.set(cls, removed);
      if (rowIndex !== lastIndex) {
        column[rowIndex] = column[lastIndex];
      }
      column.pop();
    }

    if (rowIndex !== lastIndex) {
      const movedEntity = this.#entityIds[lastIndex];
      this.#entityIds[rowIndex] = movedEntity;
      this.#entityIndexById.set(movedEntity, rowIndex);
    }
    this.#entityIds.pop();
    this.#entityIndexById.delete(entityId);

    return removedComponents;
  }

  public getRowCount(): number {
    return this.#entityIds.length;
  }

  public readRowAsTuple<T extends readonly ComponentClass<unknown>[]>(
    requested: T,
    rowIndex: number
  ): {
    tuple: { [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never };
    entityId: Entity;
  } {
    const tuple: unknown[] = [];
    for (const cls of requested) {
      const column = this.#columns.get(cls)!;
      tuple.push(column[rowIndex]);
    }
    return {
      tuple: tuple as unknown as {
        [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
      },
      entityId: this.#entityIds[rowIndex],
    };
  }

  public fillRowInto<T extends readonly ComponentClass<unknown>[]>(
    requested: T,
    rowIndex: number,
    out: unknown[]
  ): Entity {
    for (let i = 0; i < requested.length; i++) {
      const cls = requested[i];
      const column = this.#columns.get(cls)!;
      out[i] = column[rowIndex];
    }
    return this.#entityIds[rowIndex];
  }

  public getEntityIndex(entityId: Entity): number | undefined {
    return this.#entityIndexById.get(entityId);
  }

  public getComponentAt<T>(
    rowIndex: number,
    componentClass: ComponentClass<T>
  ): T | undefined {
    const column = this.#columns.get(componentClass);
    if (!column) return undefined;
    return column[rowIndex] as T;
  }

  public hasComponentClass(componentClass: ComponentClass<unknown>): boolean {
    return this.#columns.has(componentClass);
  }

  public getEntityComponents(
    entityId: Entity
  ): Map<ComponentClass<unknown>, unknown> | null {
    const rowIndex = this.#entityIndexById.get(entityId);
    if (rowIndex === undefined) return null;

    const components = new Map<ComponentClass<unknown>, unknown>();
    for (const cls of this.#componentClasses) {
      const column = this.#columns.get(cls)!;
      components.set(cls, column[rowIndex]);
    }
    return components;
  }
}
