import { Color } from "@atlas/core";
import { AmbientLight } from "../components/ambient-light";
import { SunLight } from "../components/sun-light";
import { PointLight } from "../components/point-light";
import { SpotLight } from "../components/spot-light";

/**
 * Maximum number of point lights supported
 */
export const MAX_POINT_LIGHTS = 256;

/**
 * Maximum number of spot lights supported
 */
export const MAX_SPOT_LIGHTS = 32;

/**
 * Light data structure matching WGSL shader expectations
 */
export interface PointLightData {
  position: Float32Array; // vec3f (12 bytes) + padding (4 bytes) = 16 bytes
  radius: number; // f32 (4 bytes)
  color: Float32Array; // vec4f (16 bytes)
  falloff: number; // f32 (4 bytes)
  padding: Float32Array; // vec3f padding (12 bytes) for alignment
}

export interface SpotLightData {
  position: Float32Array; // vec3f (12 bytes) + padding (4 bytes) = 16 bytes
  radius: number; // f32 (4 bytes)
  direction: Float32Array; // vec3f (12 bytes) + padding (4 bytes) = 16 bytes
  coneAngle: number; // f32 (4 bytes)
  color: Float32Array; // vec4f (16 bytes)
  falloff: number; // f32 (4 bytes)
  padding: Float32Array; // vec3f padding (12 bytes) for alignment
}

/**
 * LightingSystem resource manages all lights in the scene
 * Tracks changes and provides data for GPU buffer updates
 */
export class LightingSystem {
  // Ambient lighting
  public ambientColor: Float32Array = new Float32Array([0.2, 0.2, 0.2, 0.2]);

  // Sun/Directional lighting
  public sunDirection: Float32Array = new Float32Array([0, -1, 0, 0]);
  public sunColor: Float32Array = new Float32Array([1, 1, 1, 0]);

  // Point lights
  public pointLights: PointLightData[] = [];
  public numPointLights: number = 0;

  // Spot lights
  public spotLights: SpotLightData[] = [];
  public numSpotLights: number = 0;

  // Dirty tracking
  private _dirty: boolean = true;

  constructor() {
    // Initialize with default lighting
    this.setDefaults();
  }

  /**
   * Set default lighting (soft ambient, no sun, no point/spot lights)
   */
  private setDefaults(): void {
    this.ambientColor[0] = 0.2;
    this.ambientColor[1] = 0.2;
    this.ambientColor[2] = 0.2;
    this.ambientColor[3] = 0.2; // intensity

    this.sunDirection[0] = 0;
    this.sunDirection[1] = -1;
    this.sunDirection[2] = 0;
    this.sunDirection[3] = 0; // intensity (0 = disabled)

    this.sunColor[0] = 1;
    this.sunColor[1] = 1;
    this.sunColor[2] = 1;
    this.sunColor[3] = 0; // unused

    this.pointLights = [];
    this.numPointLights = 0;

    this.spotLights = [];
    this.numSpotLights = 0;
  }

  /**
   * Clear all lights and reset to defaults
   */
  clear(): void {
    this.setDefaults();
    this._dirty = true;
  }

  /**
   * Update ambient light from component
   */
  updateAmbientLight(ambient: AmbientLight): void {
    this.ambientColor[0] = ambient.color.r;
    this.ambientColor[1] = ambient.color.g;
    this.ambientColor[2] = ambient.color.b;
    this.ambientColor[3] = ambient.intensity;
    this._dirty = true;
  }

  /**
   * Update sun light from component
   */
  updateSunLight(sun: SunLight): void {
    this.sunDirection[0] = sun.direction.x;
    this.sunDirection[1] = sun.direction.y;
    this.sunDirection[2] = sun.direction.z;
    this.sunDirection[3] = sun.intensity;

    this.sunColor[0] = sun.color.r;
    this.sunColor[1] = sun.color.g;
    this.sunColor[2] = sun.color.b;
    this.sunColor[3] = 0; // unused
    this._dirty = true;
  }

  /**
   * Add a point light
   */
  addPointLight(light: PointLight): void {
    if (this.numPointLights >= MAX_POINT_LIGHTS) {
      console.warn(
        `Maximum number of point lights (${MAX_POINT_LIGHTS}) reached. Light will be ignored.`
      );
      return;
    }

    const lightData: PointLightData = {
      position: new Float32Array([
        light.position.x,
        light.position.y,
        light.position.z,
        0,
      ]),
      radius: light.radius,
      color: new Float32Array([
        light.color.r,
        light.color.g,
        light.color.b,
        light.intensity,
      ]),
      falloff: light.falloff,
      padding: new Float32Array(3),
    };

    this.pointLights.push(lightData);
    this.numPointLights++;
    this._dirty = true;
  }

  /**
   * Add a spot light
   */
  addSpotLight(light: SpotLight): void {
    if (this.numSpotLights >= MAX_SPOT_LIGHTS) {
      console.warn(
        `Maximum number of spot lights (${MAX_SPOT_LIGHTS}) reached. Light will be ignored.`
      );
      return;
    }

    const lightData: SpotLightData = {
      position: new Float32Array([
        light.position.x,
        light.position.y,
        light.position.z,
        0,
      ]),
      radius: light.radius,
      direction: new Float32Array([
        light.direction.x,
        light.direction.y,
        light.direction.z,
        0,
      ]),
      coneAngle: light.coneAngle,
      color: new Float32Array([
        light.color.r,
        light.color.g,
        light.color.b,
        light.intensity,
      ]),
      falloff: light.falloff,
      padding: new Float32Array(3),
    };

    this.spotLights.push(lightData);
    this.numSpotLights++;
    this._dirty = true;
  }

