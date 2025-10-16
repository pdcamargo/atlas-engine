import type { AssetLoader } from "@atlas/core";
import { AudioClip } from "./audio-clip";

/**
 * AudioLoader loads audio files using the WebAudio API
 * Supports common audio formats: mp3, wav, ogg, m4a
 */
export class AudioLoader implements AssetLoader<AudioClip> {
  constructor(private readonly audioContext: AudioContext) {}

  extensions(): string[] {
    return ["mp3", "wav", "ogg", "m4a"];
  }

  async load(bytes: Uint8Array, path: string): Promise<AudioClip> {
    try {
      // Decode the audio data using WebAudio API
      // Create a proper ArrayBuffer copy from the Uint8Array to handle SharedArrayBuffer
      const arrayBuffer = bytes.slice().buffer;
      const buffer = await this.audioContext.decodeAudioData(arrayBuffer);

      return new AudioClip(buffer);
    } catch (error) {
      console.error(`[Audio] Failed to decode: ${path}`, error);
      throw new Error(
        `Failed to decode audio file: ${path}. ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
