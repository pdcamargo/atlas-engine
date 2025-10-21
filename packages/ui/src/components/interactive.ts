import type { Entity } from "@atlas/core";

/**
 * Marks an entity as interactive (listens to DOM events)
 */
export class Interactive {
  constructor() {}
}

/**
 * Component that specifies which event to fire when the element is clicked.
 * The user is responsible for registering the event class with app.addEvent().
 */
export class OnClick<T = any> {
  constructor(
    public eventClass: new (entity: Entity, data?: T) => any,
    public data?: T
  ) {}
}

/**
 * Component that specifies which event to fire when mouse enters the element.
 * The user is responsible for registering the event class with app.addEvent().
 */
export class OnHoverEnter<T = any> {
  constructor(
    public eventClass: new (entity: Entity, data?: T) => any,
    public data?: T
  ) {}
}

/**
 * Component that specifies which event to fire when mouse exits the element.
 * The user is responsible for registering the event class with app.addEvent().
 */
export class OnHoverExit<T = any> {
  constructor(
    public eventClass: new (entity: Entity, data?: T) => any,
    public data?: T
  ) {}
}

/**
 * Component that specifies which event to fire when the element receives focus.
 * The user is responsible for registering the event class with app.addEvent().
 */
export class OnFocus<T = any> {
  constructor(
    public eventClass: new (entity: Entity, data?: T) => any,
    public data?: T
  ) {}
}

/**
 * Component that specifies which event to fire when the element loses focus.
 * The user is responsible for registering the event class with app.addEvent().
 */
export class OnBlur<T = any> {
  constructor(
    public eventClass: new (entity: Entity, data?: T) => any,
    public data?: T
  ) {}
}

/**
 * Marks an element as disabled (prevents interaction)
 */
export class Disabled {
  constructor(public value: boolean = true) {}

  public enable(): this {
    this.value = false;
    return this;
  }

  public disable(): this {
    this.value = true;
    return this;
  }

  public toggle(): this {
    this.value = !this.value;
    return this;
  }
}

/**
 * Runtime marker added by the interaction system when mouse is hovering over element.
 * Users should not manually add this component.
 */
export class Hovered {
  constructor() {}
}

/**
 * Runtime marker added by the interaction system when element has focus.
 * Users should not manually add this component.
 */
export class Focused {
  constructor() {}
}
