import { ParticleEmitter } from "./ParticleEmitter";
/**
 * Preset configurations for common particle effects
 * Makes it easy to create standard effects without manual configuration
 */
export class ParticlePresets {
    /**
     * Fire effect - rises upward with flickering orange/red colors
     */
    static fire(config = {}) {
        const intensity = config.intensity ?? 1.0;
        return new ParticleEmitter({
            maxParticles: Math.floor(1000 * intensity),
            emissionRate: 50 * intensity,
            lifetime: { min: 0.8, max: 1.5 },
            velocity: {
                min: { x: -0.3, y: 1.5, z: 0 },
                max: { x: 0.3, y: 1, z: 0 },
            },
            gravity: { x: 0, y: 0.25, z: 0 }, // Slight upward force
            drag: 0.3,
            size: {
                start: { min: 0.3 * intensity, max: 0.5 * intensity },
                end: { min: 0.05, max: 0.1 },
            },
            color: {
                start: {
                    min: [1.0, 0.7, 0.2, 1.0],
                    max: [1.0, 0.5, 0.0, 1.0],
                },
                end: {
                    min: [0.8, 0.2, 0.0, 0.0],
                    max: [0.5, 0.0, 0.0, 0.0],
                },
            },
            rotationSpeed: { min: -2, max: 2 },
            blendMode: "additive",
        });
    }
    /**
     * Smoke effect - rises slowly with gray/white colors
     */
    static smoke(config = {}) {
        const intensity = config.intensity ?? 1.0;
        return new ParticleEmitter({
            maxParticles: Math.floor(500 * intensity),
            emissionRate: 20 * intensity,
            lifetime: { min: 2.0, max: 3.5 },
            velocity: {
                min: { x: -0.2, y: 0.5, z: 0 },
                max: { x: 0.2, y: 1.0, z: 0 },
            },
            gravity: { x: 0, y: 0.2, z: 0 },
            drag: 0.5,
            size: {
                start: { min: 0.4 * intensity, max: 0.8 * intensity },
                end: { min: 0.12 * intensity, max: 2.0 * intensity },
            },
            color: {
                start: {
                    min: [0.3, 0.3, 0.3, 0.5],
                    max: [0.5, 0.5, 0.5, 0.7],
                },
                end: {
                    min: [0.2, 0.2, 0.2, 0.0],
                    max: [0.3, 0.3, 0.3, 0.0],
                },
            },
            rotationSpeed: { min: -1, max: 1 },
            blendMode: "normal",
        });
    }
    /**
     * Explosion effect - bursts outward in all directions
     */
    static explosion(config = {}) {
        const intensity = config.intensity ?? 1.0;
        return new ParticleEmitter({
            maxParticles: Math.floor(200 * intensity),
            emissionRate: 500 * intensity, // High rate for burst
            lifetime: { min: 0.5, max: 1.2 },
            velocity: {
                min: { x: -3, y: -3, z: 0 },
                max: { x: 3, y: 3, z: 0 },
            },
            gravity: { x: 0, y: -5, z: 0 },
            drag: 0.8,
            size: {
                start: { min: 0.2, max: 0.4 },
                end: { min: 0.05, max: 0.1 },
            },
            color: {
                start: {
                    min: [1.0, 0.8, 0.3, 1.0],
                    max: [1.0, 0.5, 0.0, 1.0],
                },
                end: {
                    min: [0.5, 0.1, 0.0, 0.0],
                    max: [0.3, 0.0, 0.0, 0.0],
                },
            },
            rotationSpeed: { min: -10, max: 10 },
            blendMode: "additive",
            loop: false,
            duration: 0.1, // Quick burst
        });
    }
    /**
     * Rain effect - falls downward
     */
    static rain(config = {}) {
        const intensity = config.intensity ?? 1.0;
        const windSpeed = config.windSpeed ?? 0;
        return new ParticleEmitter({
            maxParticles: Math.floor(1000 * intensity),
            emissionRate: 100 * intensity,
            lifetime: { min: 2.0, max: 3.0 },
            velocity: {
                min: { x: windSpeed - 0.5, y: -8, z: 0 },
                max: { x: windSpeed + 0.5, y: -10, z: 0 },
            },
            gravity: { x: 0, y: -2, z: 0 },
            size: { min: 0.05, max: 0.08 },
            color: {
                start: { min: [0.6, 0.7, 1.0, 0.6], max: [0.7, 0.8, 1.0, 0.8] },
                end: { min: [0.6, 0.7, 1.0, 0.3], max: [0.7, 0.8, 1.0, 0.5] },
            },
            blendMode: "normal",
        });
    }
    /**
     * Sparkles effect - twinkling particles
     */
    static sparkles(config = {}) {
        const intensity = config.intensity ?? 1.0;
        const color = config.color ?? [1.0, 1.0, 0.5, 1.0];
        return new ParticleEmitter({
            maxParticles: Math.floor(100 * intensity),
            emissionRate: 30 * intensity,
            lifetime: { min: 0.5, max: 1.5 },
            velocity: {
                min: { x: -0.5, y: -0.5, z: 0 },
                max: { x: 0.5, y: 0.5, z: 0 },
            },
            drag: 0.9,
            size: {
                start: { min: 0.1, max: 0.15 },
                end: { min: 0.0, max: 0.05 },
            },
            color: {
                start: { min: color, max: color },
                end: {
                    min: [color[0], color[1], color[2], 0.0],
                    max: [color[0], color[1], color[2], 0.0],
                },
            },
            rotationSpeed: { min: -5, max: 5 },
            blendMode: "additive",
        });
    }
    /**
     * Magic/energy effect - swirling colorful particles
     */
    static magic(config = {}) {
        const intensity = config.intensity ?? 1.0;
        return new ParticleEmitter({
            maxParticles: Math.floor(300 * intensity),
            emissionRate: 40 * intensity,
            lifetime: { min: 1.0, max: 2.0 },
            velocity: {
                min: { x: -1, y: -1, z: 0 },
                max: { x: 1, y: 1, z: 0 },
            },
            drag: 0.7,
            size: {
                start: { min: 0.15, max: 0.25 },
                end: { min: 0.0, max: 0.05 },
            },
            color: {
                start: {
                    min: [0.5, 0.2, 1.0, 1.0],
                    max: [0.2, 0.8, 1.0, 1.0],
                },
                end: {
                    min: [1.0, 0.5, 1.0, 0.0],
                    max: [0.5, 1.0, 1.0, 0.0],
                },
            },
            rotationSpeed: { min: -8, max: 8 },
            blendMode: "additive",
        });
    }
    /**
     * Snow effect - gentle falling particles
     */
    static snow(config = {}) {
        const intensity = config.intensity ?? 1.0;
        const windSpeed = config.windSpeed ?? 0;
        return new ParticleEmitter({
            maxParticles: Math.floor(500 * intensity),
            emissionRate: 40 * intensity,
            lifetime: { min: 3.0, max: 5.0 },
            velocity: {
                min: { x: windSpeed - 0.3, y: -0.5, z: 0 },
                max: { x: windSpeed + 0.3, y: -1.0, z: 0 },
            },
            gravity: { x: 0, y: -0.2, z: 0 },
            drag: 0.3,
            size: { min: 0.08, max: 0.12 },
            color: {
                start: { min: [0.9, 0.9, 1.0, 0.8], max: [1.0, 1.0, 1.0, 1.0] },
                end: { min: [0.9, 0.9, 1.0, 0.5], max: [1.0, 1.0, 1.0, 0.7] },
            },
            rotationSpeed: { min: -2, max: 2 },
            blendMode: "normal",
        });
    }
    /**
     * Dust effect - small floating particles
     */
    static dust(config = {}) {
        const intensity = config.intensity ?? 1.0;
        return new ParticleEmitter({
            maxParticles: Math.floor(200 * intensity),
            emissionRate: 15 * intensity,
            lifetime: { min: 2.0, max: 4.0 },
            velocity: {
                min: { x: -0.3, y: -0.2, z: 0 },
                max: { x: 0.3, y: 0.2, z: 0 },
            },
            drag: 0.95,
            size: { min: 0.03, max: 0.06 },
            color: {
                start: {
                    min: [0.6, 0.5, 0.4, 0.3],
                    max: [0.7, 0.6, 0.5, 0.5],
                },
                end: {
                    min: [0.6, 0.5, 0.4, 0.0],
                    max: [0.7, 0.6, 0.5, 0.0],
                },
            },
            rotationSpeed: { min: -1, max: 1 },
            blendMode: "normal",
        });
    }
}
