import type { Handle } from "@atlas/core";
import type { AudioClip } from "../assets/audio-clip";

/**
 * AudioSource component for playing audio in the ECS
 *
 * Supports spatial audio (2D) and routing through audio buses
 */
export class AudioSource {
  /** The audio clip to play */
  clip: Handle<AudioClip>;

  /** Which bus to route audio through (e.g., "master", "sfx", "music") */
  bus: string;

  /** Whether the audio is currently playing */
  playing: boolean;

  /** Whether to loop the audio */
  loop: boolean;

  /** Source-specific volume (0-1) */
  volume: number;

  /** 2D position for spatial audio */
  position: { x: number; y: number };

  /** Spatial blend: 0 = no spatialization, 1 = full spatial (0-1) */
  spatialBlend: number;

  /** @internal WebAudio source node (recreated each time sound plays) */
  sourceNode?: AudioBufferSourceNode;

  /** @internal WebAudio gain node for volume control */
  gainNode?: GainNode;

  /** @internal WebAudio panner node for spatial audio */
  pannerNode?: PannerNode;

  /** @internal Track if this source has finished playing (for non-looping sounds) */
  finished: boolean;

  /** @internal Track the start time for resuming */
  startTime: number;

  /** @internal Track playback offset for pause/resume */
  pausedAt: number;

  constructor(options: {
    clip: Handle<AudioClip>;
    bus?: string;
    playing?: boolean;
    loop?: boolean;
    volume?: number;
    position?: { x: number; y: number } | undefined;
    spatialBlend?: number;
  }) {
    this.clip = options.clip;
    this.bus = options.bus ?? "master";
    this.playing = options.playing ?? false;
    this.loop = options.loop ?? false;
    this.volume = options.volume ?? 1.0;
    // Ensure position is always a valid object, even if undefined is passed
    this.position =
      options.position !== undefined ? options.position : { x: 0, y: 0 };
    this.spatialBlend = options.spatialBlend ?? 0;
    this.finished = false;
    this.startTime = 0;
    this.pausedAt = 0;
  }
}
