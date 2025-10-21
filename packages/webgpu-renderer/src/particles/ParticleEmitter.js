import { SceneNode } from "../renderer/SceneNode";
import { ParticleSystem } from "./ParticleSystem";
import { normalizeRange, normalizeVector3Range, normalizeColorRange, } from "./ParticleConfig";
/**
 * Particle Emitter - SceneNode that emits and manages particles
 * Extends SceneNode so it can be added to scene graphs and spawned to ECS
 */
export class ParticleEmitter extends SceneNode {
    particleSystem;
    config;
    gpuConfig;
    // Emission control
    enabled;
    emissionTime = 0;
    duration;
    loop;
    // GPU resources flag
    initialized = false;
    initializing = false;
    constructor(config) {
        super();
        this.config = config;
        this.enabled = config.enabled ?? true;
        this.loop = config.loop ?? true;
        this.duration = config.duration ?? Infinity;
        // Build GPU config from user config
        this.gpuConfig = this.buildGPUConfig(config);
    }
    /**
     * Initialize GPU resources (called by renderer/ECS system)
     */
    async initialize(device, format) {
        if (this.initialized || this.initializing)
            return;
        this.initializing = true;
        this.particleSystem = new ParticleSystem(device, format, this.config.maxParticles, this.config.texture, this.config.blendMode ?? "normal");
        await this.particleSystem.initialize();
        // Upload initial config
        this.particleSystem.updateEmitterConfig(this.gpuConfig);
        this.initialized = true;
        this.initializing = false;
    }
    /**
     * Update particles (called by ECS system)
     */
    update(deltaTime) {
        if (!this.particleSystem || !this.initialized)
            return;
        // Update emission time
        this.emissionTime += deltaTime;
        // Check if emission should stop (non-looping emitters)
        let shouldEmit = this.enabled;
        if (!this.loop && this.emissionTime >= this.duration) {
            shouldEmit = false;
        }
        // Update GPU config with current emitter position
        const worldPos = this.getWorldPosition();
        this.gpuConfig.position[0] = worldPos.x;
        this.gpuConfig.position[1] = worldPos.y;
        this.gpuConfig.position[2] = worldPos.z;
        this.particleSystem.updateEmitterConfig(this.gpuConfig);
        // Update particles on GPU
        const emissionRate = this.config.emissionRate ?? 10;
        this.particleSystem.update(deltaTime, emissionRate, shouldEmit);
    }
    /**
     * Render particles (called by renderer)
     */
    render(renderPass, vpMatrix) {
        if (!this.particleSystem || !this.initialized)
            return;
        this.particleSystem.render(renderPass, vpMatrix);
    }
    /**
     * Update emitter configuration dynamically
     */
    updateConfig(config) {
        // Merge with existing config
        this.config = { ...this.config, ...config };
        // Rebuild GPU config
        this.gpuConfig = this.buildGPUConfig(this.config);
        // Upload to GPU if initialized
        if (this.particleSystem) {
            this.particleSystem.updateEmitterConfig(this.gpuConfig);
        }
    }
    /**
     * Emit a burst of particles
     */
    burst(count, customizer) {
        // TODO: Implement burst emission
        // For now, we can simulate by temporarily increasing emission rate
        console.warn("ParticleEmitter.burst() not yet implemented");
    }
    /**
     * Stop emitting particles (existing particles continue to live)
     */
    stop() {
        this.enabled = false;
    }
    /**
     * Start emitting particles
     */
    start() {
        this.enabled = true;
        this.emissionTime = 0;
    }
    /**
     * Restart emitter from beginning
     */
    restart() {
        this.emissionTime = 0;
        this.enabled = true;
    }
    /**
     * Kill all active particles immediately
     */
    killAll() {
        // TODO: Implement by resetting particle buffer
        console.warn("ParticleEmitter.killAll() not yet implemented");
    }
    /**
     * Check if emitter is initialized
     */
    isInitialized() {
        return this.initialized;
    }
    /**
     * Get the particle system (for advanced usage)
     */
    getParticleSystem() {
        return this.particleSystem;
    }
    /**
     * Build GPU config from user-friendly config
     */
    buildGPUConfig(config) {
        // Normalize ranges
        const lifetime = normalizeRange(config.lifetime ?? { min: 1.0, max: 2.0 });
        const velocity = normalizeVector3Range(config.velocity ?? { x: 0, y: 1, z: 0 });
        // Handle size config (can be number, range, or {start, end})
        let startSizeMin = 0.5;
        let startSizeMax = 0.5;
        let endSizeMin = 0.1;
        let endSizeMax = 0.1;
        if (config.size) {
            if (typeof config.size === "number") {
                startSizeMin = startSizeMax = config.size;
                endSizeMin = endSizeMax = config.size;
            }
            else if ("min" in config.size && "max" in config.size) {
                // It's a RangeConfig
                startSizeMin = config.size.min;
                startSizeMax = config.size.max;
                endSizeMin = config.size.min;
                endSizeMax = config.size.max;
            }
            else if ("start" in config.size && "end" in config.size) {
                // It's {start, end}
                const startRange = normalizeRange(config.size.start);
                const endRange = normalizeRange(config.size.end);
                startSizeMin = startRange.min;
                startSizeMax = startRange.max;
                endSizeMin = endRange.min;
                endSizeMax = endRange.max;
            }
        }
        // Handle color config
        const defaultStartColor = [1, 1, 1, 1];
        const defaultEndColor = [1, 1, 1, 0];
        const startColor = config.color?.start
            ? normalizeColorRange(config.color.start)
            : { min: defaultStartColor, max: defaultStartColor };
        const endColor = config.color?.end
            ? normalizeColorRange(config.color.end)
            : { min: defaultEndColor, max: defaultEndColor };
        // Handle rotation
        const rotationSpeed = normalizeRange(config.rotationSpeed ?? { min: 0, max: 0 });
        const worldPos = this.getWorldPosition();
        return {
            position: new Float32Array([worldPos.x, worldPos.y, worldPos.z]),
            gravity: new Float32Array([
                config.gravity?.x ?? 0,
                config.gravity?.y ?? 0,
                config.gravity?.z ?? 0,
            ]),
            windForce: new Float32Array([
                config.wind?.x ?? 0,
                config.wind?.y ?? 0,
                config.wind?.z ?? 0,
            ]),
            velocityMin: new Float32Array([
                velocity.min.x,
                velocity.min.y,
                velocity.min.z ?? 0,
            ]),
            velocityMax: new Float32Array([
                velocity.max.x,
                velocity.max.y,
                velocity.max.z ?? 0,
            ]),
            lifetimeMin: lifetime.min,
            lifetimeMax: lifetime.max,
            startSizeMin,
            startSizeMax,
            endSizeMin,
            endSizeMax,
            rotationSpeedMin: rotationSpeed.min,
            rotationSpeedMax: rotationSpeed.max,
            drag: config.drag ?? 0,
            emissionRate: config.emissionRate ?? 10,
            startColorMin: new Float32Array(startColor.min),
            startColorMax: new Float32Array(startColor.max),
            endColorMin: new Float32Array(endColor.min),
            endColorMax: new Float32Array(endColor.max),
        };
    }
    /**
     * Cleanup GPU resources
     */
    destroy() {
        this.particleSystem?.destroy();
        this.initialized = false;
    }
}
