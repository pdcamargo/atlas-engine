import { Rect } from "@atlas/core";
import { Tile } from "./Tile";

/**
 * Represents a single frame in a tile animation
 */
export class TileAnimationFrame {
  constructor(
    public frame: Rect,
    public duration: number = 100 // Duration in milliseconds
  ) {}

  /**
   * Create a TileAnimationFrame from pixel coordinates
   */
  static fromPixels(
    x: number,
    y: number,
    width: number,
    height: number,
    textureWidth: number,
    textureHeight: number,
    duration: number = 100
  ): TileAnimationFrame {
    return new TileAnimationFrame(
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
export class AnimatedTile extends Tile {
  public readonly frames: TileAnimationFrame[];
  public readonly loop: boolean;
  public readonly speed: number;

  private currentFrameIndex: number = 0;
  private elapsedTime: number = 0;

  constructor(config: AnimatedTileConfig) {
    // Initialize base Tile with the first frame
    super(
      config.id,
      config.frames[0]?.frame || new Rect(0, 0, 1, 1),
      config.metadata
    );

    this.frames = config.frames;
    this.loop = config.loop ?? true;
    this.speed = config.speed ?? 1.0;
  }

  /**
   * Update animation state based on delta time
   * @param deltaTime Time elapsed since last update in seconds
   * @returns true if the frame changed, false otherwise
   */
  updateAnimation(deltaTime: number): boolean {
    if (this.frames.length <= 1) {
      return false; // No animation needed for single-frame tiles
    }

    // Convert deltaTime to milliseconds and apply speed multiplier
    const deltaMs = deltaTime * 1000 * this.speed;
    this.elapsedTime += deltaMs;

    const currentFrame = this.frames[this.currentFrameIndex];
    if (!currentFrame) return false;

    let frameChanged = false;

    // Check if we need to advance to next frame
    while (this.elapsedTime >= currentFrame.duration) {
      this.elapsedTime -= currentFrame.duration;
      this.currentFrameIndex++;
      frameChanged = true;

      // Check if animation has finished
      if (this.currentFrameIndex >= this.frames.length) {
        if (this.loop) {
          this.currentFrameIndex = 0;
        } else {
          // Animation ended, stay on last frame
          this.currentFrameIndex = this.frames.length - 1;
          this.elapsedTime = 0;
          break;
        }
      }

      // Update the base Tile's frame property
      this.frame = this.frames[this.currentFrameIndex].frame;

      // Prevent infinite loops in case of zero-duration frames
      if (this.frames[this.currentFrameIndex]?.duration === 0) {
        break;
      }
    }

    return frameChanged;
  }

  /**
   * Get the current animation frame
   */
  getCurrentFrame(): TileAnimationFrame {
    return this.frames[this.currentFrameIndex] || this.frames[0];
  }

  /**
   * Get the current frame index
   */
  getCurrentFrameIndex(): number {
    return this.currentFrameIndex;
  }

  /**
   * Reset animation to the first frame
   */
  reset(): void {
    this.currentFrameIndex = 0;
    this.elapsedTime = 0;
    this.frame = this.frames[0]?.frame || this.frame;
  }

  /**
   * Get the total duration of the animation in milliseconds
   */
  getTotalDuration(): number {
    return this.frames.reduce((sum, frame) => sum + frame.duration, 0);
  }

  /**
   * Check if this is an animated tile (always returns true for AnimatedTile)
   */
  isAnimated(): boolean {
    return true;
  }
}
