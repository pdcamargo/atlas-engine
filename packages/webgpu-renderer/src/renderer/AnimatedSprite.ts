import { Sprite } from "./Sprite";
import { Texture } from "./Texture";
import { Rect, Color, Handle, ImageAsset, type EventClass } from "@atlas/core";

/**
 * Represents a single frame in an animation
 */
export class AnimationFrame {
  constructor(
    public frame: Rect,
    public duration: number = 100 // Duration in milliseconds
  ) {}

  /**
   * Create an AnimationFrame from pixel coordinates
   * @param x X position in pixels
   * @param y Y position in pixels
   * @param width Width in pixels
   * @param height Height in pixels
   * @param textureWidth Total texture width in pixels
   * @param textureHeight Total texture height in pixels
   * @param duration Frame duration in milliseconds
   */
  static fromPixels(
    x: number,
    y: number,
    width: number,
    height: number,
    textureWidth: number,
    textureHeight: number,
    duration: number = 100
  ): AnimationFrame {
    return new AnimationFrame(
      new Rect(
        x / textureWidth,
        y / textureHeight,
        width / textureWidth,
        height / textureHeight
      ),
      duration
    );
  }
}

/**
 * Configuration for creating an animation
 */
export interface AnimationConfig<TStart = any, TEnd = any, TLoop = any> {
  /** Array of animation frames */
  frames: AnimationFrame[];
  /** Whether the animation should loop */
  loop?: boolean;
  /** Speed multiplier (1.0 = normal speed, 2.0 = double speed, etc.) */
  speed?: number;
  /** Optional texture specific to this animation (overrides sprite's base texture) */
  texture?: Texture | Handle<ImageAsset>;
  /** Optional event class to fire when animation starts */
  onStart?: EventClass<TStart>;
  /** Optional event class to fire when animation ends (non-looping) */
  onEnd?: EventClass<TEnd>;
  /** Optional event class to fire each time animation loops */
  onLoop?: EventClass<TLoop>;
}

/**
 * Represents a single animation with frames and configuration
 */
export class AnimatedSpriteAnimation {
  public frames: AnimationFrame[];
  public loop: boolean;
  public speed: number;
  public texture?: Texture | Handle<ImageAsset>;
  public onStart?: EventClass<any>;
  public onEnd?: EventClass<any>;
  public onLoop?: EventClass<any>;

  constructor(config: AnimationConfig) {
    this.frames = config.frames;
    this.loop = config.loop ?? false;
    this.speed = config.speed ?? 1.0;
    this.texture = config.texture;
    this.onStart = config.onStart;
    this.onEnd = config.onEnd;
    this.onLoop = config.onLoop;
  }

  /**
   * Get the total duration of the animation in milliseconds
   */
  getTotalDuration(): number {
    return this.frames.reduce((sum, frame) => sum + frame.duration, 0);
  }
}

/**
 * Playback state for the animated sprite
 */
export enum AnimatedSpriteAnimationState {
  Playing,
  Paused,
  Stopped,
}

/**
 * AnimatedSprite class for rendering animated sprites
 * Extends Sprite and adds animation playback capabilities
 */
export class AnimatedSprite extends Sprite {
  private animations: Map<string, AnimatedSpriteAnimation> = new Map();
  private currentAnimationName: string | null = null;
  private currentFrameIndex: number = 0;
  private elapsedTime: number = 0;
  private state: AnimatedSpriteAnimationState =
    AnimatedSpriteAnimationState.Stopped;
  private hasStartEventFired: boolean = false;

  constructor(
    texture: Texture | Handle<ImageAsset> | null = null,
    width: number = 1,
    height: number = 1,
    id?: string
  ) {
    super(texture, width, height, id);
  }

  /**
   * Add an animation to this sprite
   */
  addAnimation(name: string, animation: AnimatedSpriteAnimation): void {
    this.animations.set(name, animation);
  }

  /**
   * Remove an animation from this sprite
   */
  removeAnimation(name: string): void {
    this.animations.delete(name);
  }

  /**
   * Get an animation by name
   */
  getAnimation(name: string): AnimatedSpriteAnimation | undefined {
    return this.animations.get(name);
  }

  /**
   * Check if an animation exists
   */
  hasAnimation(name: string): boolean {
    return this.animations.has(name);
  }

  /**
   * Play an animation by name
   * @param name The name of the animation to play
   * @param reset If true, restart the animation from the beginning even if already playing
   */
  play(name: string, reset: boolean = false): boolean {
    if (!this.animations.has(name)) {
      console.warn(`[AnimatedSprite] Animation "${name}" not found`);
      return false;
    }

    const animation = this.animations.get(name)!;
    const shouldReset = reset || this.currentAnimationName !== name;

    // Switch animation
    this.currentAnimationName = name;
    this.state = AnimatedSpriteAnimationState.Playing;

    // Update texture if animation has its own texture
    if (animation.texture) {
      this.texture = animation.texture;
      // Remove TextureSynced marker so texture loading system processes it
      (this as any)._needsTextureSync = true;
    }

    if (shouldReset) {
      this.currentFrameIndex = 0;
      this.elapsedTime = 0;
      this.hasStartEventFired = false;
      this.updateFrame();
    }

    return true;
  }

  /**
   * Stop the current animation and reset to first frame
   */
  stop(): void {
    this.state = AnimatedSpriteAnimationState.Stopped;
    this.currentFrameIndex = 0;
    this.elapsedTime = 0;
    this.hasStartEventFired = false;
    this.updateFrame();
  }

