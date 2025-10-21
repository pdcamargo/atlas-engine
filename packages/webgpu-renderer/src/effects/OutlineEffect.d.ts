import { Color } from "@atlas/core";
import { Effect, EffectContext } from "./Effect";
import { Sprite } from "../renderer/Sprite";
/**
 * OutlineEffect - Renders an outline around sprites
 * The outline renders BEHIND the sprite (use negative order)
 */
export declare class OutlineEffect extends Effect {
    private pipeline?;
    private bindGroupLayout?;
    private uniformBuffer?;
    private textureViewCache;
    outlineColor: Color;
    outlineThickness: number;
    constructor(config?: {
        color?: Color;
        thickness?: number;
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
     * Render the outline effect for a sprite
     */
    render(sprite: Sprite, context: EffectContext): void;
}
//# sourceMappingURL=OutlineEffect.d.ts.map