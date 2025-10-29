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
    console.log("[ObserverTrigger] Queuing component observer:", componentClass.name, hook, "entity:", entity);
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
   * 1. Look up matching observers from the registry
   * 2. Execute each observer's callback with a Trigger wrapper
   * 3. Clear the queue
   *
   * @param registry The observer registry to look up observers
   * @param commands The Commands instance to pass to observer callbacks
   */
  public flush(registry: ObserverRegistry, commands: Commands): void {
    if (this.#queue.length === 0) return;

    console.log("[ObserverTrigger] Flushing", this.#queue.length, "queued triggers");

    // Process all queued triggers
    for (const { event, entity, componentClass, lifecycleHook } of this.#queue) {
      let observers: any[] = [];

      if (componentClass && lifecycleHook) {
        // Component lifecycle observer
        console.log("[ObserverTrigger] Looking up observers for component:", componentClass.name, lifecycleHook);
        observers = registry.getObserversForComponent(componentClass, lifecycleHook, entity);
        console.log("[ObserverTrigger] Found", observers.length, "observers");
      } else {
        // Regular event observer
        const eventClass = event.constructor;
        console.log("[ObserverTrigger] Looking up observers for event:", eventClass.name);
        observers = registry.getObservers(eventClass, entity);
        console.log("[ObserverTrigger] Found", observers.length, "observers");
      }

      // Execute each matching observer
      for (const observer of observers) {
        const trigger = new Trigger(event, entity);
        try {
          console.log("[ObserverTrigger] Executing observer callback");
          observer.callback({ trigger, commands });
        } catch (error) {
          const name = componentClass?.name || event.constructor.name;
          console.error(
            `Observer error for ${lifecycleHook || 'event'} ${name}:`,
            error
          );
        }
      }
    }

    // Clear the queue after processing
    this.#queue = [];
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
