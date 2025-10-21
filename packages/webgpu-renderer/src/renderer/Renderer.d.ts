import { Camera } from "./Camera";
import { SceneGraph } from "./SceneGraph";
import { PostProcessEffect } from "../post-processing/PostProcessEffect";
interface RendererOptions {
    canvas?: HTMLCanvasElement;
    clearColor?: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
}
export declare class WebgpuRenderer {
    #private;
    private device;
    private context;
    private format;
    private canvas;
    private clearColor;
    private spritePipeline;
    private spriteInstancedPipeline;
    private primitivePipeline;
    private uniformBufferPool?;
    private squareUniformBufferPool?;
    private float32Pool;
    private matrixPool;
    private textureViewCache;
    private bindGroupCache;
    private spriteBindGroupLayout?;
    private spriteInstancedBindGroupLayout?;
    private primitiveBindGroupLayout?;
    private batches;
    private quadBuffers;
    private vpMatrixBuffer?;
    private postProcessEffects;
    private sceneTexture?;
    private postProcessTextures;
    private drawCallCount;
    private renderedSpriteCount;
    private batchCount;
    private totalTiles;
    private renderedTiles;
    private skippedTiles;
    constructor(options?: RendererOptions);
    get gpu(): {
        device: GPUDevice;
        context: GPUCanvasContext;
        format: GPUTextureFormat;
    };
    isInitialized(): boolean;
    /**
     * Create a default canvas element
     */
    private createCanvas;
    /**
     * Initialize WebGPU device and resources
     */
    initialize(): Promise<void>;
    /**
     * Create render pipelines for sprites and primitives
     */
    private createPipelines;
    /**
     * Get alpha blend state for transparency
     */
    private getAlphaBlendState;
    /**
     * Get or create a cached texture view for a texture
     */
    private getOrCreateTextureView;
    /**
     * Build/update batches from the scene graph
     * Only marks batches dirty when sprites are added/removed, not every frame
     * Now batches by material + texture instead of just texture
     */
    private updateBatches;
    /**
     * Render the scene graph with the given camera
     */
    render(camera: Camera, sceneGraph: SceneGraph): void;
    /**
     * Render a batch using instanced rendering
     */
    private renderBatchInstanced;
    /**
     * Render a batch using individual draw calls
     */
    private renderBatchIndividual;
    /**
     * Render a single sprite (used for small batches)
     */
    private renderSprite;
    /**
     * Render a square primitive
     */
    private renderSquare;
    /**
     * Render effects for all sprites that have effects
     * @param preEffects - If true, render only effects with order < 0 (before base sprite)
     *                     If false, render only effects with order >= 0 (after base sprite)
     */
    private renderEffects;
    /**
     * Resize the canvas and update internal dimensions
     */
    resize(): void;
    setClearColor(r: number, g: number, b: number, a?: number): void;
    /**
     * Enable or disable frustum culling for all batches
     * Note: Frustum culling has CPU overhead and may not improve performance
     * for scenes with many small sprites that are mostly visible
     */
    setFrustumCulling(enabled: boolean): void;
    /**
     * Get rendering statistics from the last frame
     */
    getStats(): {
        drawCalls: number;
        renderedSprites: number;
        batches: number;
        totalBatches: number;
        totalTiles: number;
        renderedTiles: number;
        skippedTiles: number;
    };
    /**
     * Get the number of draw calls from the last frame
     */
    getDrawCallCount(): number;
    /**
     * Get the number of sprites rendered in the last frame
     */
    getRenderedSpriteCount(): number;
    /**
     * Get the number of batches processed in the last frame
     */
    getBatchCount(): number;
    /**
     * Compare two matrices for equality
     */
    private matricesEqual;
    /**
     * Get view bounds with padding to prevent tile popping
     * @param camera - The camera to get bounds from
     * @param paddingMultiplier - Multiplier for padding (1.5 = 50% extra on each side)
     */
    private getViewBoundsWithPadding;
    /**
     * Render a tilemap using chunk-based culling
     */
    private renderTileMap;
    /**
     * Render a particle emitter
     */
    private renderParticleEmitter;
    /**
     * Add a post-processing effect to the renderer
     */
    addPostProcessEffect(effect: PostProcessEffect): void;
    /**
     * Remove a post-processing effect from the renderer
     */
    removePostProcessEffect(effect: PostProcessEffect): void;
    /**
     * Get all post-processing effects
     */
    getPostProcessEffects(): PostProcessEffect[];
    /**
     * Get enabled post-processing effects
     */
    getEnabledPostProcessEffects(): PostProcessEffect[];
    /**
     * Clear all post-processing effects
     */
    clearPostProcessEffects(): void;
    /**
     * Create or recreate render target textures for post-processing
     */
    private updateRenderTargets;
    /**
     * Apply post-processing effects chain
     */
    private applyPostProcessing;
}
export {};
//# sourceMappingURL=Renderer.d.ts.map