  /**
   * Pause the current animation
   */
  pause(): void {
    if (this.state === AnimatedSpriteAnimationState.Playing) {
      this.state = AnimatedSpriteAnimationState.Paused;
    }
  }

  /**
   * Resume the current animation if paused
   */
  resume(): void {
    if (this.state === AnimatedSpriteAnimationState.Paused) {
      this.state = AnimatedSpriteAnimationState.Playing;
    }
  }

  /**
   * Get the current animation
   */
  getCurrentAnimation(): AnimatedSpriteAnimation | null {
    if (!this.currentAnimationName) return null;
    return this.animations.get(this.currentAnimationName) ?? null;
  }

  /**
   * Get the current animation name
   */
  getCurrentAnimationName(): string | null {
    return this.currentAnimationName;
  }

  /**
   * Get the current playback state
   */
  getState(): AnimatedSpriteAnimationState {
    return this.state;
  }

  /**
   * Check if the animation is currently playing
   */
  isPlaying(): boolean {
    return this.state === AnimatedSpriteAnimationState.Playing;
  }

  /**
   * Check if the animation is paused
   */
  isPaused(): boolean {
    return this.state === AnimatedSpriteAnimationState.Paused;
  }

  /**
   * Check if the animation is stopped
   */
  isStopped(): boolean {
    return this.state === AnimatedSpriteAnimationState.Stopped;
  }

  /**
   * Get the current frame index
   */
  getCurrentFrameIndex(): number {
    return this.currentFrameIndex;
  }

  /**
   * Get elapsed time in current frame
   */
  getElapsedTime(): number {
    return this.elapsedTime;
  }

  /**
   * Get the effective texture for the current animation
   * Returns animation's texture if set, otherwise the sprite's base texture
   * Throws if no texture is available
   */
  getEffectiveTexture(): Texture | Handle<ImageAsset> | null {
    const animation = this.getCurrentAnimation();

    // If there's a current animation with its own texture, use it
    if (animation?.texture) {
      return animation.texture;
    }

    // Fall back to base sprite texture
    if (this.texture) {
      return this.texture;
    }

    // No texture available - this will be caught during rendering
    if (animation && !this.texture) {
      throw new Error(
        `[AnimatedSprite] Animation "${this.currentAnimationName}" has no texture, and sprite has no base texture. ` +
          `Either set a texture on the AnimatedSprite or provide a texture in the animation config.`
      );
    }

    return null;
  }

  /**
   * Check if start event has been fired for current playback
   */
  shouldFireStartEvent(): boolean {
    return !this.hasStartEventFired;
  }

  /**
   * Mark start event as fired
   */
  markStartEventFired(): void {
    this.hasStartEventFired = true;
  }

  /**
   * Update animation state (called by the animation system)
   * @param deltaTime Time elapsed since last update in seconds
   * @returns Object indicating which events should be fired
   */
  updateAnimation(deltaTime: number): {
    shouldFireStart: boolean;
    shouldFireEnd: boolean;
    shouldFireLoop: boolean;
  } {
    const result = {
      shouldFireStart: false,
      shouldFireEnd: false,
      shouldFireLoop: false,
    };

    if (
      this.state !== AnimatedSpriteAnimationState.Playing ||
      !this.currentAnimationName
    ) {
      return result;
    }

    const animation = this.animations.get(this.currentAnimationName);
    if (!animation || animation.frames.length === 0) {
      return result;
    }

    // Check if we should fire start event
    if (!this.hasStartEventFired && animation.onStart) {
      result.shouldFireStart = true;
      this.hasStartEventFired = true;
    }

    // Convert deltaTime to milliseconds and apply speed multiplier
    const deltaMs = deltaTime * 1000 * animation.speed;
    this.elapsedTime += deltaMs;

    const currentFrame = animation.frames[this.currentFrameIndex];
    if (!currentFrame) return result;

    // Check if we need to advance to next frame
    while (this.elapsedTime >= currentFrame.duration) {
      this.elapsedTime -= currentFrame.duration;
      this.currentFrameIndex++;

      // Check if animation has finished
      if (this.currentFrameIndex >= animation.frames.length) {
        if (animation.loop) {
          this.currentFrameIndex = 0;
          result.shouldFireLoop = true;
        } else {
          // Animation ended
          this.currentFrameIndex = animation.frames.length - 1;
          this.state = AnimatedSpriteAnimationState.Stopped;
          result.shouldFireEnd = true;
          this.updateFrame();
          return result;
        }
      }

      this.updateFrame();

      // Prevent infinite loops in case of zero-duration frames
      if (animation.frames[this.currentFrameIndex]?.duration === 0) {
        break;
      }
    }

    return result;
  }

  /**
   * Update the sprite's frame property based on current animation frame
   */
  private updateFrame(): void {
    const animation = this.getCurrentAnimation();
    if (!animation || animation.frames.length === 0) {
      return;
    }

    const frameIndex = Math.min(
      this.currentFrameIndex,
      animation.frames.length - 1
    );
    const animFrame = animation.frames[frameIndex];
    if (animFrame) {
      this.frame = animFrame.frame;
      // Mark sprite as needing GPU data update
      // We set _worldTransformDirty because _dirty gets cleared by updateWorldMatrix() before the batch sees it
      (this as any)._worldTransformDirty = true;
    }
  }
}
