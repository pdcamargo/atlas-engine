import "reflect-metadata";
export { World } from "./ecs/world";
export { SystemType } from "./ecs/types";
export {
  Commands,
  QueryBuilder,
  defineBundle,
  required,
  EntityAddedEvent,
  EntityRemovedEvent,
} from "./ecs/commands";
export type { BundleConstructor, BundleOverrides } from "./ecs/commands";
export type { EcsPlugin, EcsPluginGroup } from "./plugin";
export { Events, EventWriter, EventReader } from "./ecs/events";
export type { EventsApi, EventClass } from "./ecs/events";

export * from "./ecs/plugins";
export * from "./ecs/types";
export * from "./ecs/components";
export * from "./ecs/assets";
export * from "./math";
export * from "./object-pool";
export { sys, createSet } from "./ecs/system_builder";
export type { SystemBuilder } from "./ecs/system_builder";

// Serialization system
export * from "./ecs/serialization";

// Scene system
export * from "./ecs/scene";

// Observer system
export * from "./ecs/observer";

import { Scheduler } from "./ecs/scheduler";
import { World as ECSWorld } from "./ecs/world";
import {
  SystemType as ESystemType,
  type SystemBuilderInput,
  type SystemDescriptor,
} from "./ecs/types";
import type { EcsPlugin, EcsPluginGroup } from "./plugin";
import { Events, type EventClass } from "./ecs/events";
import { EntityAddedEvent, EntityRemovedEvent, Commands } from "./ecs/commands";
import { registerBuiltInSerializers } from "./ecs/serialization";
import {
  ObserverRegistry,
  ObserverTrigger,
  type ObserverCallback,
  ComponentAdded,
  ComponentRemoved,
} from "./ecs/observer";

export class App {
  #world: ECSWorld;
  #scheduler: Scheduler;
  #plugins: Set<string> = new Set();
  #pluginInstances: EcsPlugin[] = [];
  #resources: Map<string, unknown> = new Map();
  #events: Events;
  #commands: Commands;

  static #serializersRegistered = false;

  constructor() {
    this.#world = new ECSWorld();
    this.#scheduler = new Scheduler();
    this.#events = new Events();
    this.#commands = new Commands(this);

    // Initialize observer system resources
    const observerTrigger = new ObserverTrigger();
    this.setResource(new ObserverRegistry());
    this.setResource(observerTrigger);

    // Wire up the world to fire component lifecycle events
    this.#world.setObserverTrigger(observerTrigger);

    // Auto-register built-in serializers on first App instance
    if (!App.#serializersRegistered) {
      registerBuiltInSerializers();
      App.#serializersRegistered = true;
    }
  }

  public static create() {
    return new App()
      .addEvent(EntityAddedEvent)
      .addEvent(EntityRemovedEvent);
  }

  public addSystems(
    type: ESystemType,
    ...systems: (SystemBuilderInput | SystemDescriptor[])[]
  ): this {
    for (const s of systems) {
      if (Array.isArray(s)) {
        const arr = s as unknown[];
        const isDescriptorArray =
          arr.length > 0 &&
          typeof arr[0] === "object" &&
          arr[0] !== null &&
          "fn" in (arr[0] as object) &&
          "id" in (arr[0] as object);
        if (isDescriptorArray) {
          for (const d of arr as SystemDescriptor[]) {
            this.#scheduler.addSystem(type, d as any);
          }
          continue;
        }
      }
      this.#scheduler.addSystem(type, s as any);
    }
    return this;
  }

  public addStartupSystems(
    ...systems: (SystemBuilderInput | SystemDescriptor[])[]
  ): this {
    return this.addSystems(ESystemType.StartUp, ...systems);
  }

  public addUpdateSystems(
    ...systems: (SystemBuilderInput | SystemDescriptor[])[]
  ): this {
    return this.addSystems(ESystemType.Update, ...systems);
  }

  public addFixedUpdateSystems(
    ...systems: (SystemBuilderInput | SystemDescriptor[])[]
  ): this {
    return this.addSystems(ESystemType.FixedUpdate, ...systems);
  }

  public addRenderSystems(
    ...systems: (SystemBuilderInput | SystemDescriptor[])[]
  ): this {
    return this.addSystems(ESystemType.Render, ...systems);
  }

  public get world(): ECSWorld {
    return this.#world;
  }

  public get events(): Events {
    return this.#events;
  }

  public setResource<T extends object>(value: T): this {
    this.#resources.set((value as object).constructor.name, value);
    return this;
  }

  public tryGetResource<T>(cls: new (...args: any[]) => T): T | undefined {
    return this.#resources.get(cls.name) as T | undefined;
  }

  public getResource<T>(cls: new (...args: any[]) => T): T {
    const value = this.tryGetResource(cls);
    if (value === undefined) {
      throw new Error(`Resource not found: ${cls.name}`);
    }
    return value;
  }

