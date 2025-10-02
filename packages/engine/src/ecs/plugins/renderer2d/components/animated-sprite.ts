import * as PIXI from "pixi.js";

import { subTexture } from "../utils";
import { Texture2D } from "../../assets";
import { SceneGraph } from "../resources";
import { SpriteFrame } from "./sprite";

export type AnimationFrame = SpriteFrame & {
  duration: number;
  frameId?: string | number | symbol;
  /** Optional per-frame texture override */
  texture?: Texture2D;
  /** Optional per-frame event override for frame-end */
  frameEndEventClass?: FrameEndEventConstructor;
};

export type AnimationId = string | number | symbol;
export type AnimatedSpriteAnimation = {
  id: AnimationId;
  frames: AnimationFrame[];
  /** Optional per-animation loop flag. Falls back to AnimatedSpriteOptions.loop if undefined */
  loop?: boolean;
  /** Optional per-animation texture override */
  texture?: Texture2D;
  /** Optional per-animation event override for frame-end */
  frameEndEventClass?: FrameEndEventConstructor;
  /** Optional per-animation event override for animation-end */
  animationEndEventClass?: AnimationEndEventConstructor;
};

export type AnimatedSpriteOptions = {
  anchor?: { x: number; y: number };
  animations:
    | Array<AnimatedSpriteAnimation>
    | ReadonlyArray<AnimatedSpriteAnimation>;
  defaultAnimationId?: AnimationId;
  texture?: Texture2D;
  useFrameEndEvents?: boolean;
  useAnimationEndEvents?: boolean;
  /** Default loop behavior if not specified on the animation. Defaults to true */
  loop?: boolean;
  layer?: number;
  /** Default event class to dispatch on frame-end if enabled */
  frameEndEventClass?: FrameEndEventConstructor;
  /** Default event class to dispatch on animation-end if enabled */
  animationEndEventClass?: AnimationEndEventConstructor;
};

export type FrameEndEventConstructor = new (
  animatedSprite: AnimatedSprite,
  newFrameIndex: number,
  newFrame: AnimationFrame
) => any;

export type AnimationEndEventConstructor = new (
  animatedSprite: AnimatedSprite,
  animation: AnimatedSpriteAnimation
) => any;

export class AnimatedSprite {
  #texture: Texture2D | null;
  #sprite?: PIXI.Sprite;
  #animationsById: Map<AnimationId, AnimatedSpriteAnimation> = new Map();
  #currentAnimationId!: AnimationId;
  #tileCache: Map<string, PIXI.Texture> = new Map();
  #options: AnimatedSpriteOptions;
  #layer?: number;

  public frameIndex = 0;
  public frameTimer = 0;
  public frameAccumulator = 0;
  public isPlaying = true;

  constructor(options: AnimatedSpriteOptions) {
    this.#texture = options.texture ?? null;
    this.#options = options;

    if (!options.animations || options.animations.length === 0) {
      throw new Error("AnimatedSprite requires at least one animation");
    }

    for (const anim of options.animations) {
      this.#animationsById.set(anim.id, anim);
    }

    const defaultId = options.defaultAnimationId ?? options.animations[0]!.id;
    if (!this.#animationsById.has(defaultId)) {
      throw new Error("Default animation id not found in animations list");
    }
    this.#currentAnimationId = defaultId;
    this.frameIndex = 0;
    this.frameAccumulator = 0;
    this.isPlaying = true;
    this.#layer = options.layer;
  }

  #resolveTextureFor = (
    animation: AnimatedSpriteAnimation,
    frame?: AnimationFrame
  ): Texture2D => {
    const frameTexture = frame?.texture;
    if (frameTexture) return frameTexture;

    const animationTexture = animation.texture;
    if (animationTexture) return animationTexture;

    if (this.#texture) return this.#texture;

    throw new Error("No texture available for current animation/frame");
  };

  #resolveBaseTextureForFrame = (frameIndex: number): Texture2D => {
    const frame = this.frames?.[frameIndex];
    return this.#resolveTextureFor(this.currentAnimation, frame);
  };

  public get() {
    return this.#sprite!;
  }

  public get useFrameEndEvents() {
    return this.#options.useFrameEndEvents ?? false;
  }

  public get useAnimationEndEvents() {
    return this.#options.useAnimationEndEvents ?? false;
  }

  public get frameEndEventClass() {
    return this.#options.frameEndEventClass;
  }

  public get animationEndEventClass() {
    return this.#options.animationEndEventClass;
  }

  public get frames() {
    return this.currentAnimation.frames;
  }

  public get currentAnimation(): AnimatedSpriteAnimation {
    const anim = this.#animationsById.get(this.#currentAnimationId);
    if (!anim) throw new Error("No current animation set");
    return anim;
  }

  public get loop(): boolean {
    const animLoop = this.currentAnimation.loop;
    const defaultLoop = this.#options.loop ?? true;
    return animLoop ?? defaultLoop;
  }

  public isAttached() {
    return !!this.#sprite?.parent;
  }

  public isAttachable() {
    if (this.isAttached()) return false;

    // Collect all referenced textures (default, animations, frames)
    const textures: Array<Texture2D> = [];
    if (this.#texture) {
      textures.push(this.#texture);
    }

    for (const anim of this.#animationsById.values()) {
      if (anim.texture) {
        textures.push(anim.texture);
      }

      for (const frame of anim.frames) {
        if (frame.texture) {
          textures.push(frame.texture);
        }
      }
    }

    // Ensure at least one texture exists and all are loaded
    if (textures.length === 0) {
      return false;
    }

    return textures.every((t) => t.isLoaded());
  }

  public attachTo(graphOrContainer: SceneGraph) {
    if (!this.isAttachable()) {
      throw new Error("Texture is not loaded");
    }

    const texture = this.getTextureForFrame(this.frameIndex);

    this.#sprite = new PIXI.Sprite({
      texture,
    });

    this.#sprite.pivot = this.#options.anchor ?? {
      x: this.#sprite.width / 2,
      y: this.#sprite.height / 2,
    };

    graphOrContainer.addChild(this.#sprite, this.#layer);
  }

  public get currentFrame() {
    const frame = this.frames?.[this.frameIndex];
    if (!frame) throw new Error("No frame found for index " + this.frameIndex);
    return frame;
  }

  public getTextureForFrame(frameIndex: number) {
    const frame = this.frames?.[frameIndex];
    if (!frame) throw new Error("No frame found for index " + frameIndex);
    const base = this.#resolveBaseTextureForFrame(frameIndex);
    const basePixiTexture = base.get();
    if (!basePixiTexture) {
      throw new Error("Texture is not loaded for current animation/frame");
    }
    return subTexture(
      this.#tileCache,
      basePixiTexture!,
      frame.x * frame.width,
      frame.y * frame.height,
      frame.width,
      frame.height
    );
  }

  public setTextureForFrame(frameIndex: number) {
    const texture = this.getTextureForFrame(frameIndex);

    this.#sprite!.texture = texture;
  }

  public play(animationId: AnimationId) {
    if (!this.#animationsById.has(animationId)) {
      throw new Error("Animation id not found: " + String(animationId));
    }
    this.#currentAnimationId = animationId;
    this.frameIndex = 0;
    this.frameAccumulator = 0;
    this.isPlaying = true;

    if (this.#sprite) {
      this.setTextureForFrame(0);
    }
  }
}
