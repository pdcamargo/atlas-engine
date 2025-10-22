import { Color } from "@atlas/core";

/**
 * AmbientLight component provides global ambient lighting
 * Affects all lit objects in the scene uniformly
 * Useful for setting the base light level (day/night ambient)
 */
export class AmbientLight {
  /**
   * @param color - The color of the ambient light
   * @param intensity - The intensity multiplier (0.0 = no ambient, 1.0 = full ambient)
   */
  constructor(
    public color: Color = Color.white(),
    public intensity: number = 0.2
  ) {}

  /**
   * Set the ambient light color
   */
  setColor(color: Color): void {
    this.color = color;
  }

  /**
   * Set the ambient light intensity
   */
  setIntensity(intensity: number): void {
    this.intensity = Math.max(0, intensity);
  }

  /**
   * Helper to create a typical daytime ambient light
   */
  static daytime(intensity: number = 0.3): AmbientLight {
    return new AmbientLight(Color.fromRgb("rgb(1.0, 1.0, 0.95)"), intensity);
  }

  /**
   * Helper to create a typical nighttime ambient light
   */
  static nighttime(intensity: number = 0.1): AmbientLight {
    return new AmbientLight(Color.fromRgb("rgb(0.2, 0.2, 0.4)"), intensity);
  }

  /**
   * Helper to create no ambient light (completely dark)
   */
  static none(): AmbientLight {
    return new AmbientLight(Color.black(), 0.0);
  }
}
