import { Sprite } from "./Sprite";
import { Texture } from "./Texture";
import { Rect, Handle, ImageAsset, type EventClass } from "@atlas/core";
/**
 * Represents a single frame in an animation
 */
export declare class AnimationFrame {
    frame: Rect;
    duration: number;
    constructor(frame: Rect, duration?: number);
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
    static fromPixels(x: number, y: number, width: number, height: number, textureWidth: number, textureHeight: number, duration?: number): AnimationFrame;
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
export declare class AnimatedSpriteAnimation {
    frames: AnimationFrame[];
    loop: boolean;
    speed: number;
    texture?: Texture | Handle<ImageAsset>;
    onStart?: EventClass<any>;
    onEnd?: EventClass<any>;
    onLoop?: EventClass<any>;
    constructor(config: AnimationConfig);
    /**
     * Get the total duration of the animation in milliseconds
     */
    getTotalDuration(): number;
}
/**
 * Playback state for the animated sprite
 */
export declare enum AnimatedSpriteAnimationState {
    Playing = 0,
    Paused = 1,
    Stopped = 2
}
/**
 * AnimatedSprite class for rendering animated sprites
 * Extends Sprite and adds animation playback capabilities
 */
export declare class AnimatedSprite extends Sprite {
    private animations;
    private currentAnimationName;
    private currentFrameIndex;
    private elapsedTime;
    private state;
    private hasStartEventFired;
    constructor(texture?: Texture | Handle<ImageAsset> | null, width?: number, height?: number, id?: string);
    /**
     * Add an animation to this sprite
     */
    addAnimation(name: string, animation: AnimatedSpriteAnimation): void;
    /**
     * Remove an animation from this sprite
     */
    removeAnimation(name: string): void;
    /**
     * Get an animation by name
     */
    getAnimation(name: string): AnimatedSpriteAnimation | undefined;
    /**
     * Check if an animation exists
     */
    hasAnimation(name: string): boolean;
    /**
     * Play an animation by name
     * @param name The name of the animation to play
     * @param reset If true, restart the animation from the beginning even if already playing
     */
    play(name: string, reset?: boolean): boolean;
    /**
     * Stop the current animation and reset to first frame
     */
    stop(): void;
    /**
     * Pause the current animation
     */
    pause(): void;
    /**
     * Resume the current animation if paused
     */
    resume(): void;
    /**
     * Get the current animation
     */
    getCurrentAnimation(): AnimatedSpriteAnimation | null;
    /**
     * Get the current animation name
     */
    getCurrentAnimationName(): string | null;
    /**
     * Get the current playback state
     */
    getState(): AnimatedSpriteAnimationState;
    /**
     * Check if the animation is currently playing
     */
    isPlaying(): boolean;
    /**
     * Check if the animation is paused
     */
    isPaused(): boolean;
    /**
     * Check if the animation is stopped
     */
    isStopped(): boolean;
    /**
     * Get the current frame index
     */
    getCurrentFrameIndex(): number;
    /**
     * Get elapsed time in current frame
     */
    getElapsedTime(): number;
    /**
     * Get the effective texture for the current animation
     * Returns animation's texture if set, otherwise the sprite's base texture
     * Throws if no texture is available
     */
    getEffectiveTexture(): Texture | Handle<ImageAsset> | null;
    /**
     * Check if start event has been fired for current playback
     */
    shouldFireStartEvent(): boolean;
    /**
     * Mark start event as fired
     */
    markStartEventFired(): void;
    /**
     * Update animation state (called by the animation system)
     * @param deltaTime Time elapsed since last update in seconds
     * @returns Object indicating which events should be fired
     */
    updateAnimation(deltaTime: number): {
        shouldFireStart: boolean;
        shouldFireEnd: boolean;
        shouldFireLoop: boolean;
    };
    /**
     * Update the sprite's frame property based on current animation frame
     */
    private updateFrame;
}
//# sourceMappingURL=AnimatedSprite.d.ts.map