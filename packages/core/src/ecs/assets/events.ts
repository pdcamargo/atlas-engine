import type { Handle } from "./handle";

/**
 * Events that are fired when assets are modified
 */
export type AssetEventType = "Created" | "Modified" | "Removed";

/**
 * Event for asset lifecycle changes
 */
export class AssetEvent<T> {
  constructor(
    public readonly handle: Handle<T>,
    public readonly type: AssetEventType
  ) {}

  public isCreated(): boolean {
    return this.type === "Created";
  }

  public isModified(): boolean {
    return this.type === "Modified";
  }

  public isRemoved(): boolean {
    return this.type === "Removed";
  }
}
