import type { Entity } from "@atlas/core";

/**
 * Easing function signature
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export type EasingFunction = (t: number) => number;

/**
 * Animation state
 */
export enum AnimationState {
  Idle = "Idle",
  Playing = "Playing",
  Paused = "Paused",
  Completed = "Completed",
}

/**
 * Loop mode for animations
 */
export enum LoopMode {
  /** Play once and stop */
  Once = "Once",
  /** Loop continuously */
  Loop = "Loop",
  /** Play forward then backward (ping-pong) */
  PingPong = "PingPong",
}

/**
 * Animation track for timelines
 */
export interface AnimationTrack {
  /** Target object to animate */
  target: any;
  /** Property path to animate (supports nested: "position.x") */
  property: string;
  /** Starting value (optional, will use current value if not specified) */
  from?: number;
  /** Target value */
  to: number;
  /** Duration in seconds */
  duration: number;
  /** Delay before starting in seconds */
  delay?: number;
  /** Easing function */
  easing?: EasingFunction;
}

/**
 * Timeline marker for events
 */
export interface TimelineMarker {
  /** Time in seconds when marker is reached */
  time: number;
  /** Name of the marker */
  name: string;
  /** Optional event class to fire */
  eventClass?: new (entity: Entity, markerName: string) => any;
}

/**
 * Animation controller state
 */
export interface ControllerState {
  /** Name of the state */
  name: string;
  /** Animation to play in this state */
  animation?: {
    target: any;
    property: string;
    from?: number;
    to: number;
    duration: number;
    easing?: EasingFunction;
    loop?: LoopMode;
  };
  /** Speed multiplier for this state */
  speed?: number;
}

/**
 * Animation controller transition
 */
export interface ControllerTransition {
  /** Source state name */
  from: string;
  /** Target state name */
  to: string;
  /** Condition function to evaluate */
  condition: (params: Map<string, any>) => boolean;
  /** Transition duration in seconds */
  duration?: number;
}

/**
 * Property accessor interface for animation targets
 */
export interface PropertyAccessor {
  get(target: any, path: string): number | undefined;
  set(target: any, path: string, value: number): void;
}
