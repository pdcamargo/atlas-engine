import type { Handle } from "@atlas/core";
import { Color } from "../utils/color";

/**
 * Reference to a material for 2D rendering
 */
export class Material2D<T = any> {
  constructor(public material: Handle<T>) {}

  public static withHandle<T>(material: Handle<T>): Material2D<T> {
    return new Material2D(material);
  }
}

/**
 * Standard 2D material (color + texture)
 */
export class StandardMaterial2D {
  public baseColor: Color;
  public baseTexture?: Handle<any>;

  constructor(options?: { baseColor?: Color; baseTexture?: Handle<any> }) {
    this.baseColor = options?.baseColor ?? Color.WHITE;
    this.baseTexture = options?.baseTexture;
  }

  public static fromColor(color: Color): StandardMaterial2D {
    return new StandardMaterial2D({ baseColor: color });
  }

  public static fromTexture(texture: Handle<any>): StandardMaterial2D {
    return new StandardMaterial2D({ baseTexture: texture });
  }
}
