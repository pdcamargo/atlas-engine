import { sys, Time, Transform, ViewportResizeEvent } from "../../..";
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

export const resizeRenderer = sys(({ commands, events }) => {
  const resizeEvent = events.reader(ViewportResizeEvent);
  const renderer = commands.getResource(Renderer2D);

  const [resize] = resizeEvent.read() ?? [];

  if (resize) {
    renderer.resize(resize.width, resize.height);
  }
});

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
  const time = commands.getResource(Time);
  const dtMs = time.deltaTime * 1000;
  const animationFrameWriter = events.writer(AnimationFrameChangedEvent);
  const animationFinishedWriter = events.writer(AnimationFinishedEvent);

  commands
    .query(animatedSpritesToUpdateTransformQuery)
    .forEach((_, _transform, animatedSprite) => {
      // Accumulate using engine time delta (milliseconds)
      animatedSprite.frameAccumulator =
        (animatedSprite.frameAccumulator ?? 0) + dtMs;

      // Initialize flags
      let hasChangedFrame = false;
      let hasAnimationFinished = false;

      // Advance frames while enough time has accumulated
      while (
        animatedSprite.isPlaying &&
        animatedSprite.frameAccumulator >= animatedSprite.currentFrame.duration
      ) {
        const previousFrameIndex = animatedSprite.frameIndex;
        const numFrames = animatedSprite.frames!.length;
        animatedSprite.frameAccumulator -= animatedSprite.currentFrame.duration;

        const isLastFrame = previousFrameIndex >= numFrames - 1;
        if (isLastFrame) {
          if (animatedSprite.loop) {
            animatedSprite.frameIndex = 0;
            hasChangedFrame = true;
            hasAnimationFinished = true;
          } else {
            // Stop at last frame; do not advance, do not change frame
            hasAnimationFinished = true;
            animatedSprite.isPlaying = false;
            animatedSprite.frameAccumulator = 0;
            break;
          }
        } else {
          animatedSprite.frameIndex = previousFrameIndex + 1;
          hasChangedFrame = true;
        }
      }

      if (hasChangedFrame) {
        animatedSprite.setTextureForFrame(animatedSprite.frameIndex);
      }

      if (hasChangedFrame && animatedSprite.useFrameEndEvents) {
        const currentAnimation = animatedSprite.currentAnimation;
        const currentFrame = animatedSprite.currentFrame;
        const FrameEventCtor =
          currentFrame.frameEndEventClass ??
          currentAnimation.frameEndEventClass ??
          animatedSprite.frameEndEventClass ??
          AnimationFrameChangedEvent;

        animationFrameWriter.send(
          new FrameEventCtor(
            animatedSprite,
            animatedSprite.frameIndex,
            currentFrame
          )
        );
      }

      if (hasAnimationFinished && animatedSprite.useAnimationEndEvents) {
        const currentAnimation = animatedSprite.currentAnimation;
        const AnimationEventCtor =
          currentAnimation.animationEndEventClass ??
          animatedSprite.animationEndEventClass ??
          AnimationFinishedEvent;

        animationFinishedWriter.send(
          new AnimationEventCtor(animatedSprite, currentAnimation)
        );
      }
    });
}).afterLabel("update-sprites-transform");
