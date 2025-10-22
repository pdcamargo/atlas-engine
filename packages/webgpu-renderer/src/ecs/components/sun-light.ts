import { Color } from "@atlas/core";

/**
 * SunLight component provides directional lighting (like the sun or moon)
 * Light comes from a specific direction and affects all objects equally
 * Perfect for day/night cycles, main scene lighting
 */
export class SunLight {
  /**
   * @param direction - The direction vector the light is coming FROM (will be normalized)
   * @param color - The color of the sunlight
   * @param intensity - The intensity multiplier (0.0 = no light, 1.0+ = bright light)
   */
  constructor(
    public direction: { x: number; y: number; z: number },
    public color: Color = Color.white(),
    public intensity: number = 1.0
  ) {
    this.normalizeDirection();
  }

  /**
   * Normalize the direction vector
   */
  private normalizeDirection(): void {
    const len = Math.sqrt(
      this.direction.x * this.direction.x +
        this.direction.y * this.direction.y +
        this.direction.z * this.direction.z
    );
    if (len > 0) {
      this.direction.x /= len;
      this.direction.y /= len;
      this.direction.z /= len;
    }
  }

  /**
   * Set the light direction (will be normalized automatically)
   */
  setDirection(x: number, y: number, z: number): void {
    this.direction.x = x;
    this.direction.y = y;
    this.direction.z = z;
    this.normalizeDirection();
  }

  /**
   * Set the sun light color
   */
  setColor(color: Color): void {
    this.color = color;
  }

  /**
   * Set the sun light intensity
   */
  setIntensity(intensity: number): void {
    this.intensity = Math.max(0, intensity);
  }

  /**
   * Helper to create a typical daytime sun
   */
  static daytime(): SunLight {
    return new SunLight(
      { x: 0.3, y: -1.0, z: -0.5 }, // Coming from upper right
      Color.fromRgb("rgb(1.0, 0.98, 0.9)"), // Warm white
      0.8
    );
  }

  /**
   * Helper to create a typical nighttime moon
   */
  static nighttime(): SunLight {
    return new SunLight(
      { x: -0.3, y: -1.0, z: -0.5 }, // Coming from upper left
      Color.fromRgb("rgb(0.7, 0.8, 1.0)"), // Cool blue-white
      0.3
    );
  }

  /**
   * Helper to create a sunset/sunrise sun
   */
  static sunset(): SunLight {
    return new SunLight(
      { x: 1.0, y: -0.2, z: -0.3 }, // Coming from the side, low angle
      Color.fromRgb("rgb(1.0, 0.6, 0.3)"), // Orange-red
      0.6
    );
  }
}
