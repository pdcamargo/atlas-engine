/**
 * Controls whether an entity should be visible
 */
export class Visibility {
  constructor(public visible: boolean = true) {}

  public static visible(): Visibility {
    return new Visibility(true);
  }

  public static hidden(): Visibility {
    return new Visibility(false);
  }
}

/**
 * Computed visibility per view/camera
 * This is calculated by the system and shouldn't be set manually
 */
export class ViewVisibility {
  #visibleInViews: Set<number> = new Set();

  public isVisibleInView(viewId: number): boolean {
    return this.#visibleInViews.has(viewId);
  }

  public setVisibleInView(viewId: number, visible: boolean): void {
    if (visible) {
      this.#visibleInViews.add(viewId);
    } else {
      this.#visibleInViews.delete(viewId);
    }
  }

  public clear(): void {
    this.#visibleInViews.clear();
  }
}

/**
 * Computed visibility flag that combines Visibility and ViewVisibility
 * True if the entity should be rendered
 */
export class InheritedVisibility {
  constructor(public visible: boolean = true) {}
}
