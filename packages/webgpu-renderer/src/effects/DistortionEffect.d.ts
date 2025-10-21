import { Color } from "@atlas/core";
import { Effect, EffectContext } from "./Effect";
import { Sprite } from "../renderer/Sprite";
/**
 * Distortion types
 */
export declare enum DistortionType {
    Horizontal = 0,
    Vertical = 1,
    Radial = 2
}
/**
 * DistortionEffect - Applies wave distortion to sprites
 * Distorts the sprite's UVs to create wave effects
 */
export declare class DistortionEffect extends Effect {
    private pipeline?;
    private bindGroupLayout?;
    private uniformBuffer?;
    private textureViewCache;
    waveFrequency: number;
    waveAmplitude: number;
    time: number;
    distortionType: DistortionType;
    tint: Color;
    constructor(config?: {
        frequency?: number;
        amplitude?: number;
        type?: DistortionType;
        tint?: Color;
        order?: number;
    });
    /**
     * Get or create the render pipeline
     */
    private getPipeline;
    /**
     * Get or create texture view
     */
    private getOrCreateTextureView;
    /**
     * Render the distortion effect for a sprite
     */
    render(sprite: Sprite, context: EffectContext): void;
}
//# sourceMappingURL=DistortionEffect.d.ts.map