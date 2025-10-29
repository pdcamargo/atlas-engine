/**
 * Physics world configuration settings
 */

/**
 * Global physics simulation settings
 */
export class PhysicsSettings {
  /**
   * Gravity vector (world units/s²)
   */
  gravity = { x: 0, y: -980 }; // -980 pixels/s² ≈ 9.8 m/s² at 100 PPU

  /**
   * Pixels per unit conversion factor
   * Used to convert between world units (pixels) and physics units (meters)
   */
  pixelsPerUnit = 100;

  /**
   * Maximum number of rigid bodies
   */
  maxBodies = 10000;

  /**
   * Maximum number of colliders
   */
  maxColliders = 10000;

  /**
   * Maximum number of contacts per frame
   */
  maxContacts = 50000;

  /**
   * Number of constraint solver iterations
   * Higher = more accurate but slower
   */
  solverIterations = 10;

  /**
   * Number of substeps per fixed update
   * Higher = more stable but slower
   */
  substeps = 4;

  /**
   * Energy threshold for sleeping bodies
   * (velocity magnitude squared)
   */
  sleepThreshold = 0.01;

  /**
   * Minimum time (seconds) below threshold before sleeping
   */
  sleepMinTime = 0.5;

  /**
   * Enable continuous collision detection globally
   */
  ccdEnabled = true;

  /**
   * Spatial grid cell size (in physics units)
   * Used for broad-phase collision detection
   */
  spatialCellSize = 1.0; // 1 meter = 100 pixels

  /**
   * Spatial grid dimensions
   */
  spatialGridWidth = 1024;
  spatialGridHeight = 1024;

  /**
   * World bounds (in physics units)
   * Used for spatial hashing
   */
  worldBounds = {
    minX: -100,
    minY: -100,
    maxX: 100,
    maxY: 100,
  };
}
