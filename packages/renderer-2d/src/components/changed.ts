/**
 * Marker component to track entities whose transform or sprite data has changed
 * Used for optimizing GPU uploads - only changed entities get their instance data rebuilt
 */
export class TransformChanged {
  constructor() {}
}

/**
 * Marker component to track entities whose sprite component has changed
 */
export class SpriteChanged {
  constructor() {}
}

