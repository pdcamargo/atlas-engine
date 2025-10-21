import type { AnimationTrack, TimelineMarker } from "../types";
import { AnimationState, LoopMode } from "../types";

/**
 * Internal track state for timeline playback
 */
interface TrackState {
  track: AnimationTrack;
  startValue: number | undefined;
  startTime: number;
  endTime: number;
  hasStarted: boolean;
  hasCompleted: boolean;
}

/**
 * Timeline component for orchestrating multiple animations and events
 *
 * A timeline allows you to create complex animation sequences with:
 * - Multiple parallel or sequential animation tracks
 * - Time markers that fire events at specific times
 * - Precise timing control
 * - Looping support for entire sequences
 */
export class Timeline {
  /** Animation tracks */
  public tracks: AnimationTrack[];

  /** Timeline markers for events */
  public markers: TimelineMarker[];

  /** Current playback time in seconds */
  public time: number;

  /** Total duration of the timeline in seconds */
  public duration: number;

  /** Current state */
  public state: AnimationState;

  /** Loop mode */
  public loopMode: LoopMode;

  /** Speed multiplier */
  public speed: number;

  /** Whether to auto-remove this component when complete */
  public autoRemove: boolean;

  /** Number of times the timeline has looped */
  public loopCount: number;

  /** @internal Track states for managing playback */
  public trackStates: TrackState[];

  /** @internal Set of marker indices that have been fired */
  public firedMarkers: Set<number>;

  constructor(options: {
    tracks: AnimationTrack[];
    markers?: TimelineMarker[];
    autoPlay?: boolean;
    loopMode?: LoopMode;
    speed?: number;
    autoRemove?: boolean;
  }) {
    this.tracks = options.tracks;
    this.markers = options.markers ?? [];
    this.time = 0;
    this.state =
      options.autoPlay !== false
        ? AnimationState.Playing
        : AnimationState.Idle;
    this.loopMode = options.loopMode ?? LoopMode.Once;
    this.speed = options.speed ?? 1.0;
    this.autoRemove = options.autoRemove ?? true;
    this.loopCount = 0;
    this.firedMarkers = new Set();

    // Calculate duration and initialize track states
    this.duration = 0;
    this.trackStates = this.tracks.map((track) => {
      const startTime = track.delay ?? 0;
      const endTime = startTime + track.duration;
      if (endTime > this.duration) {
        this.duration = endTime;
      }

      return {
        track,
        startValue: track.from,
        startTime,
        endTime,
        hasStarted: false,
        hasCompleted: false,
      };
    });
  }

  /**
   * Play the timeline
   */
  public play(): void {
    if (this.state === AnimationState.Idle) {
      this.reset();
    }
    this.state = AnimationState.Playing;
  }

  /**
   * Pause the timeline
   */
  public pause(): void {
    if (this.state === AnimationState.Playing) {
      this.state = AnimationState.Paused;
    }
  }

  /**
   * Resume the timeline
   */
  public resume(): void {
    if (this.state === AnimationState.Paused) {
      this.state = AnimationState.Playing;
    }
  }

  /**
   * Stop the timeline and reset to beginning
   */
  public stop(): void {
    this.state = AnimationState.Idle;
    this.reset();
  }

  /**
   * Reset timeline to beginning
   */
  public reset(): void {
    this.time = 0;
    this.loopCount = 0;
    this.firedMarkers.clear();
    for (const trackState of this.trackStates) {
      trackState.hasStarted = false;
      trackState.hasCompleted = false;
    }
  }

  /**
   * Get whether the timeline is playing
   */
  public isPlaying(): boolean {
    return this.state === AnimationState.Playing;
  }

  /**
   * Get whether the timeline is completed
   */
  public isCompleted(): boolean {
    return this.state === AnimationState.Completed;
  }

  /**
   * Get current progress (0-1)
   */
  public getProgress(): number {
    if (this.duration === 0) return 1;
    return Math.min(1, this.time / this.duration);
  }

  /**
   * Seek to a specific time
   */
  public seekTo(time: number): void {
    const oldTime = this.time;
    this.time = Math.max(0, Math.min(this.duration, time));

    // Reset markers that we're seeking backwards past
    if (time < oldTime) {
      this.firedMarkers.clear();
      // Re-fire markers up to the new time
      for (let i = 0; i < this.markers.length; i++) {
        const marker = this.markers[i]!;
        if (marker.time <= this.time) {
          this.firedMarkers.add(i);
        }
      }
    }

    // Reset track states for tracks we're seeking past
    for (const trackState of this.trackStates) {
      if (time < trackState.startTime) {
        trackState.hasStarted = false;
        trackState.hasCompleted = false;
      } else if (time >= trackState.endTime) {
        trackState.hasStarted = true;
        trackState.hasCompleted = true;
      } else {
        trackState.hasStarted = true;
        trackState.hasCompleted = false;
      }
    }
  }
}
