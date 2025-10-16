/**
 * AudioClip wraps an AudioBuffer from the WebAudio API
 * Stores decoded audio data that can be played by AudioSource components
 */
export class AudioClip {
  constructor(public readonly buffer: AudioBuffer) {}

  /**
   * Duration of the audio clip in seconds
   */
  get duration(): number {
    return this.buffer.duration;
  }

  /**
   * Sample rate of the audio data
   */
  get sampleRate(): number {
    return this.buffer.sampleRate;
  }

  /**
   * Number of audio channels
   */
  get numberOfChannels(): number {
    return this.buffer.numberOfChannels;
  }

  /**
   * Length of the audio data in sample frames
   */
  get length(): number {
    return this.buffer.length;
  }
}
