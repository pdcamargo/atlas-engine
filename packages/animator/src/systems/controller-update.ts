import { sys, Time } from "@atlas/core";
import { AnimationController } from "../components/animation-controller";
import { propertyAccessor } from "../property-accessor";
import {
  ControllerStateChangedEvent,
  ControllerParameterChangedEvent,
} from "../events";

/**
 * System that updates all AnimationController components each frame
 *
 * Responsibilities:
 * - Evaluates transition conditions
 * - Manages state transitions
 * - Updates animation values for current state
 * - Fires controller events
 */
export const controllerUpdateSystem = sys(({ commands, events }) => {
  const time = commands.getResource(Time);
  const deltaTime = time.deltaTime;

  // Query all AnimationController components
  const controllers = commands.query(AnimationController).all();

  for (const [entity, controller] of controllers) {
    // Skip if not active
    if (!controller.active) {
      continue;
    }

    // Handle state transitions
    if (controller.isTransitioning()) {
      handleTransition(controller, deltaTime, entity, events);
    } else {
      // Check for transitions from current state
      checkTransitions(controller, entity, events);
    }

    // Update current state animation
    updateStateAnimation(controller, deltaTime);
  }
}).label("Animator::ControllerUpdate");

/**
 * Check if any transitions should occur from the current state
 */
function checkTransitions(
  controller: AnimationController,
  entity: number,
  events: any
): void {
  // Find all transitions from current state
  const availableTransitions = controller.transitions.filter(
    (t) => t.from === controller.currentState
  );

  // Evaluate each transition condition
  for (const transition of availableTransitions) {
    if (transition.condition(controller.parameters)) {
      // Trigger transition
      controller.nextState = transition.to;
      controller.transitionProgress = 0;
      controller.transitionDuration = transition.duration ?? 0;

      // Reset triggers after they're consumed
      // This is a simple approach - triggers that fired this transition get reset
      for (const [key, value] of controller.parameters.entries()) {
        if (value === true && key.startsWith("trigger_")) {
          controller.resetTrigger(key);
        }
      }

      break; // Only process one transition per frame
    }
  }
}

/**
 * Handle an active transition
 */
function handleTransition(
  controller: AnimationController,
  deltaTime: number,
  entity: number,
  events: any
): void {
  if (!controller.nextState) return;

  if (controller.transitionDuration > 0) {
    // Animated transition
    controller.transitionProgress += deltaTime / controller.transitionDuration;

    if (controller.transitionProgress >= 1) {
      // Transition complete
      completeTransition(controller, entity, events);
    } else {
      // Blend between current and next state
      // For now, we'll use a simple linear blend
      // In a more advanced system, you'd blend the animation outputs
      updateStateAnimation(controller, deltaTime * (1 - controller.transitionProgress));
    }
  } else {
    // Instant transition
    completeTransition(controller, entity, events);
  }
}

/**
 * Complete a state transition
 */
function completeTransition(
  controller: AnimationController,
  entity: number,
  events: any
): void {
  if (!controller.nextState) return;

  const fromState = controller.currentState;
  const toState = controller.nextState;

  // Fire state changed event
  events.writer(ControllerStateChangedEvent).send(
    new ControllerStateChangedEvent(entity, fromState, toState)
  );

  // Switch to new state
  controller.currentState = toState;
  controller.nextState = null;
  controller.transitionProgress = 0;

  // Reset the new state's runtime
  const runtime = controller.stateRuntime.get(toState);
  if (runtime) {
    runtime.elapsed = 0;
    runtime.hasStarted = false;
    runtime.startValue = undefined;
  }
}

/**
 * Update animation for the current state
 */
function updateStateAnimation(
  controller: AnimationController,
  deltaTime: number
): void {
  const state = controller.getCurrentState();
  if (!state || !state.animation) {
    return;
  }

  const runtime = controller.getCurrentStateRuntime();
  if (!runtime) {
    return;
  }

  const anim = state.animation;
  const speed = (state.speed ?? 1.0) * controller.speed;

  // Initialize start value if needed
  if (!runtime.hasStarted) {
    runtime.hasStarted = true;
    if (anim.from === undefined) {
      const currentValue = propertyAccessor.get(anim.target, anim.property);
      runtime.startValue = currentValue ?? 0;
    } else {
      runtime.startValue = anim.from;
    }
  }

  // Update elapsed time
  runtime.elapsed += deltaTime * speed;

  // Calculate progress
  let progress = 0;
  if (anim.duration > 0) {
    progress = runtime.elapsed / anim.duration;

    // Handle looping
    if (anim.loop) {
      const loopMode = anim.loop;
      if (progress >= 1) {
        // Simple loop - wrap around
        progress = progress % 1;
        runtime.elapsed = progress * anim.duration;
      }
    } else {
      // Clamp to end
      progress = Math.min(1, progress);
    }
  } else {
    progress = 1;
  }

  // Apply easing if specified
  const easedProgress = anim.easing ? anim.easing(progress) : progress;

  // Calculate and apply value
  const startValue = runtime.startValue ?? 0;
  const value = startValue + (anim.to - startValue) * easedProgress;
  propertyAccessor.set(anim.target, anim.property, value);
}
