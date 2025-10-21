import type { EasingFunction } from "../types";
import { AnimationState, LoopMode } from "../types";
import { linear } from "../easing/functions";

/**
 * Animation component for animating a single property
 *
 * This component allows you to animate any numeric property on any object
 * with support for easing, looping, and delays.
 */
export class Animation {
  /** Unique identifier for this animation */
  public id: string;

  /** Target object to animate */
  public target: any;

  /** Property path to animate (supports nested: "position.x") */
  public property: string;

  /** Starting value (will be captured from target if not specified) */
  public from: number;

  /** Target value */
  public to: number;

  /** Duration in seconds */
  public duration: number;

  /** Delay before starting in seconds */
  public delay: number;

  /** Easing function */
  public easing: EasingFunction;

  /** Loop mode */
  public loopMode: LoopMode;

  /** Current animation state */
  public state: AnimationState;

  /** Current elapsed time in seconds */
  public elapsed: number;

  /** Time spent in delay */
  public delayElapsed: number;

  /** Number of times the animation has looped */
  public loopCount: number;

  /** Whether to auto-remove this component when animation completes */
  public autoRemove: boolean;

  /** Speed multiplier (1.0 = normal speed) */
  public speed: number;

  /** Whether we're playing in reverse (for ping-pong) */
  public playingReverse: boolean;

  /** Whether the from value has been initialized */
  private fromInitialized: boolean;

  constructor(options: {
    id?: string;
    target: any;
    property: string;
    from?: number;
    to: number;
    duration: number;
    delay?: number;
    easing?: EasingFunction;
    loopMode?: LoopMode;
    autoPlay?: boolean;
    autoRemove?: boolean;
    speed?: number;
  }) {
    this.id = options.id ?? `anim-${Math.random().toString(36).slice(2, 9)}`;
    this.target = options.target;
    this.property = options.property;
    this.from = options.from ?? 0;
    this.to = options.to;
    this.duration = options.duration;
    this.delay = options.delay ?? 0;
    this.easing = options.easing ?? linear;
    this.loopMode = options.loopMode ?? LoopMode.Once;
    this.state =
      options.autoPlay !== false
        ? AnimationState.Playing
        : AnimationState.Idle;
    this.elapsed = 0;
    this.delayElapsed = 0;
    this.loopCount = 0;
    this.autoRemove = options.autoRemove ?? true;
    this.speed = options.speed ?? 1.0;
    this.playingReverse = false;
    this.fromInitialized = options.from !== undefined;
  }

  /**
   * Play the animation
   */
  public play(): void {
    if (this.state === AnimationState.Idle) {
      this.elapsed = 0;
      this.delayElapsed = 0;
      this.loopCount = 0;
    }
    this.state = AnimationState.Playing;
  }

  /**
   * Pause the animation
   */
  public pause(): void {
    if (this.state === AnimationState.Playing) {
      this.state = AnimationState.Paused;
    }
  }

  /**
   * Resume the animation
   */
  public resume(): void {
    if (this.state === AnimationState.Paused) {
      this.state = AnimationState.Playing;
    }
  }

  /**
   * Stop the animation and reset to beginning
   */
  public stop(): void {
    this.state = AnimationState.Idle;
    this.elapsed = 0;
    this.delayElapsed = 0;
    this.loopCount = 0;
    this.playingReverse = false;
  }

  /**
   * Reset the animation to beginning without changing state
   */
  public reset(): void {
    this.elapsed = 0;
    this.delayElapsed = 0;
    this.loopCount = 0;
    this.playingReverse = false;
  }

  /**
   * Get whether the animation is playing
   */
  public isPlaying(): boolean {
    return this.state === AnimationState.Playing;
  }

  /**
   * Get whether the animation is completed
   */
  public isCompleted(): boolean {
    return this.state === AnimationState.Completed;
  }

  /**
   * Get the current progress (0-1)
   */
  public getProgress(): number {
    if (this.duration === 0) return 1;
    return Math.min(1, this.elapsed / this.duration);
  }

  /**
   * Get whether the from value has been initialized
   * @internal
   */
  public isFromInitialized(): boolean {
    return this.fromInitialized;
  }

  /**
   * Mark the from value as initialized
   * @internal
   */
  public markFromInitialized(): void {
    this.fromInitialized = true;
  }
}
