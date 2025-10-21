import { Texture } from "../renderer/Texture";
import type { GPUEmitterConfig, ParticleBlendMode } from "./ParticleConfig";
/**
 * Manages GPU resources for a particle emitter
 * Handles compute pipelines, render pipeline, and buffers
 */
export declare class ParticleSystem {
    private device;
    private format;
    readonly maxParticles: number;
    private particleBuffer?;
    private emitterConfigBuffer?;
    private simulationUniformBuffer?;
    private updatePipeline?;
    private emitPipeline?;
    private renderPipeline?;
    private updateBindGroup?;
    private emitBindGroup?;
    private renderBindGroup0?;
    private renderBindGroup1?;
    private vpMatrixBuffer?;
    private texture?;
    private defaultTexture?;
    private sampler?;
    private blendMode;
    private emissionAccumulator;
    private totalTime;
    constructor(device: GPUDevice, format: GPUTextureFormat, maxParticles: number, texture?: Texture, blendMode?: ParticleBlendMode);
    /**
     * Initialize GPU resources
     */
    initialize(): Promise<void>;
    /**
     * Create compute pipelines for update and emit
     */
    private createComputePipelines;
    /**
     * Create render pipeline for particle rendering
     */
    private createRenderPipeline;
    /**
     * Create bind groups for all pipelines
     */
    private createBindGroups;
    /**
     * Update emitter configuration
     */
    updateEmitterConfig(config: GPUEmitterConfig): void;
    /**
     * Update particle system (dispatch compute shaders)
     */
    update(deltaTime: number, emissionRate: number, enabled: boolean): void;
    /**
     * Render particles
     */
    render(renderPass: GPURenderPassEncoder, vpMatrix: Float32Array): void;
    /**
     * Destroy GPU resources
     */
    destroy(): void;
}
//# sourceMappingURL=ParticleSystem.d.ts.map