/**
 * Generic object pool for reusing expensive objects
 */
export class ObjectPool<T> {
  private available: T[] = [];
  private inUse = new Set<T>();
  private factory: () => T;
  private reset?: (obj: T) => void;
  private maxSize: number;

  /**
   * @param factory - Function to create new objects when pool is empty
   * @param reset - Optional function to reset objects before reuse
   * @param maxSize - Maximum pool size (default: 100)
   */
  constructor(
    factory: () => T,
    reset?: (obj: T) => void,
    maxSize: number = 100
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  /**
   * Get an object from the pool (creates new if empty)
   */
  acquire(): T {
    let obj: T;

    if (this.available.length > 0) {
      obj = this.available.pop()!;
    } else {
      obj = this.factory();
    }

    this.inUse.add(obj);

    return obj;
  }

  /**
   * Return an object to the pool for reuse
   */
  release(obj: T): void {
    if (!this.inUse.has(obj)) {
      console.warn("Attempting to release object not from this pool");
      return;
    }

    this.inUse.delete(obj);

    // Reset the object if a reset function is provided
    if (this.reset) {
      this.reset(obj);
    }

    // Only return to pool if under max size
    if (this.available.length < this.maxSize) {
      this.available.push(obj);
    }
    // Otherwise let it be garbage collected
  }

  /**
   * Release all objects currently in use
   */
  releaseAll(): void {
    for (const obj of this.inUse) {
      if (this.reset) {
        this.reset(obj);
      }
      if (this.available.length < this.maxSize) {
        this.available.push(obj);
      }
    }

    this.inUse.clear();
  }

  /**
   * Clear the pool completely
   */
  clear(): void {
    this.available = [];
    this.inUse.clear();
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
    };
  }

  /**
   * Pre-warm the pool with a number of objects
   */
  prewarm(count: number): void {
    for (let i = 0; i < count && this.available.length < this.maxSize; i++) {
      this.available.push(this.factory());
    }
  }
}
