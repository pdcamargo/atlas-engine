import { AnimatedSpriteAnimation, AssetServer } from "@atlas/core";

export const characterSprites = {
  idle: {
    up: "/sprites/character/sprites/IDLE/idle_up.png",
    down: "/sprites/character/sprites/IDLE/idle_down.png",
    left: "/sprites/character/sprites/IDLE/idle_left.png",
    right: "/sprites/character/sprites/IDLE/idle_right.png",
  },
  run: {
    up: "/sprites/character/sprites/RUN/run_up.png",
    down: "/sprites/character/sprites/RUN/run_down.png",
    left: "/sprites/character/sprites/RUN/run_left.png",
    right: "/sprites/character/sprites/RUN/run_right.png",
  },
} as const;

export const allCharacterSprites = Object.values(characterSprites).flatMap(
  (anim) => Object.values(anim)
);

export const getCharacterAnimations = (
  assetServer: AssetServer
): Record<string, AnimatedSpriteAnimation> => ({
  idleUp: {
    id: "idleUp",
    frames: Array.from({ length: 8 }).map((_, i) => ({
      duration: 32,
      x: i,
      y: 0,
      width: 96,
      height: 80,
    })),
    loop: true,
    texture: assetServer.loadTexture(characterSprites.idle.up)[0],
  },
  idleDown: {
    id: "idleDown",
    frames: Array.from({ length: 8 }).map((_, i) => ({
      duration: 100,
      x: i,
      y: 0,
      width: 96,
      height: 80,
    })),
    texture: assetServer.loadTexture(characterSprites.idle.down)[0],
  },
  idleLeft: {
    id: "idleLeft",
    frames: Array.from({ length: 8 }).map((_, i) => ({
      duration: 32,
      x: i,
      y: 0,
      width: 96,
      height: 80,
    })),
    texture: assetServer.loadTexture(characterSprites.idle.left)[0],
  },
  idleRight: {
    id: "idleRight",
    frames: Array.from({ length: 8 }).map((_, i) => ({
      duration: 32,
      x: i,
      y: 0,
      width: 96,
      height: 80,
    })),
    texture: assetServer.loadTexture(characterSprites.idle.right)[0],
  },
  runUp: {
    id: "runUp",
    frames: Array.from({ length: 8 }).map((_, i) => ({
      duration: 32,
      x: i,
      y: 0,
      width: 96,
      height: 80,
    })),
    texture: assetServer.loadTexture(characterSprites.run.up)[0],
  },
  runDown: {
    id: "runDown",
    frames: Array.from({ length: 8 }).map((_, i) => ({
      duration: 32,
      x: i,
      y: 0,
      width: 96,
      height: 80,
    })),
    texture: assetServer.loadTexture(characterSprites.run.down)[0],
  },
  runLeft: {
    id: "runLeft",
    frames: Array.from({ length: 8 }).map((_, i) => ({
      duration: 32,
      x: i,
      y: 0,
      width: 96,
      height: 80,
    })),
    texture: assetServer.loadTexture(characterSprites.run.left)[0],
  },
  runRight: {
    id: "runRight",
    frames: Array.from({ length: 8 }).map((_, i) => ({
      duration: 32,
      x: i,
      y: 0,
      width: 96,
      height: 80,
    })),
    texture: assetServer.loadTexture(characterSprites.run.right)[0],
  },
});
