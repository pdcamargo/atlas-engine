/**
 * Spacing configuration for margin and padding
 */
export type SpacingValue =
  | number
  | string
  | {
      top?: number | string;
      right?: number | string;
      bottom?: number | string;
      left?: number | string;
      all?: number | string;
      horizontal?: number | string;
      vertical?: number | string;
    };

function normalizeSpacing(value: SpacingValue): string {
  if (typeof value === "number") {
    return `${value}px`;
  }
  if (typeof value === "string") {
    return value;
  }

  const parts: string[] = [];

  // Handle shorthand properties first
  if (value.all !== undefined) {
    return typeof value.all === "number" ? `${value.all}px` : value.all;
  }

  if (value.vertical !== undefined || value.horizontal !== undefined) {
    const v =
      value.vertical !== undefined
        ? typeof value.vertical === "number"
          ? `${value.vertical}px`
          : value.vertical
        : "0";
    const h =
      value.horizontal !== undefined
        ? typeof value.horizontal === "number"
          ? `${value.horizontal}px`
          : value.horizontal
        : "0";
    return `${v} ${h}`;
  }

  // Handle individual sides
  const top =
    value.top !== undefined
      ? typeof value.top === "number"
        ? `${value.top}px`
        : value.top
      : "0";
  const right =
    value.right !== undefined
      ? typeof value.right === "number"
        ? `${value.right}px`
        : value.right
      : "0";
  const bottom =
    value.bottom !== undefined
      ? typeof value.bottom === "number"
        ? `${value.bottom}px`
        : value.bottom
      : "0";
  const left =
    value.left !== undefined
      ? typeof value.left === "number"
        ? `${value.left}px`
        : value.left
      : "0";

  return `${top} ${right} ${bottom} ${left}`;
}

/**
 * Spacing component for margin and padding
 */
export class Spacing {
  public margin?: string;
  public padding?: string;

  constructor(config?: { margin?: SpacingValue; padding?: SpacingValue }) {
    if (config?.margin !== undefined) {
      this.margin = normalizeSpacing(config.margin);
    }
    if (config?.padding !== undefined) {
      this.padding = normalizeSpacing(config.padding);
    }
  }

  public setMargin(value: SpacingValue): this {
    this.margin = normalizeSpacing(value);
    return this;
  }

  public setPadding(value: SpacingValue): this {
    this.padding = normalizeSpacing(value);
    return this;
  }
}

/**
 * Size component for width and height
 */
export class Size {
  public width?: string;
  public height?: string;
  public minWidth?: string;
  public minHeight?: string;
  public maxWidth?: string;
  public maxHeight?: string;

  constructor(config?: {
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;
    maxWidth?: number | string;
    maxHeight?: number | string;
  }) {
    if (config?.width !== undefined) {
      this.width =
        typeof config.width === "number" ? `${config.width}px` : config.width;
    }
    if (config?.height !== undefined) {
      this.height =
        typeof config.height === "number"
          ? `${config.height}px`
          : config.height;
    }
    if (config?.minWidth !== undefined) {
      this.minWidth =
        typeof config.minWidth === "number"
          ? `${config.minWidth}px`
          : config.minWidth;
    }
    if (config?.minHeight !== undefined) {
      this.minHeight =
        typeof config.minHeight === "number"
          ? `${config.minHeight}px`
          : config.minHeight;
    }
    if (config?.maxWidth !== undefined) {
      this.maxWidth =
        typeof config.maxWidth === "number"
          ? `${config.maxWidth}px`
          : config.maxWidth;
    }
    if (config?.maxHeight !== undefined) {
      this.maxHeight =
        typeof config.maxHeight === "number"
          ? `${config.maxHeight}px`
          : config.maxHeight;
    }
  }
}

/**
 * Flexbox layout component
 */
