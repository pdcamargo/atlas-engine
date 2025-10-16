import { sys, AssetServer, LoadState } from "@atlas/core";
import { AudioSource } from "../components/audio-source";
import { AudioClip } from "../assets/audio-clip";
import { AudioContextResource } from "../resources/audio-context";
import { AudioBusManager } from "../resources/audio-bus-manager";

/**
 * System that handles audio playback
 *
 * Creates and manages WebAudio nodes for each AudioSource component:
 * - Starts/stops playback based on the playing flag
 * - Manages AudioBufferSourceNode, GainNode, and PannerNode
 * - Connects sources through the appropriate bus
 * - Handles looping and one-shot sounds
 */
export const audioPlaybackSystem = sys(({ commands }) => {
  const audioContext = commands.getResource(AudioContextResource);
  const busManager = commands.getResource(AudioBusManager);
  const assetServer = commands.getResource(AssetServer);

  // Skip if audio context is not running yet (waiting for user interaction)
  if (!audioContext.isRunning) {
    return;
  }

  // Query all AudioSource components
  const sources = commands.query(AudioSource).all();

  for (const [, source] of sources) {
    // Check if the audio clip is loaded
    const clip = assetServer.getAsset<AudioClip>(source.clip);
    const loadState = assetServer.getLoadState(source.clip);

    // If clip is not loaded yet, skip this source
    if (!clip) {
      continue;
    }

    if (loadState !== LoadState.Loaded) {
      continue;
    }

    const isPlaying = source.sourceNode !== undefined;

    // Handle starting playback
    if (source.playing && !isPlaying && !source.finished) {
      startPlayback(source, clip, audioContext, busManager);
    }

    // Handle stopping playback
    if (!source.playing && isPlaying) {
      stopPlayback(source, audioContext);
    }

    // Update volume
    if (source.gainNode) {
      source.gainNode.gain.value = source.volume;
    }
  }
}).label("Audio::Playback");

/**
 * Start playback for an AudioSource
 */
function startPlayback(
  source: AudioSource,
  clip: AudioClip,
  audioContext: AudioContextResource,
  busManager: AudioBusManager
): void {
  const ctx = audioContext.context;

  // Create audio nodes
  const sourceNode = ctx.createBufferSource();
  sourceNode.buffer = clip.buffer;
  sourceNode.loop = source.loop;

  const gainNode = ctx.createGain();
  gainNode.gain.value = source.volume;

  // Create panner node for spatial audio
  const pannerNode = ctx.createPanner();
  pannerNode.panningModel = "equalpower";
  pannerNode.distanceModel = "inverse";
  pannerNode.refDistance = 100;
  pannerNode.maxDistance = 10000;
  pannerNode.rolloffFactor = 1;

  // Set initial position (will be updated by spatial audio system)
  pannerNode.positionX.value = source.position.x;
  pannerNode.positionY.value = source.position.y;
  pannerNode.positionZ.value = 0;

  // Connect the audio graph based on spatial blend
  if (source.spatialBlend > 0) {
    // Use panner for spatial audio
    sourceNode.connect(pannerNode);
    pannerNode.connect(gainNode);
  } else {
    // Direct connection for non-spatial audio
    sourceNode.connect(gainNode);
  }

  // Connect to the appropriate bus
  const busGain = busManager.getBusGainNode(source.bus);
  if (busGain) {
    gainNode.connect(busGain);
  } else {
    const masterGain = busManager.getBusGainNode("master");
    if (masterGain) {
      gainNode.connect(masterGain);
    } else {
      console.error("[Audio] Master bus not found! Audio will not play.");
      return;
    }
  }

  // Handle end of playback for non-looping sounds
  sourceNode.onended = () => {
    if (!source.loop) {
      source.finished = true;
      source.sourceNode = undefined;
      source.gainNode = undefined;
      source.pannerNode = undefined;
      source.playing = false;
    }
  };

  // Start playback
  const offset = source.pausedAt || 0;
  sourceNode.start(0, offset);
  source.startTime = ctx.currentTime - offset;
  source.pausedAt = 0;

  // Store references
  source.sourceNode = sourceNode;
  source.gainNode = gainNode;
  source.pannerNode = pannerNode;
  source.finished = false;
}

/**
 * Stop playback for an AudioSource
 */
function stopPlayback(
  source: AudioSource,
  audioContext: AudioContextResource
): void {
  if (source.sourceNode) {
    try {
      // Calculate pause position
      const elapsed = audioContext.context.currentTime - source.startTime;
      source.pausedAt = elapsed;

      source.sourceNode.stop();
      source.sourceNode.disconnect();
    } catch (e) {
      // Source might already be stopped
    }
  }

  if (source.gainNode) {
    source.gainNode.disconnect();
  }

  if (source.pannerNode) {
    source.pannerNode.disconnect();
  }

  source.sourceNode = undefined;
  source.gainNode = undefined;
  source.pannerNode = undefined;
}
