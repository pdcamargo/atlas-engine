import { sys, Time } from "@atlas/core";
import { AnimatedSprite } from "../../renderer/AnimatedSprite";
import { SceneGraph } from "../../renderer/SceneGraph";

/**
 * System that updates all AnimatedSprite instances in scene graphs
 * Advances animation frames based on delta time and emits configured events
 */
export const animationUpdateSystem = sys(({ commands, events }) => {
  const time = commands.getResource(Time);
  const deltaTime = time.deltaTime;

  // Get all scene graphs
  const sceneGraphs = commands.query(SceneGraph).all();

  // Traverse each scene graph to find AnimatedSprite instances
  for (const [entity, sceneGraph] of sceneGraphs) {
    sceneGraph.traverse((node) => {
      if (!(node instanceof AnimatedSprite)) {
        return;
      }

      // Update the animation and get event flags
      const eventFlags = node.updateAnimation(deltaTime);

      // Get current animation to check for event classes
      const currentAnimation = node.getCurrentAnimation();
      if (!currentAnimation) {
        return;
      }

      // Fire start event if configured and flagged
      if (eventFlags.shouldFireStart && currentAnimation.onStart) {
        const EventClass = currentAnimation.onStart;
        const eventInstance = new EventClass(entity, node.getCurrentAnimationName());
        events.writer(EventClass).send(eventInstance);
      }

      // Fire end event if configured and flagged
      if (eventFlags.shouldFireEnd && currentAnimation.onEnd) {
        const EventClass = currentAnimation.onEnd;
        const eventInstance = new EventClass(entity, node.getCurrentAnimationName());
        events.writer(EventClass).send(eventInstance);
      }

      // Fire loop event if configured and flagged
      if (eventFlags.shouldFireLoop && currentAnimation.onLoop) {
        const EventClass = currentAnimation.onLoop;
        const eventInstance = new EventClass(entity, node.getCurrentAnimationName());
        events.writer(EventClass).send(eventInstance);
      }
    });
  }
}).label("WebgpuRenderer::AnimationUpdate");
