/**
 * AudioListener component represents the "ears" in the scene
 *
 * Typically attached to the camera or player entity.
 * Only one listener should be active at a time.
 */
export class AudioListener {
  /** 2D position of the listener */
  position: { x: number; y: number };

  constructor(options?: { position?: { x: number; y: number } }) {
    this.position = options?.position ?? { x: 0, y: 0 };
  }
}