  public hasResource(cls: new (...args: any[]) => unknown): boolean {
    return this.#resources.has(cls.name);
  }

  public isAsyncSystemPending(systemId: string): boolean {
    return this.#scheduler.isAsyncSystemPending(systemId);
  }

  public getPendingAsyncSystemsCount(): number {
    return this.#scheduler.getPendingAsyncSystemsCount();
  }

  public async run() {
    this.#preparePlugins();

    await this.#finishPlugins();
    await this.#cleanupPlugins();

    await this.#scheduler.runAsync(ESystemType.StartUp, this);

    // Main loop wrapped in a Promise that resolves when no systems are stepping anymore
    await new Promise<void>((resolve) => {
      const targetFixedDelta = 1 / 60;
      let accumulator = 0;
      let last = performance.now() / 1000;
      const running = this.#scheduler.hasTickSystems();

      const step = () => {
        // If no tick systems remain, resolve and stop stepping
        if (!this.#scheduler.hasTickSystems()) {
          resolve();
          return;
        }

        const now = performance.now() / 1000;
        const dt = now - last;
        last = now;
        accumulator += dt;

        this.#scheduler.run(ESystemType.PreUpdate, this);
        this.#scheduler.run(ESystemType.Update, this);
        this.#scheduler.run(ESystemType.PostUpdate, this);

        // Flush observers after PostUpdate
        this.#flushObservers();

        // Flush despawns after PostUpdate
        this.#commands.flushDespawns();

        while (accumulator >= targetFixedDelta) {
          this.#scheduler.run(ESystemType.PreFixedUpdate, this);
          this.#scheduler.run(ESystemType.FixedUpdate, this);
          this.#scheduler.run(ESystemType.PostFixedUpdate, this);

          // Flush observers after PostFixedUpdate
          this.#flushObservers();

          // Flush despawns after each fixed update cycle
          this.#commands.flushDespawns();

          accumulator -= targetFixedDelta;
        }

        this.#scheduler.run(ESystemType.PreRender, this);
        this.#scheduler.run(ESystemType.Render, this);
        this.#scheduler.run(ESystemType.PostRender, this);

        // Event maintenance and frame advancement
        this.#events.onFrameEnd();

        // Check again if any tick systems remain before next frame
        if (!this.#scheduler.hasTickSystems()) {
          resolve();
        } else {
          requestAnimationFrame(step);
        }
      };

      if (running) {
        step();
      } else {
        resolve();
      }
    });
  }

  public addEvent<T>(cls: new (...args: any[]) => T): this {
    this.#events.addEvent(cls);
    return this;
  }

  /**
   * Register an observer for a custom event type.
   * The observer callback will be invoked whenever the event is triggered via commands.trigger().
   *
   * @param eventClass The event class to observe
   * @param callback The callback to execute when the event is triggered
   * @returns This App instance for chaining
   *
   * @example
   * ```ts
   * // Custom event observer
   * app.addObserver(Explode, ({ trigger, commands }) => {
   *   const entity = trigger.entity();
   *   commands.despawnEntity(entity);
   * });
   * ```
   */
  public addObserver<T>(
    eventClass: EventClass<T>,
    callback: import("./ecs/observer").ObserverCallback<T>
  ): this;

  /**
   * Register an observer for component lifecycle events (onAdded/onRemoved).
   * The observer callback will be invoked when the component is added/removed from any entity.
   *
   * @param componentClass The component class to observe
   * @param hook The lifecycle hook ("onAdded" or "onRemoved")
   * @param callback The callback to execute - receives the component instance in trigger.event()
   * @returns This App instance for chaining
   *
   * @example
   * ```ts
   * // Component added observer
   * app.addObserver(Mine, "onAdded", ({ trigger, commands }) => {
   *   const mine = trigger.event();  // The Mine component instance
   *   const entity = trigger.entity();
   *   // Add to spatial index
   * });
   *
   * // Component removed observer
   * app.addObserver(Mine, "onRemoved", ({ trigger, commands }) => {
   *   const mine = trigger.event();  // The Mine component instance
   *   // Remove from spatial index
   * });
   * ```
   */
  public addObserver<T>(
    componentClass: import("./ecs/types").ComponentClass<T>,
    hook: import("./ecs/observer").ObserverLifecycleHook,
    callback: import("./ecs/observer").ObserverCallback<T>
  ): this;

  // Implementation
  public addObserver<T>(
    classOrEvent: EventClass<T> | import("./ecs/types").ComponentClass<T>,
    callbackOrHook: import("./ecs/observer").ObserverCallback<T> | import("./ecs/observer").ObserverLifecycleHook,
    maybeCallback?: import("./ecs/observer").ObserverCallback<T>
  ): this {
    const registry = this.getResource(ObserverRegistry);

    // If second parameter is a function, it's a custom event observer
    if (typeof callbackOrHook === "function") {
      registry.register({
        eventClass: classOrEvent as EventClass<T>,
        callback: callbackOrHook as import("./ecs/observer").ObserverCallback<T>,
      });
      return this;
    }

    // Otherwise, it's a component lifecycle observer
    const hook = callbackOrHook as import("./ecs/observer").ObserverLifecycleHook;
    const callback = maybeCallback!;

    registry.register({
      eventClass: classOrEvent as any, // Will be used as a key
      callback: callback as any,
      lifecycleHook: hook,
      componentClass: classOrEvent as import("./ecs/types").ComponentClass<T>,
    });

    return this;
  }

