/**
 * Base class for visual effects that can be applied to sprites
 * Effects render as additional passes on top of the base sprite
 */
export class Effect {
    static _nextId = 0;
    id;
    enabled = true;
    order = 0; // Lower = render first (negative = before sprite, positive = after)
    // Effect properties that can be animated/changed
    properties = new Map();
    constructor(order = 0) {
        this.id = `effect_${Effect._nextId++}`;
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
