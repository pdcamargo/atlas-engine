import type { Entity } from "@atlas/core";

/**
 * Marks an entity as a UI element and holds the reference to its DOM element.
 * This is automatically managed by the DOM sync system.
 */
export class UiNode {
  public element: HTMLElement | null = null;
  public mounted = false;

  constructor() {}
}

/**
 * Specifies the HTML tag type for this UI element.
 * Common tags: 'div', 'button', 'span', 'p', 'h1', 'input', etc.
 */
export class UiElement {
  constructor(public tag: string = "div") {}
}

/**
 * Marks a UI element as a root container.
 * Root elements are mounted to a specified parent selector or document.body.
 */
export class UiRoot {
  constructor(
    public parentSelector: string | HTMLElement = document.body
  ) {}
}

/**
 * CSS class names to apply to the element
 */
export class UiClass {
  public classes: Set<string>;

  constructor(...classNames: string[]) {
    this.classes = new Set(classNames);
  }

  public add(...classNames: string[]): this {
    for (const name of classNames) {
      this.classes.add(name);
    }
    return this;
  }

  public remove(...classNames: string[]): this {
    for (const name of classNames) {
      this.classes.delete(name);
    }
    return this;
  }

  public has(className: string): boolean {
    return this.classes.has(className);
  }

  public toArray(): string[] {
    return Array.from(this.classes);
  }
}

/**
 * Custom inline styles as a key-value map
 */
export class UiStyle {
  constructor(public styles: Record<string, string> = {}) {}

  public set(property: string, value: string): this {
    this.styles[property] = value;
    return this;
  }

  public remove(property: string): this {
    delete this.styles[property];
    return this;
  }

  public get(property: string): string | undefined {
    return this.styles[property];
  }
}
