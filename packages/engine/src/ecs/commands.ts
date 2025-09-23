import { Children, Parent } from "./components";
import type { ComponentClass, Entity } from "./types";
import type { World } from "./world";

function entityCommand(entity: Entity, commands: Commands) {
  return {
    pushChildren: (...childrenIds: Entity[]) => {
      let children = commands.tryGetComponent(entity, Children);

      if (!children) {
        children = new Children(childrenIds);
        commands.addComponent(entity, children);
      } else {
        children.childrenIds.push(...childrenIds);
      }
    },
    setChildren: (...childrenIds: Entity[]) => {
      if (childrenIds.length === 0) {
        commands.removeComponent(entity, Children);
        return;
      }

      let children = commands.tryGetComponent(entity, Children);

      if (!children) {
        children = new Children(childrenIds);
        commands.addComponent(entity, children);
      } else {
        children.childrenIds = childrenIds;
      }
    },
    setParent: (parentId: Entity | undefined | null) => {
      if (!parentId) {
        commands.removeComponent(entity, Parent);
        return;
      }

      let parent = commands.tryGetComponent(entity, Parent);

      if (!parent) {
        parent = new Parent(parentId);
        commands.addComponent(entity, parent);
      } else {
        parent.parentId = parentId;
      }
    },
  };
}

function spawnEntityCommand(entity: Entity, commands: Commands) {
  return {
    withChildren: (...childrenIds: Entity[]) => {
      commands.entity(entity).pushChildren(...childrenIds);
    },
    withParent: (parentId: Entity | undefined | null) => {
      commands.entity(entity).setParent(parentId);
    },
    id: () => {
      return entity;
    },
    insert: (...components: unknown[]) => {
      commands.addComponents(entity, ...components);
    },
  };
}

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

  public entity(entity: Entity) {
    return entityCommand(entity, this);
  }

  public spawn(...components: unknown[]) {
    const entity = this.#world.createEntity();
    const record: Record<string, unknown> = {};
    for (let i = 0; i < components.length; i++) {
      record[i] = components[i];
    }
    this.#world.addComponents(entity, record);

    return spawnEntityCommand(entity, this);
  }

  public all<const T extends readonly ComponentClass<unknown>[]>(
    ...components: T
  ): [
    Entity,
    ...{
      [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
    },
  ][] {
    const results: unknown[] = [];
    for (const q of this.#world.query(...components)) {
      results.push([q.entity, ...q.components] as unknown);
    }
    return results as unknown as [
      Entity,
      ...{
        [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
      },
    ][];
  }

  public tryFind<const T extends readonly ComponentClass<unknown>[]>(
    ...components: T
  ):
    | [
        Entity,
        ...{
          [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
        },
      ]
    | undefined {
    for (const q of this.#world.query(...components)) {
      return [q.entity, ...q.components] as unknown as [
        Entity,
        ...{
          [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
        },
      ];
    }
    return undefined;
  }

  public find<const T extends readonly ComponentClass<unknown>[]>(
    ...components: T
  ): [
    Entity,
    ...{
      [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
    },
  ] {
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

  public getComponent<T>(entity: Entity, componentClass: ComponentClass<T>): T {
    const component = this.#world.getComponent(entity, componentClass);
    if (!component) {
      throw new Error("Component not found");
    }
    return component;
  }

  public tryGetComponent<T>(
    entity: Entity,
    componentClass: ComponentClass<T>
  ): T | undefined {
    return this.#world.getComponent(entity, componentClass);
  }

  public hasComponent(
    entity: Entity,
    componentClass: ComponentClass<unknown>
  ): boolean {
    return this.#world.hasComponent(entity, componentClass);
  }

  public addComponent<T>(entity: Entity, component: T): void {
    const componentClass = (component as any).constructor as ComponentClass<T>;
    const record = { [componentClass.name]: component };
    this.#world.addComponents(entity, record);
  }

  public addComponents(entity: Entity, ...components: unknown[]): void {
    const componentClasses = components.reduce(
      (acc, c) => ({
        ...(acc as Record<string, unknown>),
        [(c as any).constructor.name]: c,
      }),
      {}
    ) as Record<string, unknown>;

    this.#world.addComponents(entity, componentClasses);
  }

  public removeComponent(
    entity: Entity,
    componentClass: ComponentClass<unknown>
  ): boolean {
    return this.#world.removeComponent(entity, componentClass);
  }

  public query<const T extends readonly ComponentClass<unknown>[]>(
    ...withComponents: T
  ): QueryBuilder<T>;
  public query<const T extends readonly ComponentClass<unknown>[]>(
    builder: QueryBuilder<T>
  ): QueryBuilder<T>;
  public query(...args: any[]): any {
    if (args.length === 1 && args[0] instanceof QueryBuilder) {
      return (args[0] as QueryBuilder<any>).bind(this.#world);
    }
    const withComponents = args as readonly ComponentClass<unknown>[];
    return new QueryBuilder<any>(this.#world, withComponents as any);
  }
}

export class QueryBuilder<const T extends readonly ComponentClass<unknown>[]> {
  #world: World | undefined;
  #withComponents: T;
  #withoutComponents: ComponentClass<unknown>[] = [];

  constructor(world: World, ...withComponents: T);
  constructor(...withComponents: T);
  constructor(...args: any[]) {
    if (
      args.length > 0 &&
      args[0] &&
      typeof args[0] === "object" &&
      typeof (args[0] as any).eachWhere === "function"
    ) {
      this.#world = args[0] as World;
      this.#withComponents = args.slice(1) as unknown as T;
    } else {
      this.#withComponents = args as unknown as T;
    }
  }

  public bind(world: World): this {
    this.#world = world;
    return this;
  }

  #requireWorld(): World {
    if (!this.#world) throw new Error("QueryBuilder is not bound to a world");
    return this.#world;
  }

  public without(...components: readonly ComponentClass<unknown>[]): this {
    for (const c of components) this.#withoutComponents.push(c);
    return this;
  }

  public all(): [
    Entity,
    ...{
      [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
    },
  ][] {
    const results: unknown[] = [];
    this.#requireWorld().eachWhere(
      this.#withComponents,
      this.#withoutComponents,
      (e, c) => {
        results.push([e, ...c] as unknown);
      }
    );
    return results as unknown as [
      Entity,
      ...{
        [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
      },
    ][];
  }

  public tryFind():
    | [
        Entity,
        ...{
          [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
        },
      ]
    | undefined {
    let result:
      | [
          Entity,
          ...{
            [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
          },
        ]
      | undefined;
    this.#requireWorld().eachWhere(
      this.#withComponents,
      this.#withoutComponents,
      (e, c) => {
        if (result === undefined) {
          result = [e, ...c] as unknown as [
            Entity,
            ...{
              [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
            },
          ];
        }
      }
    );
    return result;
  }

  public find(): [
    Entity,
    ...{
      [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
    },
  ] {
    const tuple = this.tryFind();
    if (!tuple) {
      throw new Error("No matching entity found for the requested components");
    }
    return tuple;
  }

  public forEach(
    fn: (
      entity: Entity,
      ...components: {
        [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
      }
    ) => void
  ): void {
    this.#requireWorld().eachWhere(
      this.#withComponents,
      this.#withoutComponents,
      (e, c) => {
        fn(
          e,
          ...(c as unknown as {
            [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
          })
        );
      }
    );
  }
}
