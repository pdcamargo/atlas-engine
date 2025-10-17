/**
 * A simple LRU (Least Recently Used) cache implementation
 * Used for caching GPU resources like BindGroups to avoid recreating them every frame
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private accessOrder: K[];
  private readonly maxSize: number;

  constructor(maxSize: number = 256) {
    this.cache = new Map();
    this.accessOrder = [];
    this.maxSize = maxSize;
  }

  /**
   * Get a value from the cache
   * Updates access order for LRU tracking
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.updateAccessOrder(key);
    }
    return value;
  }

  /**
   * Set a value in the cache
   * Evicts least recently used item if cache is full
   */
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.set(key, value);
      this.updateAccessOrder(key);
    } else {
      // Add new
      if (this.cache.size >= this.maxSize) {
        // Evict least recently used
        const lruKey = this.accessOrder.shift();
        if (lruKey !== undefined) {
          this.cache.delete(lruKey);
        }
      }
      this.cache.set(key, value);
      this.accessOrder.push(key);
    }
  }

  /**
   * Get or create a value using a factory function
   */
  getOrCreate(key: K, factory: () => V): V {
    const existing = this.get(key);
    if (existing !== undefined) {
      return existing;
    }
    const value = factory();
    this.set(key, value);
    return value;
  }

  /**
   * Check if key exists in cache
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a key from the cache
   */
  delete(key: K): boolean {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    return this.cache.delete(key);
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Move key to end of access order (most recently used)
   */
  private updateAccessOrder(key: K): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }
}
