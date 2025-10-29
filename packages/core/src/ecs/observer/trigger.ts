import type { Entity, ComponentClass } from "../types";
import type { Commands } from "../commands";
import { Trigger, type ObserverLifecycleHook } from "./types";
import type { ObserverRegistry } from "./registry";

/**
 * Queued trigger waiting to be executed.
 * @internal
 */
interface QueuedTrigger {
  event: any;
  entity?: Entity;
  componentClass?: ComponentClass<any>;
  lifecycleHook?: ObserverLifecycleHook;
}

/**
 * Resource that manages the observer trigger queue and execution.
 * This implements deferred observer execution - events are queued and
 * flushed at safe boundaries (like despawning).
 *
 * Store this as an ECS resource in the App.
 */
export class ObserverTrigger {
  /**
   * Maximum recursion depth for flush() to prevent infinite cascades.
   * If observers trigger new events recursively, we'll flush up to this depth.
   */
  private static readonly MAX_FLUSH_DEPTH = 10;

  /**
   * Queue of events waiting to trigger observers.
   * Events are added via trigger() and processed during flush().
   */
  #queue: QueuedTrigger[] = [];

  /**
   * Queue an event to trigger observers.
   * The event will be processed during the next flush() call.
   *
   * @param event The event instance to trigger
   * @param entity Optional target entity (for entity-targeted events)
   */
  public trigger(event: any, entity?: Entity): void {
    this.#queue.push({ event, entity });
  }

  /**
   * Queue a component lifecycle observer trigger.
   * Used internally by World to trigger onAdded/onRemoved observers.
   *
   * @param componentClass The component class
   * @param hook The lifecycle hook ("onAdded" or "onRemoved")
   * @param component The component instance
   * @param entity The entity that owns the component
   * @internal
   */
  public triggerComponent(
    componentClass: ComponentClass<any>,
    hook: ObserverLifecycleHook,
    component: any,
    entity: Entity
  ): void {
    this.#queue.push({
      event: component,
      entity,
      componentClass,
      lifecycleHook: hook,
    });
  }

  /**
   * Execute all queued observer triggers.
   * This should be called at safe boundaries in the game loop (after PostUpdate, PostFixedUpdate).
   *
   * For each queued event:
   * 1. Group triggers by observer callback (batching optimization)
   * 2. Execute each observer's callback once with batched [event, entity] pairs
   * 3. Recursively flush any new triggers added during execution (up to MAX_FLUSH_DEPTH)
   *
   * IMPORTANT: Uses snapshot-and-clear pattern to prevent infinite loops.
   * The queue is captured and cleared BEFORE processing, so observer callbacks
   * can safely call commands.trigger() without modifying the queue being iterated.
   *
   * BATCHING OPTIMIZATION:
   * Instead of calling observers 1000 times for 1000 Mine components, we call them
   * once with an array of 1000 [component, entity] pairs. Much more efficient!
   *
   * @param registry The observer registry to look up observers
   * @param commands The Commands instance to pass to observer callbacks
   * @param depth Internal recursion depth counter (default: 0)
   */
  public flush(registry: ObserverRegistry, commands: Commands, depth = 0): void {
    if (this.#queue.length === 0) return;

    // Prevent infinite recursion from cascading observers
    if (depth >= ObserverTrigger.MAX_FLUSH_DEPTH) {
      console.warn(
        `[ObserverTrigger] Max flush depth ${depth} reached, discarding ${this.#queue.length} remaining triggers to prevent infinite cascade`
      );
      this.#queue = [];
      return;
    }

    // CRITICAL: Snapshot the current queue and clear it BEFORE processing
    // This allows observer callbacks to safely call commands.trigger() which will
    // queue new events for the NEXT flush (either recursive or next frame)
    const snapshot = this.#queue;
    this.#queue = [];

    // BATCHING: Group triggers by observer callback
    // Map<callback function, Array<[event, entity]>>
    const batchedTriggers = new Map<any, Array<[any, Entity]>>();

    // Build batches for each observer callback
    for (const { event, entity, componentClass, lifecycleHook } of snapshot) {
      let observers: any[] = [];

      if (componentClass && lifecycleHook) {
        // Component lifecycle observer
        observers = registry.getObserversForComponent(componentClass, lifecycleHook, entity);
      } else {
        // Regular event observer
        const eventClass = event.constructor;
        observers = registry.getObservers(eventClass, entity);
      }

      // Add this trigger to the batch for each observer
      for (const observer of observers) {
        let batch = batchedTriggers.get(observer.callback);
        if (!batch) {
          batch = [];
          batchedTriggers.set(observer.callback, batch);
        }
        batch.push([event, entity ?? 0]);
      }
    }

    // Execute each observer callback once with its batched triggers
    for (const [callback, batch] of batchedTriggers.entries()) {
      try {
        const trigger = new Trigger(batch);
        callback({ trigger, commands });
        // Any new triggers added here go into the fresh this.#queue
      } catch (error) {
        console.error(
          `Observer error (batch of ${batch.length} triggers):`,
          error
        );
      }
    }

    // Recursively flush any new triggers that were added during processing
    // (e.g., cascade explosions, state machines, etc.)
    if (this.#queue.length > 0) {
      this.flush(registry, commands, depth + 1);
    }
  }

  /**
   * Get the number of queued triggers waiting to be processed.
   * Useful for debugging and testing.
   */
  public getQueueSize(): number {
    return this.#queue.length;
  }

  /**
   * Clear the queue without executing any observers.
   * Useful for testing or error recovery.
   */
  public clear(): void {
    this.#queue = [];
  }
}
