import {
  AssetId,
  Handle,
  WeakHandle,
  createHandle,
  isWeakHandle,
} from "./handle";

/**
 * Storage for assets of type T
 * Manages asset lifecycle and reference counting
 * Based on Bevy's Assets<T> pattern
 */
export class Assets<T> {
  #assets: Map<string, T> = new Map();
  #refCounts: Map<string, number> = new Map();

  /**
   * Add an asset and return a handle to it
   */
  public add(asset: T): Handle<T> {
    const id = AssetId.create();
    const key = id.toString();
    this.#assets.set(key, asset);
    this.#refCounts.set(key, 1);
    return createHandle<T>(id);
  }

  /**
   * Add an asset with a specific ID
   */
  public addWithId(id: AssetId, asset: T): Handle<T> {
    const key = id.toString();
    this.#assets.set(key, asset);
    this.#refCounts.set(key, 1);
    return createHandle<T>(id);
  }

  /**
   * Get an asset by handle
   */
  public get(handle: Handle<T> | WeakHandle<T>): T | undefined {
    return this.#assets.get(handle.id.toString());
  }

  /**
   * Remove an asset by handle
   */
  public remove(handle: Handle<T> | WeakHandle<T>): T | undefined {
    const key = handle.id.toString();
    const asset = this.#assets.get(key);
    this.#assets.delete(key);
    this.#refCounts.delete(key);
    return asset;
  }

  /**
   * Check if an asset exists
   */
  public contains(handle: Handle<T> | WeakHandle<T>): boolean {
    return this.#assets.has(handle.id.toString());
  }

  /**
   * Get all asset handles
   */
  public handles(): Handle<T>[] {
    const handles: Handle<T>[] = [];
    for (const key of this.#assets.keys()) {
      handles.push(createHandle<T>(AssetId.fromString(key)));
    }
    return handles;
  }

  /**
   * Iterate over all assets
   */
  public *iter(): IterableIterator<[Handle<T>, T]> {
    for (const [key, asset] of this.#assets.entries()) {
      yield [createHandle<T>(AssetId.fromString(key)), asset];
    }
  }

  /**
   * Increment reference count for a handle
   */
  public retain(handle: Handle<T> | WeakHandle<T>): void {
    if (isWeakHandle(handle)) {
      return; // Weak handles don't affect ref counting
    }
    const key = handle.id.toString();
    const count = this.#refCounts.get(key) ?? 0;
    this.#refCounts.set(key, count + 1);
  }

  /**
   * Decrement reference count for a handle
   * Returns true if the asset should be removed (ref count reached 0)
   */
  public release(handle: Handle<T> | WeakHandle<T>): boolean {
    if (isWeakHandle(handle)) {
      return false; // Weak handles don't affect ref counting
    }
    const key = handle.id.toString();
    const count = this.#refCounts.get(key) ?? 0;
    if (count <= 1) {
      this.#refCounts.delete(key);
      return true;
    }
    this.#refCounts.set(key, count - 1);
    return false;
  }

  /**
   * Get the reference count for a handle
   */
  public getRefCount(handle: Handle<T> | WeakHandle<T>): number {
    return this.#refCounts.get(handle.id.toString()) ?? 0;
  }

  /**
   * Clear all assets
   */
  public clear(): void {
    this.#assets.clear();
    this.#refCounts.clear();
  }

  /**
   * Get the number of assets stored
   */
  public len(): number {
    return this.#assets.size;
  }

  /**
   * Check if there are no assets
   */
  public isEmpty(): boolean {
    return this.#assets.size === 0;
  }
}
