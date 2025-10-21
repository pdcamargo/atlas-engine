/**
 * A simple LRU (Least Recently Used) cache implementation
 * Used for caching GPU resources like BindGroups to avoid recreating them every frame
 */
export declare class LRUCache<K, V> {
    private cache;
    private accessOrder;
    private readonly maxSize;
    constructor(maxSize?: number);
    /**
     * Get a value from the cache
     * Updates access order for LRU tracking
     */
    get(key: K): V | undefined;
    /**
     * Set a value in the cache
     * Evicts least recently used item if cache is full
     */
    set(key: K, value: V): void;
    /**
     * Get or create a value using a factory function
     */
    getOrCreate(key: K, factory: () => V): V;
    /**
     * Check if key exists in cache
     */
    has(key: K): boolean;
    /**
     * Delete a key from the cache
     */
    delete(key: K): boolean;
    /**
     * Clear the entire cache
     */
    clear(): void;
    /**
     * Get current cache size
     */
    get size(): number;
    /**
     * Move key to end of access order (most recently used)
     */
    private updateAccessOrder;
}
//# sourceMappingURL=LRUCache.d.ts.map