import { Color } from "@atlas/core";

/**
 * PointLight component provides omnidirectional point lighting
 * Emits light in all directions from a specific position with distance-based falloff
 * Perfect for torches, lamps, fires, glowing objects
 */
export class PointLight {
  /**
   * @param position - The 3D position of the light source
   * @param color - The color of the light
   * @param radius - The maximum distance the light affects (in world units)
   * @param intensity - The intensity multiplier (brightness)
   * @param falloff - The falloff exponent (1.0 = linear, 2.0 = quadratic/realistic, higher = sharper)
   */
  constructor(
    public position: { x: number; y: number; z: number },
    public color: Color = Color.white(),
    public radius: number = 100,
    public intensity: number = 1.0,
    public falloff: number = 1.0
  ) {}

  /**
   * Set the light position
   */
  setPosition(x: number, y: number, z: number = 0): void {
    this.position.x = x;
    this.position.y = y;
    this.position.z = z;
  }

  /**
   * Set the light color
   */
  setColor(color: Color): void {
    this.color = color;
  }

  /**
   * Set the light radius (max distance)
   */
  setRadius(radius: number): void {
    this.radius = Math.max(0, radius);
  }

  /**
   * Set the light intensity
   */
  setIntensity(intensity: number): void {
    this.intensity = Math.max(0, intensity);
  }

  /**
   * Set the falloff exponent
   */
  setFalloff(falloff: number): void {
    this.falloff = Math.max(0.1, falloff);
  }

  /**
   * Helper to create a typical torch light
   */
  static torch(x: number, y: number, z: number = 5): PointLight {
    return new PointLight(
      { x, y, z },
      Color.fromObject({ r: 1.0, g: 0.6, b: 0.2 }), // Warm orange
      1.015, // Medium radius
      10, // Bright
      3 // Moderate falloff
    );
  }

  /**
   * Helper to create a typical candle light
   */
  static candle(x: number, y: number, z: number = 3): PointLight {
    return new PointLight(
      { x, y, z },
      Color.fromObject({ r: 1.0, g: 0.7, b: 0.3 }), // Soft orange-yellow
      40, // Small radius
      1.0, // Dim
      2.0 // Realistic falloff
    );
  }

  /**
   * Helper to create a typical lamp light
   */
  static lamp(x: number, y: number, z: number = 10): PointLight {
    return new PointLight(
      { x, y, z },
      Color.fromObject({ r: 1.0, g: 0.95, b: 0.8 }), // Warm white
      120, // Large radius
      1.5, // Medium bright
      1.2 // Gentle falloff
    );
  }

  /**
   * Helper to create a magical/glowing orb light
   */
  static magicOrb(
    x: number,
    y: number,
    z: number = 5,
    color: Color = Color.fromRgb("rgb(0.4, 0.7, 1.0)")
  ): PointLight {
    return new PointLight(
      { x, y, z },
      color, // Custom magical color
      100, // Medium-large radius
      2.5, // Very bright
      1.0 // Linear falloff for glow effect
    );
  }

  /**
   * Helper to create a fire light
   */
  static fire(x: number, y: number, z: number = 8): PointLight {
    return new PointLight(
      { x, y, z },
      Color.fromRgb("rgb(1.0, 0.5, 0.1)"), // Orange-red
      150, // Large radius
      3.0, // Very bright
      1.3 // Moderate falloff
    );
  }
}
