import type { ComponentClass, Entity } from "../types";
import type { Commands } from "../commands";
import type { EventClass } from "../events";

/**
 * Trigger wrapper that provides event and entity context to observers.
 * This is the first parameter passed to all observer callbacks.
 *
 * Supports both single-trigger mode and batch mode:
 * - Single: trigger.event() returns one event, trigger.entity() returns one entity
 * - Batch: trigger.events() returns array of [event, entity] pairs
 *
 * @template TEvent The type of event being observed
 */
export class Trigger<TEvent> {
  #event?: TEvent;
  #entity?: Entity;
  #batch?: Array<[TEvent, Entity]>;

  constructor(event: TEvent, entity?: Entity);
  constructor(batch: Array<[TEvent, Entity]>);
  constructor(eventOrBatch: TEvent | Array<[TEvent, Entity]>, entity?: Entity) {
    if (Array.isArray(eventOrBatch)) {
      // Batch mode
      this.#batch = eventOrBatch;
    } else {
      // Single mode
      this.#event = eventOrBatch;
      this.#entity = entity;
    }
  }

  /**
   * Returns the event instance that triggered this observer.
   * For batch mode, returns the first event in the batch.
   */
  public event(): TEvent {
    if (this.#batch) {
      return this.#batch[0]![0];
    }
    return this.#event!;
  }

  /**
   * Returns the entity that this event targets.
   * Returns 0 for broadcast events (events without a specific target entity).
   * For batch mode, returns the first entity in the batch.
   */
  public entity(): Entity {
    if (this.#batch) {
      return this.#batch[0]![1] ?? 0;
    }
    return this.#entity ?? 0;
  }

  /**
   * Returns true if this trigger targets a specific entity (not a broadcast).
   * For batch mode, checks if the first event has an entity.
   */
  public hasEntity(): boolean {
    if (this.#batch) {
      return this.#batch[0]![1] !== undefined;
    }
    return this.#entity !== undefined;
  }

  /**
   * Returns true if this trigger is in batch mode (multiple events).
   */
  public isBatch(): boolean {
    return this.#batch !== undefined;
  }

  /**
   * Returns all [event, entity] pairs in batch mode.
   * For single mode, returns array with one pair.
   */
  public events(): Array<[TEvent, Entity]> {
    if (this.#batch) {
      return this.#batch;
    }
    return [[this.#event!, this.#entity ?? 0]];
  }

  /**
   * Returns the number of events in this trigger (1 for single mode, N for batch mode).
   */
  public count(): number {
    return this.#batch?.length ?? 1;
  }
}

/**
 * Event fired when a component is added to an entity.
 * This is automatically triggered by the World when components are added.
 *
 * @template T The component type
 */
export class ComponentAdded<T = any> {
  constructor(
    public entity: Entity,
    public component: T,
    public componentClass: ComponentClass<T>
  ) {}
}

/**
 * Event fired when a component is removed from an entity.
 * This is automatically triggered by the World when components are removed.
 *
 * @template T The component type
 */
export class ComponentRemoved<T = any> {
  constructor(
    public entity: Entity,
    public component: T,
    public componentClass: ComponentClass<T>
  ) {}
}

/**
 * Context passed to observer callbacks containing trigger and commands.
 */
export interface ObserverContext<TEvent = any> {
  /**
   * Trigger wrapper with event and entity context
   */
  trigger: Trigger<TEvent>;

  /**
   * Commands instance for ECS operations
   */
  commands: Commands;
}

/**
 * Observer callback signature.
 * Observers receive a context object with trigger and commands.
 *
 * @template TEvent The type of event being observed
 */
export type ObserverCallback<TEvent = any> = (
  context: ObserverContext<TEvent>
) => void;

/**
 * Lifecycle hook types for component observers
 */
export type ObserverLifecycleHook = "onAdded" | "onRemoved";

/**
 * Internal descriptor for registered observers.
 * Stores the event class, callback, and optional entity scope.
 *
 * @internal
 */
export interface ObserverDescriptor<TEvent = any> {
  /**
   * The event class this observer watches for
   */
  eventClass: EventClass<TEvent> | ComponentClass<TEvent>;

  /**
   * The callback function to execute when the event is triggered
   */
  callback: ObserverCallback<TEvent>;

  /**
   * If set, this observer only fires for this specific entity.
   * If undefined, this observer fires for all entities (global observer).
   */
  targetEntity?: Entity;

  /**
   * If set, this observer watches for component lifecycle events
   */
  lifecycleHook?: ObserverLifecycleHook;

  /**
   * For component lifecycle observers, this is the component class
   */
  componentClass?: ComponentClass<any>;
}
