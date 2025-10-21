import {
  createSet,
  SystemType,
  type App,
  type EcsPlugin,
} from "@atlas/core";

import { AnimationManager } from "./resources/animation-manager";
import { animationUpdateSystem } from "./systems/animation-update";
import { timelineUpdateSystem } from "./systems/timeline-update";
import { controllerUpdateSystem } from "./systems/controller-update";
import {
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

const AnimationUpdateSet = Symbol("Animator::AnimationUpdate");
const TimelineUpdateSet = Symbol("Animator::TimelineUpdate");
const ControllerUpdateSet = Symbol("Animator::ControllerUpdate");

/**
 * AnimatorPlugin provides animation functionality for the ECS
 *
 * Features:
 * - Property animation with easing functions
 * - Timeline sequences with markers and events
 * - Animation controller state machines
 * - Rich event system for animation lifecycle
 * - One-shot animation API via AnimationManager
 *
 * System Execution Order:
 * 1. ControllerUpdate - Updates state machines and evaluates transitions
 * 2. AnimationUpdate - Updates individual animations
 * 3. TimelineUpdate - Updates timeline sequences
 */
export class AnimatorPlugin implements EcsPlugin {
  public async build(app: App): Promise<void> {
    // Create AnimationManager resource
    const animationManager = new AnimationManager();
    app.setResource(animationManager);

    // Register all animation events
    app
      .addEvent(AnimationStartedEvent)
      .addEvent(AnimationCompletedEvent)
      .addEvent(AnimationLoopedEvent)
      .addEvent(AnimationPausedEvent)
      .addEvent(AnimationResumedEvent)
      .addEvent(AnimationStoppedEvent)
      .addEvent(TimelineMarkerEvent)
      .addEvent(TimelineTriggerEvent)
      .addEvent(TimelineCompletedEvent)
      .addEvent(TimelineStartedEvent)
      .addEvent(ControllerStateChangedEvent)
      .addEvent(ControllerParameterChangedEvent);

    // Register systems
    // Controllers run first to update state machines
    app.addSystems(
      SystemType.Update,
      createSet(ControllerUpdateSet, controllerUpdateSystem)
    );

    // Animations run second to update individual property animations
    app.addSystems(
      SystemType.Update,
      createSet(AnimationUpdateSet, animationUpdateSystem)
    );

    // Timelines run last to coordinate multiple animations
    app.addSystems(
      SystemType.Update,
      createSet(TimelineUpdateSet, timelineUpdateSystem)
    );

    // Set up system ordering: Controller -> Animation -> Timeline
    app.addSetBeforeSet(ControllerUpdateSet, [AnimationUpdateSet], SystemType.Update);
    app.addSetBeforeSet(AnimationUpdateSet, [TimelineUpdateSet], SystemType.Update);
  }

  public ready(app: App): boolean {
    // Check that the AnimationManager resource exists
    return app.hasResource(AnimationManager);
  }

  public name(): string {
    return "AnimatorPlugin";
  }
}
