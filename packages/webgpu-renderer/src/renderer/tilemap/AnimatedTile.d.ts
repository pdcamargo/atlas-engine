import { Rect } from "@atlas/core";
import { Tile } from "./Tile";
/**
 * Represents a single frame in a tile animation
 */
export declare class TileAnimationFrame {
    frame: Rect;
    duration: number;
    constructor(frame: Rect, duration?: number);
    /**
     * Create a TileAnimationFrame from pixel coordinates
     */
    static fromPixels(x: number, y: number, width: number, height: number, textureWidth: number, textureHeight: number, duration?: number): TileAnimationFrame;
}
/**
 * Configuration for creating an animated tile
 */
export interface AnimatedTileConfig {
    /** Unique identifier for this tile */
    id: number | string;
    /** Array of animation frames */
    frames: TileAnimationFrame[];
    /** Whether the animation should loop (default: true) */
    loop?: boolean;
    /** Speed multiplier (1.0 = normal speed, 2.0 = double speed, etc.) */
    speed?: number;
    /** Optional metadata */
    metadata?: Record<string, any>;
}
/**
 * AnimatedTile extends Tile to support frame-based animations
 * Used for animated tiles like water, torches, lava, etc.
 */
export declare class AnimatedTile extends Tile {
    readonly frames: TileAnimationFrame[];
    readonly loop: boolean;
    readonly speed: number;
    private currentFrameIndex;
    private elapsedTime;
    constructor(config: AnimatedTileConfig);
    /**
     * Update animation state based on delta time
     * @param deltaTime Time elapsed since last update in seconds
     * @returns true if the frame changed, false otherwise
     */
    updateAnimation(deltaTime: number): boolean;
    /**
     * Get the current animation frame
     */
    getCurrentFrame(): TileAnimationFrame;
    /**
     * Get the current frame index
     */
    getCurrentFrameIndex(): number;
    /**
     * Reset animation to the first frame
     */
    reset(): void;
    /**
     * Get the total duration of the animation in milliseconds
     */
    getTotalDuration(): number;
    /**
     * Check if this is an animated tile (always returns true for AnimatedTile)
     */
    isAnimated(): boolean;
}
//# sourceMappingURL=AnimatedTile.d.ts.map