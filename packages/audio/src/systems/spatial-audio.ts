import { sys } from "@atlas/core";
import { AudioSource } from "../components/audio-source";
import { AudioListener } from "../components/audio-listener";

/**
 * System that updates spatial audio based on AudioListener position
 *
 * For each AudioSource with spatialBlend > 0:
 * - Calculates distance between source and listener
 * - Updates PannerNode position for 3D audio (using 2D coordinates, Z=0)
 * - Applies distance-based attenuation
 * - Pans audio left/right based on relative X position
 */
export const spatialAudioSystem = sys(({ commands }) => {
  // Find the first AudioListener (typically only one exists)
  const listenerResult = commands.query(AudioListener).tryFind();

  // If no listener exists, skip spatial audio updates
  if (!listenerResult) {
    return;
  }

  const [, listener] = listenerResult;

  // Update all AudioSource positions relative to the listener
  const sources = commands.query(AudioSource).all();

  for (const [, source] of sources) {
    // Skip if not using spatial audio
    if (source.spatialBlend <= 0) {
      continue;
    }

    // Skip if panner node doesn't exist (not playing yet)
    if (!source.pannerNode) {
      continue;
    }

    // Calculate relative position
    const relativeX = source.position.x - listener.position.x;
    const relativeY = source.position.y - listener.position.y;

    // Apply spatial blend (interpolate between non-spatial and spatial)
    const blendedX = relativeX * source.spatialBlend;
    const blendedY = relativeY * source.spatialBlend;

    // Update panner position (2D space, Z=0)
    source.pannerNode.positionX.value = blendedX;
    source.pannerNode.positionY.value = blendedY;
    source.pannerNode.positionZ.value = 0;

    // Update listener position (at origin in relative space)
    const audioListener = source.pannerNode.context.listener;
    if (audioListener.positionX) {
      audioListener.positionX.value = 0;
      audioListener.positionY.value = 0;
      audioListener.positionZ.value = 0;
    }
  }
}).label("Audio::SpatialAudio");
