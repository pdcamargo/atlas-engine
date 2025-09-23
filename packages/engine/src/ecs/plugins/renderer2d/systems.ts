import { sys, Transform } from "../../..";
import { QueryBuilder } from "../../commands";

import {
  AnimatedSprite,
  Camera2D,
  Renderable,
  Sprite,
  TileMap,
} from "./components";
import { Renderer2D, SceneGraph } from "./resources";
import { AnimationFinishedEvent, AnimationFrameChangedEvent } from "./events";

export const spritesToAddQuery = new QueryBuilder(Sprite, Transform).without(
  Renderable
);
export const animatedSpritesToAddQuery = new QueryBuilder(
  AnimatedSprite,
  Transform
).without(Renderable);
export const tilemapsToAddQuery = new QueryBuilder(TileMap).without(Renderable);
export const spritesToUpdateTransformQuery = new QueryBuilder(
  Transform,
  Sprite,
  Renderable
);
export const animatedSpritesToUpdateTransformQuery = new QueryBuilder(
  Transform,
  AnimatedSprite,
  Renderable
);

export const addTileMapToScene = sys(({ commands }) => {
  const sceneGraph = commands.getResource(SceneGraph);

  for (const [entityId, tilemap] of commands.query(tilemapsToAddQuery).all()) {
    if (tilemap.isAttachable()) {
      tilemap.attachTo(sceneGraph);
      commands.addComponent(entityId, new Renderable());
    }
  }
});

export const addSpriteToScene = sys(({ commands }) => {
  const sceneGraph = commands.getResource(SceneGraph);

  for (const [entityId, sprite] of commands.query(spritesToAddQuery).all()) {
    if (sprite.isAttachable()) {
      sprite.attachTo(sceneGraph);
      commands.addComponent(entityId, new Renderable());
    }
  }

  for (const [entityId, animatedSprite] of commands
    .query(animatedSpritesToAddQuery)
    .all()) {
    if (animatedSprite.isAttachable()) {
      animatedSprite.attachTo(sceneGraph);
      commands.addComponent(entityId, new Renderable());
    }
  }
});

export const renderScene = sys(({ commands }) => {
  const sceneGraph = commands.getResource(SceneGraph);
  const [, camera] = commands.tryFind(Camera2D) ?? [];

  if (!camera) {
    return;
  }

  commands.getResource(Renderer2D).render(camera, sceneGraph);
});

export const updateTransforms = sys(({ commands }) => {
  commands
    .query(spritesToUpdateTransformQuery)
    .forEach((_, transform, sprite) => {
      if (transform.isDirty) {
        sprite.get().position.copyFrom(transform.position);
        sprite.get().rotation = transform.rotation * (Math.PI / 180);
        sprite.get().scale.copyFrom(transform.scale);

        transform.isDirty = false;
      }
    });

  commands
    .query(animatedSpritesToUpdateTransformQuery)
    .forEach((_, transform, animatedSprite) => {
      if (transform.isDirty) {
        animatedSprite.get().position.copyFrom(transform.position);
        animatedSprite.get().rotation = transform.rotation * (Math.PI / 180);
        animatedSprite.get().scale.copyFrom(transform.scale);

        transform.isDirty = false;
      }
    });
}).label("update-sprites-transform");

export const updateAnimatedSprites = sys(({ commands, events }) => {
  const now = performance.now();
  const animationFrameWriter = events.writer(AnimationFrameChangedEvent);
  const animationFinishedWriter = events.writer(AnimationFinishedEvent);

  commands
    .query(animatedSpritesToUpdateTransformQuery)
    .forEach((_, _transform, animatedSprite) => {
      // Calculate elapsed time since last update and accumulate it
      const elapsed = now - animatedSprite.frameTimer;
      animatedSprite.frameTimer = now;
      animatedSprite.frameAccumulator =
        (animatedSprite.frameAccumulator ?? 0) + elapsed;

      // Initialize flags
      let hasChangedFrame = false;
      let hasAnimationFinished = false;

      // Advance frames while enough time has accumulated
      while (
        animatedSprite.frameAccumulator >= animatedSprite.currentFrame.duration
      ) {
        const previousFrameIndex = animatedSprite.frameIndex;
        animatedSprite.frameAccumulator -= animatedSprite.currentFrame.duration;
        animatedSprite.frameIndex =
          (animatedSprite.frameIndex + 1) % animatedSprite.frames!.length;

        hasChangedFrame = true;
        // If we looped back to the first frame, animation finished a cycle
        if (animatedSprite.frameIndex === 0 && previousFrameIndex !== 0) {
          hasAnimationFinished = true;
        }
      }

      if (hasChangedFrame) {
        animatedSprite.setTextureForFrame(animatedSprite.frameIndex);
      }

      if (hasChangedFrame) {
        animationFrameWriter.send(
          new AnimationFrameChangedEvent(
            animatedSprite,
            animatedSprite.frameIndex,
            animatedSprite.currentFrame
          )
        );
      }

      if (hasAnimationFinished) {
        animationFinishedWriter.send(
          new AnimationFinishedEvent(animatedSprite)
        );
      }
    });
}).afterLabel("update-sprites-transform");