  /**
   * Clear all point lights
   */
  clearPointLights(): void {
    this.pointLights = [];
    this.numPointLights = 0;
    this._dirty = true;
  }

  /**
   * Clear all spot lights
   */
  clearSpotLights(): void {
    this.spotLights = [];
    this.numSpotLights = 0;
    this._dirty = true;
  }

  /**
   * Check if lighting data has changed since last GPU update
   */
  isDirty(): boolean {
    return this._dirty;
  }

  /**
   * Mark as clean (called after GPU buffer update)
   */
  markClean(): void {
    this._dirty = false;
  }

  /**
   * Mark as dirty (forces GPU buffer update on next frame)
   */
  markDirty(): void {
    this._dirty = true;
  }

  /**
   * Get the size in bytes for the lighting uniforms buffer
   * Layout:
   *   ambientColor: vec4f (16 bytes)
   *   sunDirection: vec4f (16 bytes)
   *   sunColor: vec4f (16 bytes)
   *   numPointLights: u32 (4 bytes)
   *   numSpotLights: u32 (4 bytes)
   *   padding: vec2f (8 bytes)
   * Total: 64 bytes
   */
  static getUniformBufferSize(): number {
    return 64;
  }

  /**
   * Write lighting uniforms to a Float32Array
   */
  writeUniformsToArray(array: Float32Array, offset: number = 0): void {
    // ambientColor (vec4f)
    array[offset + 0] = this.ambientColor[0];
    array[offset + 1] = this.ambientColor[1];
    array[offset + 2] = this.ambientColor[2];
    array[offset + 3] = this.ambientColor[3];

    // sunDirection (vec4f)
    array[offset + 4] = this.sunDirection[0];
    array[offset + 5] = this.sunDirection[1];
    array[offset + 6] = this.sunDirection[2];
    array[offset + 7] = this.sunDirection[3];

    // sunColor (vec4f)
    array[offset + 8] = this.sunColor[0];
    array[offset + 9] = this.sunColor[1];
    array[offset + 10] = this.sunColor[2];
    array[offset + 11] = this.sunColor[3];

    // numPointLights (u32) + numSpotLights (u32) + padding (vec2f)
    const uint32View = new Uint32Array(array.buffer, (offset + 12) * 4, 4);
    uint32View[0] = this.numPointLights;
    uint32View[1] = this.numSpotLights;
    uint32View[2] = 0; // padding
    uint32View[3] = 0; // padding
  }

  /**
   * Get the size in bytes for a single point light
   * Layout:
   *   position: vec3f (12 bytes) + radius: f32 (4 bytes) = 16 bytes
   *   color: vec4f (16 bytes)
   *   falloff: f32 (4 bytes) + padding: vec3f (12 bytes) = 16 bytes
   * Total: 48 bytes per light
   */
  static getPointLightSize(): number {
    return 48;
  }

  /**
   * Get the size in bytes for a single spot light
   * Layout:
   *   position: vec3f (12 bytes) + radius: f32 (4 bytes) = 16 bytes
   *   direction: vec3f (12 bytes) + coneAngle: f32 (4 bytes) = 16 bytes
   *   color: vec4f (16 bytes)
   *   falloff: f32 (4 bytes) + padding: vec3f (12 bytes) = 16 bytes
   * Total: 64 bytes per light
   */
  static getSpotLightSize(): number {
    return 64;
  }

  /**
   * Write point lights to a Float32Array
   */
  writePointLightsToArray(array: Float32Array, offset: number = 0): void {
    let idx = offset;
    for (let i = 0; i < this.numPointLights; i++) {
      const light = this.pointLights[i];

      // position (vec3f) + radius (f32)
      array[idx++] = light.position[0];
      array[idx++] = light.position[1];
      array[idx++] = light.position[2];
      array[idx++] = light.radius;

      // color (vec4f)
      array[idx++] = light.color[0];
      array[idx++] = light.color[1];
      array[idx++] = light.color[2];
      array[idx++] = light.color[3];

      // falloff (f32) + padding (vec3f)
      array[idx++] = light.falloff;
      array[idx++] = 0; // padding
      array[idx++] = 0; // padding
      array[idx++] = 0; // padding
    }
  }

  /**
   * Write spot lights to a Float32Array
   */
  writeSpotLightsToArray(array: Float32Array, offset: number = 0): void {
    let idx = offset;
    for (let i = 0; i < this.numSpotLights; i++) {
      const light = this.spotLights[i];

      // position (vec3f) + radius (f32)
      array[idx++] = light.position[0];
      array[idx++] = light.position[1];
      array[idx++] = light.position[2];
      array[idx++] = light.radius;

      // direction (vec3f) + coneAngle (f32)
      array[idx++] = light.direction[0];
      array[idx++] = light.direction[1];
      array[idx++] = light.direction[2];
      array[idx++] = light.coneAngle;

      // color (vec4f)
      array[idx++] = light.color[0];
      array[idx++] = light.color[1];
      array[idx++] = light.color[2];
      array[idx++] = light.color[3];

      // falloff (f32) + padding (vec3f)
      array[idx++] = light.falloff;
      array[idx++] = 0; // padding
      array[idx++] = 0; // padding
      array[idx++] = 0; // padding
    }
  }
}
