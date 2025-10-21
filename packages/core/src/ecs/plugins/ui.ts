import { App, EcsPlugin } from "../..";

export class ElementClickedEvent<TData = any> {
  constructor(
    public element: UiContainer,
    public data?: TData
  ) {}
}

export const UiSet2 = Symbol("UiSet2");

export class UiContainer {
  #element: HTMLElement;

  constructor(parent?: string | HTMLElement | UiContainer, tag = "div") {
    this.#element = document.createElement(tag);

    const finalParent =
      (typeof parent === "string" ? document.querySelector(parent) : parent) ??
      document.body;

    if (finalParent instanceof UiContainer) {
      finalParent.element.appendChild(this.#element);
    } else {
      finalParent.appendChild(this.#element);
    }
  }

  public get element() {
    return this.#element;
  }

  public setTextContent(textContent: string) {
    this.#element.textContent = textContent;

    return this;
  }

  public setInnerHTML(innerHTML: string) {
    this.#element.innerHTML = innerHTML;

    return this;
  }

  public get textContent() {
    return this.#element.textContent;
  }

  public setColor(color: string) {
    this.#element.style.color = color;

    return this;
  }

  public setBackgroundColor(color: string) {
    this.#element.style.backgroundColor = color;

    return this;
  }

  public setFlex(flex: string | number) {
    this.#element.style.flex = typeof flex === "number" ? `${flex}` : flex;

    return this;
  }

  public setFlexGrow(flexGrow: string | number) {
    this.#element.style.flexGrow =
      typeof flexGrow === "number" ? `${flexGrow}` : flexGrow;

    return this;
  }

  public setFlexShrink(flexShrink: string | number) {
    this.#element.style.flexShrink =
      typeof flexShrink === "number" ? `${flexShrink}` : flexShrink;

    return this;
  }

  public setFlexBasis(flexBasis: string | number) {
    this.#element.style.flexBasis =
      typeof flexBasis === "number" ? `${flexBasis}` : flexBasis;

    return this;
  }

  public setGap(gap: string | number) {
    this.#element.style.gap = typeof gap === "number" ? `${gap}px` : gap;

    return this;
  }

  public setDirection(direction: "row" | "column") {
    this.#element.style.flexDirection = direction;

    return this;
  }

  public setWrap(wrap: "wrap" | "nowrap" | "wrap-reverse") {
    this.#element.style.flexWrap = wrap;

    return this;
  }

  public setJustifyContent(
    justifyContent:
      | "flex-start"
      | "flex-end"
      | "center"
      | "space-between"
      | "space-around"
      | "space-evenly"
  ) {
    this.#element.style.justifyContent = justifyContent;

    return this;
  }

  public setAlignItems(
    alignItems: "flex-start" | "flex-end" | "center" | "baseline" | "stretch"
  ) {
    this.#element.style.alignItems = alignItems;

    return this;
  }

  public setAlignContent(
    alignContent:
      | "flex-start"
      | "flex-end"
      | "center"
      | "space-between"
      | "space-around"
      | "stretch"
  ) {
    this.#element.style.alignContent = alignContent;

    return this;
  }

  public setPosition(
    position: "static" | "relative" | "absolute" | "fixed" | "sticky"
  ) {
    this.#element.style.position = position;

    return this;
  }

  public setTop(top: string | number) {
    this.#element.style.top = typeof top === "number" ? `${top}px` : top;

    return this;
  }

  public setLeft(left: string | number) {
    this.#element.style.left = typeof left === "number" ? `${left}px` : left;

    return this;
  }

  public setRight(right: string | number) {
    this.#element.style.right =
      typeof right === "number" ? `${right}px` : right;

    return this;
  }

  public setBottom(bottom: string | number) {
    this.#element.style.bottom =
      typeof bottom === "number" ? `${bottom}px` : bottom;

    return this;
  }

  public setPadding(padding: string | number) {
    this.#element.style.padding =
      typeof padding === "number" ? `${padding}px` : padding;

    return this;
  }

  public setMargin(margin: string | number) {
    this.#element.style.margin =
      typeof margin === "number" ? `${margin}px` : margin;

    return this;
  }

  public setWidth(width: string | number) {
    this.#element.style.width =
      typeof width === "number" ? `${width}px` : width;

    return this;
  }

  public setHeight(height: string | number) {
    this.#element.style.height =
      typeof height === "number" ? `${height}px` : height;

    return this;
  }

  public setMinWidth(minWidth: string | number) {
    this.#element.style.minWidth =
      typeof minWidth === "number" ? `${minWidth}px` : minWidth;

    return this;
  }

  public setMinHeight(minHeight: string | number) {
    this.#element.style.minHeight =
      typeof minHeight === "number" ? `${minHeight}px` : minHeight;

    return this;
  }

  public setMaxWidth(maxWidth: string | number) {
    this.#element.style.maxWidth =
      typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;

    return this;
  }

  public setMaxHeight(maxHeight: string | number) {
    this.#element.style.maxHeight =
      typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;

    return this;
  }

  public setOverflow(
    overflow: "visible" | "hidden" | "clip" | "scroll" | "auto"
  ) {
    this.#element.style.overflow = overflow;

    return this;
  }

  public setOverflowX(
    overflowX: "visible" | "hidden" | "clip" | "scroll" | "auto"
  ) {
    this.#element.style.overflowX = overflowX;

    return this;
  }

  public setOverflowY(
    overflowY: "visible" | "hidden" | "clip" | "scroll" | "auto"
  ) {
    this.#element.style.overflowY = overflowY;

    return this;
  }
}

export class FlexContainer extends UiContainer {
  constructor(parent?: string | HTMLElement | UiContainer) {
    super(parent);

    this.element.style.display = "flex";
    this.element.style.flexDirection = "row";
    this.element.style.flexWrap = "wrap";
  }
}

export class Button extends UiContainer {
  constructor(parent?: string | HTMLElement | UiContainer) {
    super(parent, "button");
  }
}

export class UiPlugin2 implements EcsPlugin {
  constructor() {}

  public async build(app: App) {
    app.addEvent(ElementClickedEvent);
  }
}
