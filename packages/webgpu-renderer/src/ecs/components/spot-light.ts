import { Color } from "@atlas/core";

/**
 * SpotLight component provides directional cone-based lighting
 * Emits light in a cone shape from a specific position and direction
 * Perfect for flashlights, spotlights, focused beams
 */
export class SpotLight {
  /**
   * @param position - The 3D position of the light source
   * @param direction - The direction vector the light is pointing (will be normalized)
   * @param color - The color of the light
   * @param radius - The maximum distance the light affects (in world units)
   * @param coneAngle - The cone angle in radians (full angle, not half)
   * @param intensity - The intensity multiplier (brightness)
   * @param falloff - The falloff exponent for distance attenuation
   */
  constructor(
    public position: { x: number; y: number; z: number },
    public direction: { x: number; y: number; z: number },
    public color: Color = Color.white(),
    public radius: number = 100,
    public coneAngle: number = Math.PI / 4, // 45 degrees
    public intensity: number = 1.0,
    public falloff: number = 1.0
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
   * Set the light position
   */
  setPosition(x: number, y: number, z: number = 10): void {
    this.position.x = x;
    this.position.y = y;
    this.position.z = z;
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
   * Set the cone angle in radians
   */
  setConeAngle(angleRadians: number): void {
    this.coneAngle = Math.max(0, Math.min(Math.PI, angleRadians));
  }

  /**
   * Set the cone angle in degrees
   */
  setConeAngleDegrees(angleDegrees: number): void {
    this.setConeAngle((angleDegrees * Math.PI) / 180);
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
   * Helper to create a typical flashlight
   */
  static flashlight(
    x: number,
    y: number,
    z: number = 10,
    dirX: number = 0,
    dirY: number = -1,
    dirZ: number = 0
  ): SpotLight {
    return new SpotLight(
      { x, y, z },
      { x: dirX, y: dirY, z: dirZ },
      Color.fromObject({ r: 1.0, g: 1.0, b: 0.95 }), // Cool white
      150, // Long reach
      Math.PI / 6, // 30 degrees
      3.0, // Very bright
      1.5 // Moderate falloff
    );
  }

  /**
   * Helper to create a stage spotlight
   */
  static stageSpotlight(
    x: number,
    y: number,
    z: number = 50,
    dirX: number = 0,
    dirY: number = -1,
    dirZ: number = 0
  ): SpotLight {
    return new SpotLight(
      { x, y, z },
      { x: dirX, y: dirY, z: dirZ },
      Color.fromObject({ r: 1.0, g: 0.98, b: 0.9 }), // Warm white
      200, // Very long reach
      Math.PI / 8, // 22.5 degrees (narrow beam)
      4.0, // Extremely bright
      1.2 // Gentle falloff
    );
  }

  /**
   * Helper to create a search light (wide cone)
   */
  static searchlight(
    x: number,
    y: number,
    z: number = 20,
    dirX: number = 0,
    dirY: number = -1,
    dirZ: number = 0
  ): SpotLight {
    return new SpotLight(
      { x, y, z },
      { x: dirX, y: dirY, z: dirZ },
      Color.fromObject({ r: 1.0, g: 1.0, b: 1.0 }), // Pure white
      180, // Long reach
      Math.PI / 3, // 60 degrees (wide)
      2.5, // Bright
      1.0 // Linear falloff
    );
  }

  /**
   * Helper to create a focused laser-like beam
   */
  static laser(
    x: number,
    y: number,
    z: number = 10,
    dirX: number = 0,
    dirY: number = -1,
    dirZ: number = 0,
    color: Color = Color.fromObject({ r: 1.0, g: 0.0, b: 0.0 })
  ): SpotLight {
    return new SpotLight(
      { x, y, z },
      { x: dirX, y: dirY, z: dirZ },
      color, // Custom color (default red)
      300, // Very long reach
      Math.PI / 36, // 5 degrees (very narrow)
      5.0, // Extremely bright
      0.5 // Very gentle falloff (almost no falloff)
    );
  }
}
