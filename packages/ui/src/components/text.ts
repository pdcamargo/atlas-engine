/**
 * Text content component
 */
export class Text {
  constructor(public content: string = "") {}

  public set(content: string): this {
    this.content = content;
    return this;
  }
}

/**
 * Text styling component
 */
export class TextStyle {
  public fontSize?: string;
  public fontWeight?: number | string;
  public fontStyle?: "normal" | "italic" | "oblique";
  public fontFamily?: string;
  public lineHeight?: string;
  public letterSpacing?: string;
  public wordSpacing?: string;
  public textDecoration?: string;
  public textTransform?: "none" | "capitalize" | "uppercase" | "lowercase";
  public whiteSpace?:
    | "normal"
    | "nowrap"
    | "pre"
    | "pre-line"
    | "pre-wrap"
    | "break-spaces";

  constructor(config?: {
    fontSize?: number | string;
    fontWeight?: number | string;
    fontStyle?: "normal" | "italic" | "oblique";
    fontFamily?: string;
    lineHeight?: number | string;
    letterSpacing?: number | string;
    wordSpacing?: number | string;
    textDecoration?: string;
    textTransform?: "none" | "capitalize" | "uppercase" | "lowercase";
    whiteSpace?:
      | "normal"
      | "nowrap"
      | "pre"
      | "pre-line"
      | "pre-wrap"
      | "break-spaces";
  }) {
    if (config?.fontSize !== undefined) {
      this.fontSize =
        typeof config.fontSize === "number"
          ? `${config.fontSize}px`
          : config.fontSize;
    }
    if (config?.fontWeight !== undefined) {
      this.fontWeight = config.fontWeight;
    }
    if (config?.fontStyle) this.fontStyle = config.fontStyle;
    if (config?.fontFamily) this.fontFamily = config.fontFamily;
    if (config?.lineHeight !== undefined) {
      this.lineHeight =
        typeof config.lineHeight === "number"
          ? `${config.lineHeight}`
          : config.lineHeight;
    }
    if (config?.letterSpacing !== undefined) {
      this.letterSpacing =
        typeof config.letterSpacing === "number"
          ? `${config.letterSpacing}px`
          : config.letterSpacing;
    }
    if (config?.wordSpacing !== undefined) {
      this.wordSpacing =
        typeof config.wordSpacing === "number"
          ? `${config.wordSpacing}px`
          : config.wordSpacing;
    }
    if (config?.textDecoration) this.textDecoration = config.textDecoration;
    if (config?.textTransform) this.textTransform = config.textTransform;
    if (config?.whiteSpace) this.whiteSpace = config.whiteSpace;
  }
}

/**
 * Text color component
 */
export class TextColor {
  constructor(public color: string = "#000000") {}

  public set(color: string): this {
    this.color = color;
    return this;
  }
}

/**
 * Text alignment component
 */
export class TextAlign {
  public textAlign: "left" | "right" | "center" | "justify" | "start" | "end";
  public verticalAlign?:
    | "baseline"
    | "top"
    | "middle"
    | "bottom"
    | "text-top"
    | "text-bottom"
    | "sub"
    | "super";

  constructor(config?: {
    textAlign?: "left" | "right" | "center" | "justify" | "start" | "end";
    verticalAlign?:
      | "baseline"
      | "top"
      | "middle"
      | "bottom"
      | "text-top"
      | "text-bottom"
      | "sub"
      | "super";
  }) {
    this.textAlign = config?.textAlign ?? "left";
    if (config?.verticalAlign) this.verticalAlign = config.verticalAlign;
  }
}
