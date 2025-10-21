import type { Entity } from "@atlas/core";

/**
 * Event fired when an animation starts playing
 */
export class AnimationStartedEvent {
  constructor(
    public readonly entity: Entity,
    public readonly animationId: string
  ) {}
}

/**
 * Event fired when an animation completes (non-looping)
 */
export class AnimationCompletedEvent {
  constructor(
    public readonly entity: Entity,
    public readonly animationId: string
  ) {}
}

/**
 * Event fired when a looping animation completes one cycle
 */
export class AnimationLoopedEvent {
  constructor(
    public readonly entity: Entity,
    public readonly animationId: string,
    public readonly loopCount: number
  ) {}
}

/**
 * Event fired when an animation is paused
 */
export class AnimationPausedEvent {
  constructor(
    public readonly entity: Entity,
    public readonly animationId: string
  ) {}
}

/**
 * Event fired when an animation is resumed
 */
export class AnimationResumedEvent {
  constructor(
    public readonly entity: Entity,
    public readonly animationId: string
  ) {}
}

/**
 * Event fired when an animation is stopped
 */
export class AnimationStoppedEvent {
  constructor(
    public readonly entity: Entity,
    public readonly animationId: string
  ) {}
}
