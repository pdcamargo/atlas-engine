import type { ComponentClass, Entity } from "./types";

export class Archetype {
  #componentClasses: ReadonlyArray<ComponentClass<unknown>>;
  #entityIds: Entity[] = [];
  #entityIndexById: Map<Entity, number> = new Map();
  #columns: Map<ComponentClass<unknown>, unknown[]> = new Map();

  constructor(componentClasses: ReadonlyArray<ComponentClass<unknown>>) {
    this.#componentClasses = [...componentClasses].sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    );
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
    const set = new Set(this.#componentClasses);
    for (const c of components) {
      if (!set.has(c)) return false;
    }
    return true;
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
}
