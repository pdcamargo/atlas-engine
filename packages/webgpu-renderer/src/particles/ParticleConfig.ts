import { Vector2Like, Vector3Like } from "@atlas/core";
import { Texture } from "../renderer/Texture";

/**
 * Range configuration for numeric values
 */
export interface RangeConfig {
  min: number;
  max: number;
}

/**
 * Range configuration for Vector3 values
 */
export interface Vector3RangeConfig {
  min: Vector3Like;
  max: Vector3Like;
}

/**
 * Range configuration for color values (RGBA, 0-1 range)
 */
export interface ColorRangeConfig {
  min: [number, number, number, number];
  max: [number, number, number, number];
}

/**
 * Blend mode for particle rendering
 */
export enum ParticleBlendMode {
  Normal = "normal",
  Additive = "additive",
  Multiply = "multiply",
}

/**
 * Emission shape types
 */
export enum EmissionShape {
  Point = "point",       // Emit from a single point
  Circle = "circle",     // Emit from within a circle
  Rectangle = "rectangle", // Emit from within a rectangle
  Cone = "cone",         // Emit in a cone direction
}

/**
 * Configuration for particle emitter
 */
export interface ParticleEmitterConfig {
  // Capacity
  maxParticles: number;

  // Emission
  emissionRate?: number;        // Particles per second (default: 10)
  emissionShape?: EmissionShape; // Emission shape (default: Point)
  emissionRadius?: number;       // For circle/cone shapes (default: 1.0)
  emissionSize?: Vector2Like;    // For rectangle shape (default: {x:1, y:1})
  emissionAngle?: number;        // For cone shape in radians (default: PI/4)

  // Lifetime
  lifetime?: number | RangeConfig; // Particle lifetime in seconds

  // Physics
  velocity?: Vector3Like | Vector3RangeConfig; // Initial velocity
  gravity?: Vector3Like;          // Gravity force (default: {x:0, y:0, z:0})
  wind?: Vector3Like;             // Wind force (default: {x:0, y:0, z:0})
  drag?: number;                  // Air resistance 0-1 (default: 0)

  // Visual
  size?: number | RangeConfig | { start: number | RangeConfig; end: number | RangeConfig };
  color?: {
    start: [number, number, number, number] | ColorRangeConfig;
    end: [number, number, number, number] | ColorRangeConfig;
  };
  rotation?: number | RangeConfig;      // Initial rotation in radians
  rotationSpeed?: number | RangeConfig; // Rotation speed in radians/sec

  // Rendering
  texture?: Texture;               // Optional texture (default: white square)
  blendMode?: ParticleBlendMode;   // Blend mode (default: Normal)

  // Control
  enabled?: boolean;               // Is emitter enabled? (default: true)
  loop?: boolean;                  // Loop emission (default: true)
  duration?: number;               // Total emission duration (default: Infinity)
}

/**
 * Internal representation of emitter config for GPU upload
 * Matches EmitterConfig struct in WGSL
 */
export interface GPUEmitterConfig {
  position: Float32Array;           // vec3f (12 bytes) + f32 padding (4 bytes) = 16 bytes
  gravity: Float32Array;            // vec3f (12 bytes) + f32 padding (4 bytes) = 16 bytes
  windForce: Float32Array;          // vec3f (12 bytes) + f32 padding (4 bytes) = 16 bytes
  velocityMin: Float32Array;        // vec3f (12 bytes) + f32 padding (4 bytes) = 16 bytes
  velocityMax: Float32Array;        // vec3f (12 bytes) + f32 padding (4 bytes) = 16 bytes
  lifetimeMin: number;              // f32
  lifetimeMax: number;              // f32
  startSizeMin: number;             // f32
  startSizeMax: number;             // f32
  endSizeMin: number;               // f32
  endSizeMax: number;               // f32
  rotationSpeedMin: number;         // f32
  rotationSpeedMax: number;         // f32
  drag: number;                     // f32
  emissionRate: number;             // f32
  startColorMin: Float32Array;      // vec4f (16 bytes)
  startColorMax: Float32Array;      // vec4f (16 bytes)
  endColorMin: Float32Array;        // vec4f (16 bytes)
  endColorMax: Float32Array;        // vec4f (16 bytes)
}

/**
 * Normalize range config to always have min/max
 */
export function normalizeRange(value: number | RangeConfig): RangeConfig {
  if (typeof value === "number") {
    return { min: value, max: value };
  }
  return value;
}

/**
 * Normalize vector3 range config
 */
export function normalizeVector3Range(
  value: Vector3Like | Vector3RangeConfig
): Vector3RangeConfig {
  if ("min" in value && "max" in value) {
    return value as Vector3RangeConfig;
  }
  const v = value as Vector3Like;
  return { min: v, max: v };
}

/**
 * Normalize color range config
 */
export function normalizeColorRange(
  value: [number, number, number, number] | ColorRangeConfig
): ColorRangeConfig {
  if (Array.isArray(value)) {
    return { min: value, max: value };
  }
  return value;
}
