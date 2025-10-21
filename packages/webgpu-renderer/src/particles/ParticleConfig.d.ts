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
export declare enum ParticleBlendMode {
    Normal = "normal",
    Additive = "additive",
    Multiply = "multiply"
}
/**
 * Emission shape types
 */
export declare enum EmissionShape {
    Point = "point",// Emit from a single point
    Circle = "circle",// Emit from within a circle
    Rectangle = "rectangle",// Emit from within a rectangle
    Cone = "cone"
}
/**
 * Configuration for particle emitter
 */
export interface ParticleEmitterConfig {
    maxParticles: number;
    emissionRate?: number;
    emissionShape?: EmissionShape;
    emissionRadius?: number;
    emissionSize?: Vector2Like;
    emissionAngle?: number;
    lifetime?: number | RangeConfig;
    velocity?: Vector3Like | Vector3RangeConfig;
    gravity?: Vector3Like;
    wind?: Vector3Like;
    drag?: number;
    size?: number | RangeConfig | {
        start: number | RangeConfig;
        end: number | RangeConfig;
    };
    color?: {
        start: [number, number, number, number] | ColorRangeConfig;
        end: [number, number, number, number] | ColorRangeConfig;
    };
    rotation?: number | RangeConfig;
    rotationSpeed?: number | RangeConfig;
    texture?: Texture;
    blendMode?: ParticleBlendMode;
    enabled?: boolean;
    loop?: boolean;
    duration?: number;
}
/**
 * Internal representation of emitter config for GPU upload
 * Matches EmitterConfig struct in WGSL
 */
export interface GPUEmitterConfig {
    position: Float32Array;
    gravity: Float32Array;
    windForce: Float32Array;
    velocityMin: Float32Array;
    velocityMax: Float32Array;
    lifetimeMin: number;
    lifetimeMax: number;
    startSizeMin: number;
    startSizeMax: number;
    endSizeMin: number;
    endSizeMax: number;
    rotationSpeedMin: number;
    rotationSpeedMax: number;
    drag: number;
    emissionRate: number;
    startColorMin: Float32Array;
    startColorMax: Float32Array;
    endColorMin: Float32Array;
    endColorMax: Float32Array;
}
/**
 * Normalize range config to always have min/max
 */
export declare function normalizeRange(value: number | RangeConfig): RangeConfig;
/**
 * Normalize vector3 range config
 */
export declare function normalizeVector3Range(value: Vector3Like | Vector3RangeConfig): Vector3RangeConfig;
/**
 * Normalize color range config
 */
export declare function normalizeColorRange(value: [number, number, number, number] | ColorRangeConfig): ColorRangeConfig;
//# sourceMappingURL=ParticleConfig.d.ts.map