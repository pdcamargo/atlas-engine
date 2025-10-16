import type { AssetServer } from "@atlas/core";
import type { AudioClip } from "../assets/audio-clip";
import type { AudioSource } from "../components/audio-source";
import type { AudioBusManager } from "./audio-bus-manager";

/**
 * Options for playing a one-shot sound
 */
export interface PlaySoundOptions {
  /** Which bus to route audio through (default: "master") */
  bus?: string;
  /** Volume level 0-1 (default: 1.0) */
  volume?: number;
  /** 2D position for spatial audio */
  position?: { x: number; y: number };
  /** Listener position for spatial audio calculation */
  listenerPosition?: { x: number; y: number };
  /** Spatial blend: 0 = no spatialization, 1 = full spatial (default: 0) */
  spatialBlend?: number;
}

/**
 * Tracks a one-shot sound that's currently playing
 */
interface PlayingSound {
  sourceNode: AudioBufferSourceNode;
  gainNode: GainNode;
  pannerNode?: PannerNode;
}

/**
 * AudioManager handles one-shot sound effects without creating entities
 *
 * Use this for fire-and-forget sounds like button clicks, gunshots, etc.
 * For persistent audio (music, ambient loops, positional audio on entities),
 * use AudioSource components instead.
 */
export class AudioManager {
  private audioContext: AudioContext;
  private busManager: AudioBusManager;
  private assetServer?: AssetServer;
  private playingSounds: Set<PlayingSound> = new Set();

  constructor(audioContext: AudioContext, busManager: AudioBusManager) {
    this.audioContext = audioContext;
    this.busManager = busManager;
  }

  /**
   * Set the asset server for resolving AudioSource clip handles
   * Called automatically by the AudioPlugin
   */
  setAssetServer(assetServer: AssetServer): void {
    this.assetServer = assetServer;
  }

  /**
   * Play a one-shot sound effect
   *
   * This doesn't create an entity - the sound plays and cleans itself up automatically.
   * Perfect for UI sounds, gunshots, explosions, etc.
   *
   * You can pass either:
   * 1. An AudioClip directly with options: `playSound(audioClip, { bus: "sfx", volume: 0.8 })`
   * 2. An AudioSource as a template: `playSound(audioSource)`
   *
   * AudioSource approach is great for reusable sound presets!
   *
   * @param clipOrSource The audio clip or AudioSource template
   * @param options Playback options (ignored if AudioSource is passed)
   */
  playSound(
    clipOrSource: AudioClip | AudioSource,
    options: PlaySoundOptions = {}
  ): void {
    // Check if we received an AudioSource component
    if (this.#isAudioSource(clipOrSource)) {
      this.#playSoundFromSource(clipOrSource);
      return;
    }

    // Otherwise treat it as an AudioClip
    this.#playSoundFromClip(clipOrSource, options);
  }

  /**
   * Type guard to check if the parameter is an AudioSource
   */
  #isAudioSource(obj: any): obj is AudioSource {
    return obj && typeof obj === "object" && "clip" in obj && "bus" in obj;
  }

  /**
   * Play sound from an AudioSource component (used as a template)
   */
  #playSoundFromSource(source: AudioSource): void {
    // Check the playing flag - if false, don't play (autoplay logic)
    if (!source.playing) {
      return;
    }

    // Need asset server to resolve the clip handle
    if (!this.assetServer) {
      console.error(
        "[AudioManager] AssetServer not set, cannot resolve AudioSource clip"
      );
      return;
    }

    // Get the actual AudioClip from the handle
    const audioClip = this.assetServer.getAsset<AudioClip>(source.clip);
    if (!audioClip) {
      console.warn("[AudioManager] AudioClip not loaded yet for AudioSource");
      return;
    }

    // Use the AudioSource's settings
    this.#playSoundFromClip(audioClip, {
      bus: source.bus,
      volume: source.volume,
      position: source.position,
      spatialBlend: source.spatialBlend,
      // Note: We don't use listenerPosition from source since it's calculated by spatial system
    });
  }

  /**
   * Play sound from an AudioClip with options
   */
  #playSoundFromClip(
    audioClipAsset: AudioClip,
    options: PlaySoundOptions = {}
  ): void {
    // Check if audio context is running
    if (this.audioContext.state !== "running") {
      console.warn(
        "[AudioManager] AudioContext not running, cannot play sound"
      );
      return;
    }

    const {
      bus = "master",
      volume = 1.0,
      position,
      listenerPosition,
      spatialBlend = 0,
    } = options;

    // Create audio nodes
    const sourceNode = this.audioContext.createBufferSource();
    sourceNode.buffer = audioClipAsset.buffer;
    sourceNode.loop = false;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;

    let pannerNode: PannerNode | undefined;

    // Set up spatial audio if requested
    if (spatialBlend > 0 && position) {
      pannerNode = this.audioContext.createPanner();
      pannerNode.panningModel = "equalpower";
      pannerNode.distanceModel = "inverse";
      pannerNode.refDistance = 100;
      pannerNode.maxDistance = 10000;
      pannerNode.rolloffFactor = 1;

      // Calculate relative position if listener position provided
      const listenerPos = listenerPosition ?? { x: 0, y: 0 };
      const relativeX = (position.x - listenerPos.x) * spatialBlend;
      const relativeY = (position.y - listenerPos.y) * spatialBlend;

      pannerNode.positionX.value = relativeX;
      pannerNode.positionY.value = relativeY;
      pannerNode.positionZ.value = 0;

      // Connect: source -> panner -> gain
      sourceNode.connect(pannerNode);
      pannerNode.connect(gainNode);
    } else {
      // Connect: source -> gain
      sourceNode.connect(gainNode);
    }

    // Connect to bus
    const busGain = this.busManager.getBusGainNode(bus);
    if (busGain) {
      gainNode.connect(busGain);
    } else {
      console.warn(`[AudioManager] Bus "${bus}" not found, using master`);
      const masterGain = this.busManager.getBusGainNode("master");
      if (masterGain) {
        gainNode.connect(masterGain);
      } else {
        console.error("[AudioManager] Master bus not found!");
        return;
      }
    }

    // Track this sound
    const playing: PlayingSound = { sourceNode, gainNode, pannerNode };
    this.playingSounds.add(playing);

    // Clean up when finished
    sourceNode.onended = () => {
      sourceNode.disconnect();
      gainNode.disconnect();
      pannerNode?.disconnect();
      this.playingSounds.delete(playing);
    };

    // Start playback
    sourceNode.start(0);
  }

  /**
   * Stop all currently playing one-shot sounds
   */
  stopAll(): void {
    for (const sound of this.playingSounds) {
      try {
        sound.sourceNode.stop();
        sound.sourceNode.disconnect();
        sound.gainNode.disconnect();
        sound.pannerNode?.disconnect();
      } catch (e) {
        // Sound might already be stopped
      }
    }
    this.playingSounds.clear();
  }

  /**
   * Get the number of currently playing one-shot sounds
   */
  get activeSoundCount(): number {
    return this.playingSounds.size;
  }
}
