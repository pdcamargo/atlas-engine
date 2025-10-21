import { sys, Time } from "@atlas/core";
import { Animation } from "../components/animation";
import { AnimationState, LoopMode } from "../types";
import { propertyAccessor } from "../property-accessor";
import {
  AnimationStartedEvent,
  AnimationCompletedEvent,
  AnimationLoopedEvent,
} from "../events";

/**
 * System that updates all Animation components each frame
 *
 * Responsibilities:
 * - Updates animation time based on delta time
 * - Applies easing to property values
 * - Handles looping and ping-pong modes
 * - Fires animation events (start, complete, loop)
 * - Auto-removes completed animations if configured
 */
export const animationUpdateSystem = sys(({ commands, events }) => {
  const time = commands.getResource(Time);
  const deltaTime = time.deltaTime;

  // Track animations that should be removed
  const toRemove: Array<[number, Animation]> = [];

  // Query all Animation components
  const animations = commands.query(Animation).all();

  for (const [entity, animation] of animations) {
    // Skip if not playing
    if (animation.state !== AnimationState.Playing) {
      continue;
    }

    // Handle delay
    if (animation.delayElapsed < animation.delay) {
      animation.delayElapsed += deltaTime * animation.speed;
      if (animation.delayElapsed < animation.delay) {
        continue;
      }
      // Delay just finished, fire started event
      events.writer(AnimationStartedEvent).send(
        new AnimationStartedEvent(entity, animation.id)
      );
    }

    // Initialize from value if needed
    if (!animation.isFromInitialized()) {
      const currentValue = propertyAccessor.get(
        animation.target,
        animation.property
      );
      if (currentValue !== undefined) {
        animation.from = currentValue;
        animation.markFromInitialized();
      }
    }

    // Track previous elapsed time to detect loops
    const wasElapsed = animation.elapsed;

    // Update elapsed time
    animation.elapsed += deltaTime * animation.speed;

    // Calculate progress (0-1)
    let progress = 0;
    if (animation.duration > 0) {
      progress = animation.elapsed / animation.duration;
    } else {
      progress = 1;
    }

    // Handle animation completion/looping
    if (progress >= 1) {
      switch (animation.loopMode) {
        case LoopMode.Once:
          // Clamp to end
          progress = 1;
          animation.state = AnimationState.Completed;

          // Apply final value
          applyAnimationValue(animation, progress);

          // Fire completed event
          events.writer(AnimationCompletedEvent).send(
            new AnimationCompletedEvent(entity, animation.id)
          );

          // Mark for removal if configured
          if (animation.autoRemove) {
            toRemove.push([entity, animation]);
          }
          continue;

        case LoopMode.Loop:
          // Loop back to beginning
          const loops = Math.floor(progress);
          progress = progress - loops;
          animation.elapsed = progress * animation.duration;

          // Fire loop event for each loop
          for (let i = 0; i < loops; i++) {
            animation.loopCount++;
            events.writer(AnimationLoopedEvent).send(
              new AnimationLoopedEvent(entity, animation.id, animation.loopCount)
            );
          }
          break;

        case LoopMode.PingPong:
          // Calculate which direction we're going
          const totalProgress = progress;
          const cycle = Math.floor(totalProgress);
          const isReverse = cycle % 2 === 1;

          // If we just crossed a boundary, fire loop event
          if (Math.floor(wasElapsed / animation.duration) !== cycle) {
            animation.loopCount++;
            events.writer(AnimationLoopedEvent).send(
              new AnimationLoopedEvent(entity, animation.id, animation.loopCount)
            );
          }

          animation.playingReverse = isReverse;
          progress = totalProgress - cycle;
          if (isReverse) {
            progress = 1 - progress;
          }
          animation.elapsed = totalProgress * animation.duration;
          break;
      }
    }

    // Apply eased value to property
    applyAnimationValue(animation, progress);
  }

  // Remove completed animations
  for (const [entity, animation] of toRemove) {
    commands.removeComponent(entity, Animation);
  }
}).label("Animator::AnimationUpdate");

/**
 * Apply animation value to target property
 */
function applyAnimationValue(animation: Animation, progress: number): void {
  // Apply easing
  const easedProgress = animation.easing(progress);

  // Interpolate between from and to
  const value = animation.from + (animation.to - animation.from) * easedProgress;

  // Set the property
  propertyAccessor.set(animation.target, animation.property, value);
}
