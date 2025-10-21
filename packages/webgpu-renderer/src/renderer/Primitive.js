import { Color } from "@atlas/core";
import { SceneNode } from "./SceneNode";
/**
 * Base class for primitives with solid colors
 */
export class Primitive extends SceneNode {
    color = new Color(1, 1, 1, 1);
    constructor(color, id) {
        super(id);
        if (color) {
            this.color.copyFrom(color);
        }
    }
    /**
     * Set the color of the primitive
     */
    setColor(r, g, b, a = 1) {
        this.color.set(r, g, b, a);
    }
}
/**
 * Square primitive (quad with solid color)
 */
export class Square extends Primitive {
    size;
    constructor(size = 1, color, id) {
        super(color, id);
        this.size = size;
    }
    /**
     * Set the size of the square
     */
    setSize(size) {
        this.size = size;
    }
}
