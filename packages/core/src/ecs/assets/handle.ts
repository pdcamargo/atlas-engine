/**
 * Unique identifier for an asset
 * Based on Bevy's AssetId pattern
 */
export class AssetId {
  #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static create(): AssetId {
    return new AssetId(crypto.randomUUID());
  }

  public static fromString(value: string): AssetId {
    return new AssetId(value);
  }

  public toString(): string {
    return this.#value;
  }

  public equals(other: AssetId): boolean {
    return this.#value === other.#value;
  }
}

/**
 * Strong handle with ownership
 * Type-safe reference to an asset of type T
 */
export type Handle<T> = {
  readonly id: AssetId;
  readonly __brand: unique symbol;
};

/**
 * Weak handle without ownership
 * Does not prevent asset from being unloaded
 */
export type WeakHandle<T> = {
  readonly id: AssetId;
  readonly __brand: unique symbol;
  readonly __weak: true;
};

/**
 * Creates a strong handle for an asset
 */
export function createHandle<T>(id: AssetId): Handle<T> {
  return {
    id,
    __brand: Symbol() as any,
  };
}

/**
 * Creates a weak handle for an asset
 */
export function createWeakHandle<T>(id: AssetId): WeakHandle<T> {
  return {
    id,
    __brand: Symbol() as any,
    __weak: true,
  };
}

/**
 * Checks if a handle is a weak handle
 */
export function isWeakHandle<T>(
  handle: Handle<T> | WeakHandle<T>
): handle is WeakHandle<T> {
  return "__weak" in handle && handle.__weak === true;
}

/**
 * Converts a strong handle to a weak handle
 */
export function toWeakHandle<T>(handle: Handle<T>): WeakHandle<T> {
  return createWeakHandle<T>(handle.id);
}
