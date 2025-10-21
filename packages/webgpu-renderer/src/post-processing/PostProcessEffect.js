/**
 * Base class for post-processing effects
 * Post-processing effects operate on the entire rendered scene
 * and can be chained together in multiple passes
 */
export class PostProcessEffect {
    static _nextId = 0;
    id;
    enabled = true;
    order = 0; // Lower = earlier in post-process chain
    // Effect properties that can be animated/changed
    properties = new Map();
    constructor(order = 0) {
        this.id = `postprocess_${PostProcessEffect._nextId++}`;
        this.order = order;
    }
    /**
     * Set an effect property
     */
    setProperty(name, value) {
        this.properties.set(name, value);
    }
    /**
     * Get an effect property
     */
    getProperty(name) {
        return this.properties.get(name);
    }
    /**
     * Check if effect has a property
     */
    hasProperty(name) {
        return this.properties.has(name);
    }
}
