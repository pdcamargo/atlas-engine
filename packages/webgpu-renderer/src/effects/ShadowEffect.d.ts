import { Color, Vector2, Vector2Like } from "@atlas/core";
import { Effect, EffectContext } from "./Effect";
import { Sprite } from "../renderer/Sprite";
/**
 * ShadowEffect - Renders a pixelated oval shadow beneath sprites
 * Perfect for 2D platformers and top-down games
 */
export declare class ShadowEffect extends Effect {
    private pipeline?;
    private bindGroupLayout?;
    private uniformBuffer?;
    shadowColor: Color;
    distance: number;
    offset: Vector2;
    pixelation: number;
    scale: Vector2;
    constructor(config?: {
        color?: Color;
        distance?: number;
        offset?: Vector2Like;
        pixelation?: number;
        scale?: Vector2Like;
        order?: number;
    });
    /**
     * Set shadow distance from ground
     * @param distance 0 = on ground (large, opaque), 1 = high above (small, transparent)
     */
    setDistance(distance: number): void;
    /**
     * Set shadow offset from sprite bottom-center
     */
    setOffset(offset: Vector2Like): void;
    /**
     * Set shadow scale
     * @param scale x = width scale (e.g., 0.4 = 40% of sprite width), y = height scale
     */
    setScale(scale: Vector2Like): void;
    /**
     * Get or create the render pipeline
     */
    private getPipeline;
    /**
     * Render the shadow effect for a sprite
     */
    render(sprite: Sprite, context: EffectContext): void;
}
//# sourceMappingURL=ShadowEffect.d.ts.map