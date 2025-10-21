/**
 * Background styling component
 */
export class Background {
  public color?: string;
  public image?: string;
  public size?: string;
  public position?: string;
  public repeat?: string;
  public attachment?: string;
  public clip?: string;
  public origin?: string;

  constructor(config?: {
    color?: string;
    image?: string;
    size?: string;
    position?: string;
    repeat?: string;
    attachment?: string;
    clip?: string;
    origin?: string;
  }) {
    if (config?.color) this.color = config.color;
    if (config?.image) this.image = config.image;
    if (config?.size) this.size = config.size;
    if (config?.position) this.position = config.position;
    if (config?.repeat) this.repeat = config.repeat;
    if (config?.attachment) this.attachment = config.attachment;
    if (config?.clip) this.clip = config.clip;
    if (config?.origin) this.origin = config.origin;
  }
}

/**
 * Border styling component
 */
export class Border {
  public width?: string;
  public style?:
    | "none"
    | "hidden"
    | "dotted"
    | "dashed"
    | "solid"
    | "double"
    | "groove"
    | "ridge"
    | "inset"
    | "outset";
  public color?: string;
  public radius?: string;

  // Individual sides
  public topWidth?: string;
  public rightWidth?: string;
  public bottomWidth?: string;
  public leftWidth?: string;

  public topStyle?: string;
  public rightStyle?: string;
  public bottomStyle?: string;
  public leftStyle?: string;

  public topColor?: string;
  public rightColor?: string;
  public bottomColor?: string;
  public leftColor?: string;

  // Individual corners for radius
  public topLeftRadius?: string;
  public topRightRadius?: string;
  public bottomRightRadius?: string;
  public bottomLeftRadius?: string;

  constructor(config?: {
    width?: number | string;
    style?:
      | "none"
      | "hidden"
      | "dotted"
      | "dashed"
      | "solid"
      | "double"
      | "groove"
      | "ridge"
      | "inset"
      | "outset";
    color?: string;
    radius?: number | string;
    topWidth?: number | string;
    rightWidth?: number | string;
    bottomWidth?: number | string;
    leftWidth?: number | string;
    topStyle?: string;
    rightStyle?: string;
    bottomStyle?: string;
    leftStyle?: string;
    topColor?: string;
    rightColor?: string;
    bottomColor?: string;
    leftColor?: string;
    topLeftRadius?: number | string;
    topRightRadius?: number | string;
    bottomRightRadius?: number | string;
    bottomLeftRadius?: number | string;
  }) {
    if (config?.width !== undefined) {
      this.width =
        typeof config.width === "number" ? `${config.width}px` : config.width;
    }
    if (config?.style) this.style = config.style;
    if (config?.color) this.color = config.color;
    if (config?.radius !== undefined) {
      this.radius =
        typeof config.radius === "number" ? `${config.radius}px` : config.radius;
    }

    // Individual sides
    if (config?.topWidth !== undefined) {
      this.topWidth =
        typeof config.topWidth === "number"
          ? `${config.topWidth}px`
          : config.topWidth;
    }
    if (config?.rightWidth !== undefined) {
      this.rightWidth =
        typeof config.rightWidth === "number"
          ? `${config.rightWidth}px`
          : config.rightWidth;
    }
    if (config?.bottomWidth !== undefined) {
      this.bottomWidth =
        typeof config.bottomWidth === "number"
          ? `${config.bottomWidth}px`
          : config.bottomWidth;
    }
    if (config?.leftWidth !== undefined) {
      this.leftWidth =
        typeof config.leftWidth === "number"
          ? `${config.leftWidth}px`
          : config.leftWidth;
    }

    if (config?.topStyle) this.topStyle = config.topStyle;
    if (config?.rightStyle) this.rightStyle = config.rightStyle;
    if (config?.bottomStyle) this.bottomStyle = config.bottomStyle;
    if (config?.leftStyle) this.leftStyle = config.leftStyle;

    if (config?.topColor) this.topColor = config.topColor;
    if (config?.rightColor) this.rightColor = config.rightColor;
    if (config?.bottomColor) this.bottomColor = config.bottomColor;
    if (config?.leftColor) this.leftColor = config.leftColor;

    // Individual corners
    if (config?.topLeftRadius !== undefined) {
      this.topLeftRadius =
        typeof config.topLeftRadius === "number"
          ? `${config.topLeftRadius}px`
          : config.topLeftRadius;
    }
    if (config?.topRightRadius !== undefined) {
      this.topRightRadius =
        typeof config.topRightRadius === "number"
          ? `${config.topRightRadius}px`
          : config.topRightRadius;
    }
    if (config?.bottomRightRadius !== undefined) {
      this.bottomRightRadius =
        typeof config.bottomRightRadius === "number"
          ? `${config.bottomRightRadius}px`
          : config.bottomRightRadius;
    }
    if (config?.bottomLeftRadius !== undefined) {
      this.bottomLeftRadius =
        typeof config.bottomLeftRadius === "number"
          ? `${config.bottomLeftRadius}px`
          : config.bottomLeftRadius;
    }
  }
}

/**
 * Box shadow component
 */
export class Shadow {
  public boxShadow?: string;
  public textShadow?: string;

  constructor(config?: { boxShadow?: string; textShadow?: string }) {
    if (config?.boxShadow) this.boxShadow = config.boxShadow;
    if (config?.textShadow) this.textShadow = config.textShadow;
  }

  public static box(
    offsetX: number,
    offsetY: number,
    blur: number,
    spread: number,
    color: string,
    inset = false
  ): Shadow {
    const shadow = `${inset ? "inset " : ""}${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`;
    return new Shadow({ boxShadow: shadow });
  }

  public static text(
    offsetX: number,
    offsetY: number,
    blur: number,
    color: string
  ): Shadow {
    const shadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`;
    return new Shadow({ textShadow: shadow });
  }
}

/**
 * Overflow control component
 */
export class Overflow {
  public overflow?: "visible" | "hidden" | "clip" | "scroll" | "auto";
  public overflowX?: "visible" | "hidden" | "clip" | "scroll" | "auto";
  public overflowY?: "visible" | "hidden" | "clip" | "scroll" | "auto";

  constructor(config?: {
    overflow?: "visible" | "hidden" | "clip" | "scroll" | "auto";
    overflowX?: "visible" | "hidden" | "clip" | "scroll" | "auto";
    overflowY?: "visible" | "hidden" | "clip" | "scroll" | "auto";
  }) {
    if (config?.overflow) this.overflow = config.overflow;
    if (config?.overflowX) this.overflowX = config.overflowX;
    if (config?.overflowY) this.overflowY = config.overflowY;
  }
}

/**
 * Opacity component
 */
export class Opacity {
  public value: number;

  constructor(value: number = 1.0) {
    this.value = Math.max(0, Math.min(1, value));
  }

  public set(value: number): this {
    this.value = Math.max(0, Math.min(1, value));
    return this;
  }
}

/**
 * Cursor style component
 */
export class Cursor {
  public cursor:
    | "auto"
    | "default"
    | "pointer"
    | "wait"
    | "text"
    | "move"
    | "not-allowed"
    | "help"
    | "crosshair"
    | "grab"
    | "grabbing"
    | string;

  constructor(
    cursor:
      | "auto"
      | "default"
      | "pointer"
      | "wait"
      | "text"
      | "move"
      | "not-allowed"
      | "help"
      | "crosshair"
      | "grab"
      | "grabbing"
      | string = "default"
  ) {
    this.cursor = cursor;
  }
}