export class FlexLayout {
  public display: "flex" | "inline-flex" = "flex";
  public direction?: "row" | "row-reverse" | "column" | "column-reverse";
  public wrap?: "nowrap" | "wrap" | "wrap-reverse";
  public justifyContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
  public alignItems?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "baseline"
    | "stretch";
  public alignContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "stretch";
  public gap?: string;
  public rowGap?: string;
  public columnGap?: string;

  constructor(config?: {
    display?: "flex" | "inline-flex";
    direction?: "row" | "row-reverse" | "column" | "column-reverse";
    wrap?: "nowrap" | "wrap" | "wrap-reverse";
    justifyContent?:
      | "flex-start"
      | "flex-end"
      | "center"
      | "space-between"
      | "space-around"
      | "space-evenly";
    alignItems?:
      | "flex-start"
      | "flex-end"
      | "center"
      | "baseline"
      | "stretch";
    alignContent?:
      | "flex-start"
      | "flex-end"
      | "center"
      | "space-between"
      | "space-around"
      | "stretch";
    gap?: number | string;
    rowGap?: number | string;
    columnGap?: number | string;
  }) {
    if (config?.display) this.display = config.display;
    if (config?.direction) this.direction = config.direction;
    if (config?.wrap) this.wrap = config.wrap;
    if (config?.justifyContent) this.justifyContent = config.justifyContent;
    if (config?.alignItems) this.alignItems = config.alignItems;
    if (config?.alignContent) this.alignContent = config.alignContent;
    if (config?.gap !== undefined) {
      this.gap = typeof config.gap === "number" ? `${config.gap}px` : config.gap;
    }
    if (config?.rowGap !== undefined) {
      this.rowGap =
        typeof config.rowGap === "number" ? `${config.rowGap}px` : config.rowGap;
    }
    if (config?.columnGap !== undefined) {
      this.columnGap =
        typeof config.columnGap === "number"
          ? `${config.columnGap}px`
          : config.columnGap;
    }
  }
}

/**
 * Position component for absolute/relative positioning
 */
export class Position {
  public position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  public top?: string;
  public right?: string;
  public bottom?: string;
  public left?: string;
  public zIndex?: number;

  constructor(config?: {
    position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;
    zIndex?: number;
  }) {
    if (config?.position) this.position = config.position;
    if (config?.top !== undefined) {
      this.top = typeof config.top === "number" ? `${config.top}px` : config.top;
    }
    if (config?.right !== undefined) {
      this.right =
        typeof config.right === "number" ? `${config.right}px` : config.right;
    }
    if (config?.bottom !== undefined) {
      this.bottom =
        typeof config.bottom === "number" ? `${config.bottom}px` : config.bottom;
    }
    if (config?.left !== undefined) {
      this.left =
        typeof config.left === "number" ? `${config.left}px` : config.left;
    }
    if (config?.zIndex !== undefined) this.zIndex = config.zIndex;
  }
}

/**
 * Flex item properties
 */
export class FlexItem {
  public flex?: string;
  public flexGrow?: number;
  public flexShrink?: number;
  public flexBasis?: string;
  public alignSelf?:
    | "auto"
    | "flex-start"
    | "flex-end"
    | "center"
    | "baseline"
    | "stretch";
  public order?: number;

  constructor(config?: {
    flex?: string;
    flexGrow?: number;
    flexShrink?: number;
    flexBasis?: number | string;
    alignSelf?:
      | "auto"
      | "flex-start"
      | "flex-end"
      | "center"
      | "baseline"
      | "stretch";
    order?: number;
  }) {
    if (config?.flex) this.flex = config.flex;
    if (config?.flexGrow !== undefined) this.flexGrow = config.flexGrow;
    if (config?.flexShrink !== undefined) this.flexShrink = config.flexShrink;
    if (config?.flexBasis !== undefined) {
      this.flexBasis =
        typeof config.flexBasis === "number"
          ? `${config.flexBasis}px`
          : config.flexBasis;
    }
    if (config?.alignSelf) this.alignSelf = config.alignSelf;
    if (config?.order !== undefined) this.order = config.order;
  }
}
