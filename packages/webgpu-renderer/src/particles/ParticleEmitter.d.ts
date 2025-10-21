import { SceneNode } from "../renderer/SceneNode";
import { ParticleSystem } from "./ParticleSystem";
import { ParticleEmitterConfig } from "./ParticleConfig";
/**
 * Particle Emitter - SceneNode that emits and manages particles
 * Extends SceneNode so it can be added to scene graphs and spawned to ECS
 */
export declare class ParticleEmitter extends SceneNode {
    private particleSystem?;
    private config;
    private gpuConfig;
    enabled: boolean;
    private emissionTime;
    private duration;
    private loop;
    private initialized;
    private initializing;
    constructor(config: ParticleEmitterConfig);
    /**
     * Initialize GPU resources (called by renderer/ECS system)
     */
    initialize(device: GPUDevice, format: GPUTextureFormat): Promise<void>;
    /**
     * Update particles (called by ECS system)
     */
    update(deltaTime: number): void;
    /**
     * Render particles (called by renderer)
     */
    render(renderPass: GPURenderPassEncoder, vpMatrix: Float32Array): void;
    /**
     * Update emitter configuration dynamically
     */
    updateConfig(config: Partial<ParticleEmitterConfig>): void;
    /**
     * Emit a burst of particles
     */
    burst(count: number, customizer?: (index: number) => Partial<ParticleEmitterConfig>): void;
    /**
     * Stop emitting particles (existing particles continue to live)
     */
    stop(): void;
    /**
     * Start emitting particles
     */
    start(): void;
    /**
     * Restart emitter from beginning
     */
    restart(): void;
    /**
     * Kill all active particles immediately
     */
    killAll(): void;
    /**
     * Check if emitter is initialized
     */
    isInitialized(): boolean;
    /**
     * Get the particle system (for advanced usage)
     */
    getParticleSystem(): ParticleSystem | undefined;
    /**
     * Build GPU config from user-friendly config
     */
    private buildGPUConfig;
    /**
     * Cleanup GPU resources
     */
    destroy(): void;
}
//# sourceMappingURL=ParticleEmitter.d.ts.map