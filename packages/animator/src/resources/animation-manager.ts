import type { Commands } from "@atlas/core";
import { Animation } from "../components/animation";
import type { EasingFunction } from "../types";
import { LoopMode } from "../types";
import { linear } from "../easing/functions";

/**
 * Options for creating a one-shot animation
 */
export interface OneShotAnimationOptions {
  /** Target object to animate */
  target: any;
  /** Property path to animate */
  property: string;
  /** Starting value (optional, will use current value) */
  from?: number;
  /** Target value */
  to: number;
  /** Duration in seconds */
  duration: number;
  /** Delay before starting in seconds */
  delay?: number;
  /** Easing function */
  easing?: EasingFunction;
  /** Loop mode */
  loopMode?: LoopMode;
  /** Speed multiplier */
  speed?: number;
}

/**
 * AnimationManager resource provides utilities for managing animations globally
 *
 * Features:
 * - Create one-shot animations (fire-and-forget)
 * - Global time scale for all animations
 * - Statistics and debugging
 */
export class AnimationManager {
  /** Global time scale multiplier (affects all animations) */
  public timeScale: number = 1.0;

  /** Total number of animations created this session */
  private totalAnimationsCreated: number = 0;

  /** Total number of animations completed this session */
  private totalAnimationsCompleted: number = 0;

  /**
   * Create a one-shot animation that auto-removes when complete
   *
   * This is a convenience method for creating simple animations without
   * manually managing component lifecycle.
   *
   * @param commands - ECS Commands instance
   * @param options - Animation options
   * @returns The entity ID containing the animation component
   */
  public createAnimation(
    commands: Commands,
    options: OneShotAnimationOptions
  ): number {
    const animation = new Animation({
      target: options.target,
      property: options.property,
      from: options.from,
      to: options.to,
      duration: options.duration,
      delay: options.delay ?? 0,
      easing: options.easing ?? linear,
      loopMode: options.loopMode ?? LoopMode.Once,
      autoPlay: true,
      autoRemove: true,
      speed: options.speed ?? 1.0,
    });

    const entity = commands.spawn(animation).id();
    this.totalAnimationsCreated++;

    return entity;
  }

  /**
   * Create multiple animations at once
   *
   * @param commands - ECS Commands instance
   * @param animations - Array of animation options
   * @returns Array of entity IDs
   */
  public createAnimations(
    commands: Commands,
    animations: OneShotAnimationOptions[]
  ): number[] {
    return animations.map((opts) => this.createAnimation(commands, opts));
  }

  /**
   * Get statistics about animation usage
   */
  public getStats(): {
    created: number;
    completed: number;
    active: number;
  } {
    return {
      created: this.totalAnimationsCreated,
      completed: this.totalAnimationsCompleted,
      active: this.totalAnimationsCreated - this.totalAnimationsCompleted,
    };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.totalAnimationsCreated = 0;
    this.totalAnimationsCompleted = 0;
  }

  /**
   * @internal
   * Called by the animation system when an animation completes
   */
  public _onAnimationCompleted(): void {
    this.totalAnimationsCompleted++;
  }
}