  public addSetRunIf(
    setId: import("./ecs/types").SystemSetId,
    ...predicates: import("./ecs/types").RunIfFn[]
  ): this {
    this.#scheduler.addSetRunIf(setId, predicates);
    return this;
  }

  public addSetBeforeSet(
    setId: import("./ecs/types").SystemSetId,
    before: import("./ecs/types").SystemSetId[],
    type?: import("./ecs/types").SystemType
  ): this {
    this.#scheduler.addSetBeforeSet(setId, before, type);
    return this;
  }

  public addSetAfterSet(
    setId: import("./ecs/types").SystemSetId,
    after: import("./ecs/types").SystemSetId[],
    type?: import("./ecs/types").SystemType
  ): this {
    this.#scheduler.addSetAfterSet(setId, after, type);
    return this;
  }

  public addSetBeforeLabel(
    setId: import("./ecs/types").SystemSetId,
    labels: string[],
    type?: import("./ecs/types").SystemType
  ): this {
    this.#scheduler.addSetBeforeLabel(setId, labels, type);
    return this;
  }

  public addSetAfterLabel(
    setId: import("./ecs/types").SystemSetId,
    labels: string[],
    type?: import("./ecs/types").SystemType
  ): this {
    this.#scheduler.addSetAfterLabel(setId, labels, type);
    return this;
  }

  public addPlugins(...plugins: (EcsPlugin | EcsPluginGroup)[]): this {
    for (const p of plugins) {
      if (isPluginGroup(p)) {
        for (const sub of p.plugins()) this.#registerPlugin(sub);
      } else {
        this.#registerPlugin(p);
      }
    }
    return this;
  }

  /**
   * Flush all queued observer triggers.
   * This executes all observers for events that were triggered since the last flush.
   * @internal
   */
  #flushObservers(): void {
    const registry = this.getResource(ObserverRegistry);
    const trigger = this.getResource(ObserverTrigger);
    trigger.flush(registry, this.#commands);
  }

  #registerPlugin(plugin: EcsPlugin): void {
    const unique = plugin.isUnique?.() ?? true;
    const name = plugin.name?.() ?? plugin.constructor.name;
    if (unique) {
      if (this.#plugins.has(name)) return;
      this.#plugins.add(name);
    }
    this.#pluginInstances.push(plugin);
    // allow plugin to register systems/resources
    // build can be sync or async; we await later in prepare
  }

  async #preparePlugins(): Promise<void> {
    for (const p of this.#pluginInstances) {
      // fire and forget build; errors will surface in finish/ready if relevant
      void p.build(this);
    }
  }

  async #finishPlugins(): Promise<void> {
    const finished = new Set<string>();
    const names = this.#pluginInstances.map((p) => getPluginName(p));
    const byName = new Map<string, EcsPlugin>();
    this.#pluginInstances.forEach((p) => byName.set(getPluginName(p), p));

    const getDeps = (p: EcsPlugin): string[] => {
      const deps = p.dependsOn?.() ?? [];
      return deps
        .map((d: unknown) =>
          typeof d === "string" ? d : (d as { name?: string })?.name
        )
        .filter((name): name is string => typeof name === "string");
    };

    const start = Date.now();
    while (finished.size < names.length) {
      let progressed = false;

      for (const n of names) {
        if (finished.has(n)) continue;

        const p = byName.get(n)!;

        const deps = getDeps(p);
        const depsReady = deps.every((dn) => finished.has(dn));

        const ready =
          typeof p.ready === "function" ? await p.ready?.(this) : true;

        if (depsReady && ready) {
          await p.finish?.(this);
          finished.add(n);
          progressed = true;
        }
      }
      if (!progressed) {
        await new Promise((r) => setTimeout(r, 1));
        if (Date.now() - start > 30_000) break; // safety cap
      }
    }
  }

  async #cleanupPlugins(): Promise<void> {
    for (const p of this.#pluginInstances) {
      await p.cleanup?.(this);
    }
  }
}

function isPluginGroup(p: EcsPlugin | EcsPluginGroup): p is EcsPluginGroup {
  return typeof (p as EcsPluginGroup).plugins === "function";
}

function getPluginName(p: EcsPlugin): string {
  const named = p.name?.();
  if (named && named.length > 0) return named;
  return (p as { constructor: { name?: string } }).constructor.name ?? "Plugin";
}
