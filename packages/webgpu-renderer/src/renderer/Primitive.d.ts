import { Color } from "@atlas/core";
import { SceneNode } from "./SceneNode";
/**
 * Base class for primitives with solid colors
 */
export declare abstract class Primitive extends SceneNode {
    color: Color;
    constructor(color?: Color, id?: string);
    /**
     * Set the color of the primitive
     */
    setColor(r: number, g: number, b: number, a?: number): void;
}
/**
 * Square primitive (quad with solid color)
 */
export declare class Square extends Primitive {
    size: number;
    constructor(size?: number, color?: Color, id?: string);
    /**
     * Set the size of the square
     */
    setSize(size: number): void;
}
//# sourceMappingURL=Primitive.d.ts.map