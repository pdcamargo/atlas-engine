/**
 * A simple LRU (Least Recently Used) cache implementation
 * Used for caching GPU resources like BindGroups to avoid recreating them every frame
 */
export class LRUCache {
    cache;
    accessOrder;
    maxSize;
    constructor(maxSize = 256) {
        this.cache = new Map();
        this.accessOrder = [];
        this.maxSize = maxSize;
    }
    /**
     * Get a value from the cache
     * Updates access order for LRU tracking
     */
    get(key) {
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
    set(key, value) {
        if (this.cache.has(key)) {
            // Update existing
            this.cache.set(key, value);
            this.updateAccessOrder(key);
        }
        else {
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
    getOrCreate(key, factory) {
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
    has(key) {
        return this.cache.has(key);
    }
    /**
     * Delete a key from the cache
     */
    delete(key) {
        const index = this.accessOrder.indexOf(key);
        if (index !== -1) {
            this.accessOrder.splice(index, 1);
        }
        return this.cache.delete(key);
    }
    /**
     * Clear the entire cache
     */
    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }
    /**
     * Get current cache size
     */
    get size() {
        return this.cache.size;
    }
    /**
     * Move key to end of access order (most recently used)
     */
    updateAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index !== -1) {
            this.accessOrder.splice(index, 1);
        }
        this.accessOrder.push(key);
    }
}
