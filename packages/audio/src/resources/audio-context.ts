/**
 * AudioContextResource wraps the WebAudio AudioContext
 *
 * Handles initialization and manages browser autoplay policies
 */
export class AudioContextResource {
  public readonly context: AudioContext;

  constructor() {
    this.context = new AudioContext();
  }

  /**
   * Resume the audio context (needed for browser autoplay policies)
   * Call this in response to user interaction
   */
  async resume(): Promise<void> {
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  /**
   * Get the current state of the audio context
   */
  get state(): AudioContextState {
    return this.context.state;
  }

  /**
   * Check if the audio context is running
   */
  get isRunning(): boolean {
    return this.context.state === "running";
  }

  /**
   * Current time in the audio context (in seconds)
   */
  get currentTime(): number {
    return this.context.currentTime;
  }

  /**
   * Sample rate of the audio context
   */
  get sampleRate(): number {
    return this.context.sampleRate;
  }
}
