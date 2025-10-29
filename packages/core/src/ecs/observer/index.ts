/**
 * Observer System
 *
 * Provides reactive programming capabilities for the ECS.
 * Observers are callbacks that fire in response to events being triggered.
 *
 * Key features:
 * - Component lifecycle observers (ComponentAdded, ComponentRemoved)
 * - Custom event observers
 * - Entity-scoped observers (only fire for specific entities)
 * - Deferred execution (observers flush at safe boundaries)
 *
 * @module observer
 */

export {
  Trigger,
  ComponentAdded,
  ComponentRemoved,
  type ObserverCallback,
  type ObserverContext,
  type ObserverDescriptor,
  type ObserverLifecycleHook,
} from "./types";

export { ObserverRegistry } from "./registry";
export { ObserverTrigger } from "./trigger";
