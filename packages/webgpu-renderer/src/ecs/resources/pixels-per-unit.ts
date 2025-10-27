/**
 * Global PixelsPerUnit configuration for consistent pixel-to-world-unit conversion
 *
 * This ensures sprites, tilemaps, and all renderables use the same coordinate system:
 * - A 16px sprite with scale 1 = same size as a 16px tile with scale 1
 * - Default: 100 pixels = 1 world unit (like Unity)
 *
 * Usage:
 * ```typescript
 * // In your game setup (before creating sprites/tilemaps):
 * PixelsPerUnit.setGlobal(16); // 16 pixels = 1 world unit
 *
 * // Now sprites and tiles with same pixel size render at same size:
 * const sprite = new Sprite(texture, 16, 16); // 16px → 1 world unit
 * const tilemap = new TileMap({ tileWidth: 16, tileHeight: 16 }); // 16px → 1 world unit
 * ```
 */
export class PixelsPerUnit {
  // Global static value shared across all sprites and tilemaps
  private static globalValue: number = 100; // Default: 100 pixels = 1 world unit

  /**
   * Set the global pixels-per-unit value
   * Must be called before creating any sprites or tilemaps
   */
  static setGlobal(ppu: number): void {
    if (ppu <= 0) {
      throw new Error("PixelsPerUnit must be greater than 0");
    }
    PixelsPerUnit.globalValue = ppu;
  }

  /**
   * Get the global pixels-per-unit value
   */
  static getGlobal(): number {
    return PixelsPerUnit.globalValue;
  }

  /**
   * Convert pixels to world units using global PPU
   */
  static toWorldUnits(pixels: number): number {
    return pixels / PixelsPerUnit.globalValue;
  }

  /**
   * Convert world units to pixels using global PPU
   */
  static toPixels(worldUnits: number): number {
    return worldUnits * PixelsPerUnit.globalValue;
  }
}
