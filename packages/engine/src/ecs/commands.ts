import type { ComponentClass, Entity } from "./types";
import type { World } from "./world";

export class Commands {
  #world: World;
  #app: import("../index").App;

  constructor(app: import("../index").App) {
    this.#world = app.world;
    this.#app = app;
  }

  public debugWorld() {
    this.#world.debug();
  }

  public spawn(...components: unknown[]): Entity {
    const entity = this.#world.createEntity();
    const record: Record<string, unknown> = {};
    for (let i = 0; i < components.length; i++) {
      record[i] = components[i];
    }
    this.#world.addComponents(entity, record);
    return entity;
  }

  public all<const T extends readonly ComponentClass<unknown>[]>(
    ...components: T
  ): { [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never }[] {
    const results: unknown[] = [];
    for (const q of this.#world.query(...components)) {
      results.push(q.components);
    }
    return results as unknown as {
      [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
    }[];
  }

  public tryFind<const T extends readonly ComponentClass<unknown>[]>(
    ...components: T
  ):
    | { [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never }
    | undefined {
    for (const q of this.#world.query(...components)) {
      return q.components as unknown as {
        [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
      };
    }
    return undefined;
  }

  public find<const T extends readonly ComponentClass<unknown>[]>(
    ...components: T
  ): { [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never } {
    const tuple = this.tryFind(...components);
    if (!tuple) {
      throw new Error("No matching entity found for the requested components");
    }
    return tuple;
  }

  public getResource<T>(cls: new (...args: any[]) => T): T {
    return this.#app.getResource(cls);
  }

  public tryGetResource<T>(cls: new (...args: any[]) => T): T | undefined {
    return this.#app.tryGetResource(cls);
  }

  public hasResource(cls: new (...args: any[]) => unknown): boolean {
    return this.#app.hasResource(cls);
  }

  public setResource<T extends object>(value: T): this {
    this.#app.setResource(value);
    return this;
  }
}
