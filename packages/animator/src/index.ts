// Plugin
export { AnimatorPlugin } from "./plugin";

// Components
export {
  Animation,
  Timeline,
  AnimationController,
} from "./components";

// Resources
export { AnimationManager } from "./resources";
export type { OneShotAnimationOptions } from "./resources/animation-manager";

// Events
export {
  AnimationStartedEvent,
  AnimationCompletedEvent,
  AnimationLoopedEvent,
  AnimationPausedEvent,
  AnimationResumedEvent,
  AnimationStoppedEvent,
  TimelineMarkerEvent,
  TimelineTriggerEvent,
  TimelineCompletedEvent,
  TimelineStartedEvent,
  ControllerStateChangedEvent,
  ControllerParameterChangedEvent,
} from "./events";

// Easing
export { Easing } from "./easing";
export type { EasingFunction } from "./types";

// Types
export {
  AnimationState,
  LoopMode,
} from "./types";
export type {
  AnimationTrack,
  TimelineMarker,
  ControllerState,
  ControllerTransition,
  PropertyAccessor,
} from "./types";

// Systems (exported for advanced users who want to customize)
export {
  animationUpdateSystem,
  timelineUpdateSystem,
  controllerUpdateSystem,
} from "./systems";

// Property accessor utilities
export { propertyAccessor, DefaultPropertyAccessor } from "./property-accessor";
