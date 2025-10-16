import {
  Assets,
  AssetServer,
  createSet,
  SystemType,
  type App,
  type EcsPlugin,
} from "@atlas/core";
import { AudioClip } from "./assets/audio-clip";
import { AudioLoader } from "./assets/audio-loader";
import { AudioContextResource } from "./resources/audio-context";
import { AudioBusManager } from "./resources/audio-bus-manager";
import { AudioManager } from "./resources/audio-manager";
import { resumeAudioContextSystem } from "./systems/resume-audio-context";
import { audioPlaybackSystem } from "./systems/audio-playback";
import { spatialAudioSystem } from "./systems/spatial-audio";

const ResumeAudioContextSet = Symbol("Audio::ResumeContext");
const AudioPlaybackSet = Symbol("Audio::Playback");
const SpatialAudioSet = Symbol("Audio::SpatialAudio");

/**
 * AudioPlugin provides audio functionality for the ECS
 *
 * Features:
 * - Asset loading for audio files (mp3, wav, ogg, m4a)
 * - Spatial audio in 2D space
 * - Hierarchical bus system for volume control
 * - WebAudio API integration
 */
export class AudioPlugin implements EcsPlugin {
  public async build(app: App): Promise<void> {
    // Initialize AudioContext
    const audioContext = new AudioContextResource();
    app.setResource(audioContext);

    // Create AudioBusManager with default "master" bus
    const busManager = new AudioBusManager(audioContext.context);
    app.setResource(busManager);

    // Create AudioManager for one-shot sounds
    const audioManager = new AudioManager(audioContext.context, busManager);
    app.setResource(audioManager);

    // Register asset storage for AudioClip
    const audioClipAssets = new Assets<AudioClip>();
    app.setResource(audioClipAssets);

    // Get or create AssetServer
    let assetServer = app.tryGetResource(AssetServer);
    if (!assetServer) {
      assetServer = new AssetServer();
      app.setResource(assetServer);
    }

    // Register AudioLoader
    const audioLoader = new AudioLoader(audioContext.context);
    assetServer.registerLoader(audioLoader);

    // Set asset server on audio manager for AudioSource support
    audioManager.setAssetServer(assetServer);

    // Register systems
    app
      .addSystems(
        SystemType.StartUp,
        createSet(ResumeAudioContextSet, resumeAudioContextSystem)
      )
      .addSystems(
        SystemType.Update,
        createSet(AudioPlaybackSet, audioPlaybackSystem)
      )
      .addSystems(
        SystemType.Update,
        createSet(SpatialAudioSet, spatialAudioSystem)
      );
  }

  public ready(app: App): boolean {
    // Check that all required resources exist
    return (
      app.hasResource(AudioContextResource) &&
      app.hasResource(AudioBusManager) &&
      app.hasResource(AudioManager) &&
      app.hasResource(Assets) &&
      app.hasResource(AssetServer)
    );
  }

  public name(): string {
    return "AudioPlugin";
  }
}
