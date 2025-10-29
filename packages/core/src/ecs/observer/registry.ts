import type { Entity, ComponentClass } from "../types";
import type { EventClass } from "../events";
import type { ObserverDescriptor, ObserverLifecycleHook } from "./types";

/**
 * Registry that stores and manages all registered observers.
 * This is stored as an ECS resource in the App.
 *
 * Observers are organized by event class name for efficient lookup.
 * When an event is triggered, the registry provides all matching observers.
 */
export class ObserverRegistry {
  /**
   * Map from event class name to array of observer descriptors
   */
  #observers: Map<string, ObserverDescriptor[]> = new Map();

  /**
   * Register a new observer.
   *
   * @param descriptor The observer descriptor containing event class, callback, and optional entity scope
   */
  public register<T>(descriptor: ObserverDescriptor<T>): void {
    const key = this.#keyFor(descriptor.eventClass);
    let observers = this.#observers.get(key);
    if (!observers) {
      observers = [];
      this.#observers.set(key, observers);
    }
    observers.push(descriptor);
  }

  /**
   * Unregister an observer.
   * Removes the first observer that matches the given descriptor.
   *
   * @param descriptor The observer descriptor to remove
   * @returns True if an observer was removed, false otherwise
   */
  public unregister<T>(descriptor: ObserverDescriptor<T>): boolean {
    const key = this.#keyFor(descriptor.eventClass);
    const observers = this.#observers.get(key);
    if (!observers) return false;

    const index = observers.findIndex((obs) => obs.callback === descriptor.callback);
    if (index === -1) return false;

    observers.splice(index, 1);
    if (observers.length === 0) {
      this.#observers.delete(key);
    }
    return true;
  }

  /**
   * Get all observers that should fire for a given event and optional target entity.
   *
   * Returns:
   * - Global observers (no targetEntity) - always fire
   * - Entity-scoped observers (targetEntity matches) - only fire for that entity
   *
   * @param eventClass The event class to find observers for
   * @param entity Optional target entity (if the event targets a specific entity)
   * @returns Array of matching observer descriptors
   */
  public getObservers<T>(
    eventClass: EventClass<T>,
    entity?: Entity
  ): ObserverDescriptor<T>[] {
    const key = this.#keyFor(eventClass);
    const allObservers = this.#observers.get(key);
    if (!allObservers || allObservers.length === 0) return [];

    // Filter to observers that should fire:
    // 1. Global observers (targetEntity is undefined)
    // 2. Entity-scoped observers where targetEntity matches
    const matching = allObservers.filter((obs) => {
      if (obs.targetEntity === undefined) return true; // Global observer
      if (entity === undefined) return false; // Broadcast event doesn't fire entity-scoped observers
      return obs.targetEntity === entity;
    });

    return matching as ObserverDescriptor<T>[];
  }

  /**
   * Get all observers for a specific component lifecycle hook.
   *
   * @param componentClass The component class
   * @param hook The lifecycle hook ("onAdded" or "onRemoved")
   * @param entity Optional target entity
   * @returns Array of matching observer descriptors
   */
  public getObserversForComponent<T>(
    componentClass: ComponentClass<T>,
    hook: ObserverLifecycleHook,
    entity?: Entity
  ): ObserverDescriptor<T>[] {
    const key = this.#keyFor(componentClass as any);
    const allObservers = this.#observers.get(key);
    if (!allObservers || allObservers.length === 0) return [];

    // Filter to observers matching:
    // 1. Correct lifecycle hook
    // 2. Global or entity-scoped
    const matching = allObservers.filter((obs) => {
      if (obs.lifecycleHook !== hook) return false;
      if (obs.targetEntity === undefined) return true; // Global observer
      if (entity === undefined) return false;
      return obs.targetEntity === entity;
    });

    return matching as ObserverDescriptor<T>[];
  }

  /**
   * Remove all observers targeting a specific entity.
   * This should be called when an entity is despawned to prevent memory leaks.
   *
   * @param entity The entity to remove observers for
   */
  public removeObserversForEntity(entity: Entity): void {
    for (const observers of this.#observers.values()) {
      for (let i = observers.length - 1; i >= 0; i--) {
        if (observers[i]!.targetEntity === entity) {
          observers.splice(i, 1);
        }
      }
    }
  }

  /**
   * Get the total number of registered observers across all event types.
   * Useful for debugging and diagnostics.
   */
  public getObserverCount(): number {
    let count = 0;
    for (const observers of this.#observers.values()) {
      count += observers.length;
    }
    return count;
  }

  /**
   * Clear all registered observers.
   * Useful for testing or resetting the registry.
   */
  public clear(): void {
    this.#observers.clear();
  }

  #keyFor<T>(eventClass: EventClass<T>): string {
    return eventClass.name;
  }
}
