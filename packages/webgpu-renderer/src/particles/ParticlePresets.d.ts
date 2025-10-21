import { Vector3Like } from "@atlas/core";
import { ParticleEmitter } from "./ParticleEmitter";
/**
 * Preset configurations for common particle effects
 * Makes it easy to create standard effects without manual configuration
 */
export declare class ParticlePresets {
    /**
     * Fire effect - rises upward with flickering orange/red colors
     */
    static fire(config?: {
        position?: Vector3Like;
        intensity?: number;
    }): ParticleEmitter;
    /**
     * Smoke effect - rises slowly with gray/white colors
     */
    static smoke(config?: {
        position?: Vector3Like;
        intensity?: number;
    }): ParticleEmitter;
    /**
     * Explosion effect - bursts outward in all directions
     */
    static explosion(config?: {
        position?: Vector3Like;
        intensity?: number;
    }): ParticleEmitter;
    /**
     * Rain effect - falls downward
     */
    static rain(config?: {
        position?: Vector3Like;
        intensity?: number;
        windSpeed?: number;
        area?: {
            width: number;
            height: number;
        };
    }): ParticleEmitter;
    /**
     * Sparkles effect - twinkling particles
     */
    static sparkles(config?: {
        position?: Vector3Like;
        intensity?: number;
        color?: [number, number, number, number];
    }): ParticleEmitter;
    /**
     * Magic/energy effect - swirling colorful particles
     */
    static magic(config?: {
        position?: Vector3Like;
        intensity?: number;
    }): ParticleEmitter;
    /**
     * Snow effect - gentle falling particles
     */
    static snow(config?: {
        position?: Vector3Like;
        intensity?: number;
        windSpeed?: number;
    }): ParticleEmitter;
    /**
     * Dust effect - small floating particles
     */
    static dust(config?: {
        position?: Vector3Like;
        intensity?: number;
    }): ParticleEmitter;
}
//# sourceMappingURL=ParticlePresets.d.ts.map