/**
 * Event map interface that defines the structure for event types
 * Each key represents an event name and its value represents the event payload type
 */
export interface EventMap {
  [event: string]: unknown;
}

/**
 * Type for event listener functions
 */
export type EventListener<T> = (data: T) => void;

/**
 * Type for event listener functions that can be called once
 */
export type EventListenerOnce<T> = (data: T) => void;

/**
 * Strongly typed, generic Event Emitter class
 *
 * @template T - Event map interface defining event names and their payload types
 *
 * @example
 * ```typescript
 * interface MyEvents {
 *   'user-login': { userId: string; timestamp: number };
 *   'user-logout': { userId: string };
 *   'error': { message: string; code: number };
 * }
 *
 * const emitter = new EventEmitter<MyEvents>();
 *
 * emitter.on('user-login', (data) => {
 *   // data is typed as { userId: string; timestamp: number }
 *   console.log(`User ${data.userId} logged in at ${data.timestamp}`);
 * });
 *
 * emitter.emit('user-login', { userId: '123', timestamp: Date.now() });
 * ```
 */
export class EventEmitter<T extends EventMap = EventMap> {
  #listeners: Partial<{
    [K in keyof T]: Array<EventListener<T[K]>>;
  }> = {};

  #onceListeners: Partial<{
    [K in keyof T]: Array<EventListenerOnce<T[K]>>;
  }> = {};

  /**
   * Adds a listener for the specified event
   *
   * @param event - The event name
   * @param listener - The listener function
   * @returns The EventEmitter instance for chaining
   */
  on<K extends keyof T>(event: K, listener: EventListener<T[K]>): this {
    if (!this.#listeners[event]) {
      this.#listeners[event] = [];
    }
    this.#listeners[event]!.push(listener);
    return this;
  }

  /**
   * Adds a one-time listener for the specified event
   * The listener will be automatically removed after being called once
   *
   * @param event - The event name
   * @param listener - The listener function
   * @returns The EventEmitter instance for chaining
   */
  once<K extends keyof T>(event: K, listener: EventListenerOnce<T[K]>): this {
    if (!this.#onceListeners[event]) {
      this.#onceListeners[event] = [];
    }
    this.#onceListeners[event]!.push(listener);
    return this;
  }

  /**
   * Removes a listener for the specified event
   *
   * @param event - The event name
   * @param listener - The listener function to remove
   * @returns The EventEmitter instance for chaining
   */
  off<K extends keyof T>(event: K, listener: EventListener<T[K]>): this {
    const eventListeners = this.#listeners[event];
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }

    const eventOnceListeners = this.#onceListeners[event];
    if (eventOnceListeners) {
      const index = eventOnceListeners.indexOf(listener);
      if (index > -1) {
        eventOnceListeners.splice(index, 1);
      }
    }

    return this;
  }

  /**
   * Removes all listeners for the specified event
   * If no event is specified, removes all listeners for all events
   *
   * @param event - Optional event name. If not provided, all listeners are removed
   * @returns The EventEmitter instance for chaining
   */
  removeAllListeners<K extends keyof T>(event?: K): this {
    if (event) {
      delete this.#listeners[event];
      delete this.#onceListeners[event];
    } else {
      this.#listeners = {};
      this.#onceListeners = {};
    }
    return this;
  }

  /**
   * Emits an event with the specified data
   * All registered listeners (both regular and once) will be called
   *
   * @param event - The event name
   * @param data - The event payload
   * @returns The EventEmitter instance for chaining
   */
  emit<K extends keyof T>(event: K, data: T[K]): this {
    // Call regular listeners
    const eventListeners = this.#listeners[event];
    if (eventListeners) {
      // Create a copy to avoid issues if listeners are modified during iteration
      const listenersToCall = [...eventListeners];
      listenersToCall.forEach((listener) => listener(data));
    }

    // Call once listeners and remove them
    const eventOnceListeners = this.#onceListeners[event];
    if (eventOnceListeners) {
      const listenersToCall = [...eventOnceListeners];
      // Clear once listeners before calling them
      delete this.#onceListeners[event];
      listenersToCall.forEach((listener) => listener(data));
    }

    return this;
  }

  /**
   * Returns the number of listeners for the specified event
   *
   * @param event - The event name
   * @returns The number of listeners
   */
  listenerCount<K extends keyof T>(event: K): number {
    const regularCount = this.#listeners[event]?.length || 0;
    const onceCount = this.#onceListeners[event]?.length || 0;
    return regularCount + onceCount;
  }

  /**
   * Returns an array of event names that have listeners
   *
   * @returns Array of event names
   */
  eventNames(): Array<keyof T> {
    const regularEvents = Object.keys(this.#listeners) as Array<keyof T>;
    const onceEvents = Object.keys(this.#onceListeners) as Array<keyof T>;

    // Manual deduplication without using Set
    const allEvents = [...regularEvents, ...onceEvents];
    const uniqueEvents: Array<keyof T> = [];
    for (const event of allEvents) {
      if (uniqueEvents.indexOf(event) === -1) {
        uniqueEvents.push(event);
      }
    }
    return uniqueEvents;
  }

  /**
   * Returns a copy of the array of listeners for the specified event
   *
   * @param event - The event name
   * @returns Array of listeners
   */
  getListeners<K extends keyof T>(event: K): Array<EventListener<T[K]>> {
    const regularListeners = this.#listeners[event] || [];
    const onceListeners = this.#onceListeners[event] || [];
    return [...regularListeners, ...onceListeners];
  }
}

/**
 * Creates a new strongly typed EventEmitter instance
 *
 * @template T - Event map interface defining event names and their payload types
 * @returns A new EventEmitter instance
 */
export function createEventEmitter<
  T extends EventMap = EventMap,
>(): EventEmitter<T> {
  return new EventEmitter<T>();
}
