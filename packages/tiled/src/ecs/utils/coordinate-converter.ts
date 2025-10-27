import { PixelsPerUnit } from "@atlas/webgpu-renderer";
import { TiledMapOrientation } from "../../utils/map/MapOrientation";

/**
 * Convert Tiled pixel coordinates to Atlas world units
 * @param pixels Pixel value from Tiled
 * @returns World units using the global PixelsPerUnit setting
 */
export function tiledPixelsToWorldUnits(pixels: number): number {
  return PixelsPerUnit.toWorldUnits(pixels);
}

/**
 * Convert Tiled tile coordinates to world position
 * Handles different map orientations (orthogonal, isometric, hexagonal, staggered)
 *
 * @param tileX Tile X coordinate
 * @param tileY Tile Y coordinate
 * @param tileWidth Tile width in pixels
 * @param tileHeight Tile height in pixels
 * @param mapOrientation Map orientation type
 * @returns World position { x, y, z }
 */
export function tileToWorldPosition(
  tileX: number,
  tileY: number,
  tileWidth: number,
  tileHeight: number,
  mapOrientation: TiledMapOrientation
): { x: number; y: number; z: number } {
  let pixelX = 0;
  let pixelY = 0;

  switch (mapOrientation) {
    case "orthogonal":
      // Simple grid layout
      pixelX = tileX * tileWidth;
      pixelY = tileY * tileHeight;
      break;

    case "isometric":
      // Isometric diamond layout
      pixelX = (tileX - tileY) * (tileWidth / 2);
      pixelY = (tileX + tileY) * (tileHeight / 2);
      break;

    case "staggered":
      // Staggered layout (similar to isometric but with offset rows/columns)
      // For now, treat as orthogonal - full implementation would need stagger axis/index
      pixelX = tileX * tileWidth;
      pixelY = tileY * tileHeight;
      break;

    case "hexagonal":
      // Hexagonal layout
      // For now, treat as orthogonal - full implementation would need hex side length
      pixelX = tileX * tileWidth;
      pixelY = tileY * tileHeight;
      break;

    default:
      // Unknown orientation, treat as orthogonal
      pixelX = tileX * tileWidth;
      pixelY = tileY * tileHeight;
  }

  // Convert to world units
  const worldX = tiledPixelsToWorldUnits(pixelX);
  const worldY = tiledPixelsToWorldUnits(pixelY);

  // Z is typically 0 for tile positions, but can be adjusted for layering
  return { x: worldX, y: worldY, z: 0 };
}

/**
 * Convert Tiled object position to world position
 * Object positions are in pixels and may need Y-axis inversion
 *
 * @param objectX Object X position in pixels
 * @param objectY Object Y position in pixels
 * @param mapHeight Total map height in pixels (for Y-axis conversion)
 * @param invertY Whether to invert Y-axis (default: false)
 * @returns World position { x, y, z }
 */
export function objectToWorldPosition(
  objectX: number,
  objectY: number,
  mapHeight: number = 0,
  invertY: boolean = false
): { x: number; y: number; z: number } {
  const worldX = tiledPixelsToWorldUnits(objectX);
  let worldY = tiledPixelsToWorldUnits(objectY);

  // Tiled Y-axis is top-down (0 = top)
  // Atlas Y-axis is bottom-up (0 = bottom)
  // Invert Y if needed
  if (invertY && mapHeight > 0) {
    const mapHeightWorld = tiledPixelsToWorldUnits(mapHeight);
    worldY = mapHeightWorld - worldY;
  }

  return { x: worldX, y: worldY, z: 0 };
}

/**
 * Convert Tiled rotation (degrees, clockwise) to radians
 * @param degrees Rotation in degrees from Tiled
 * @returns Rotation in radians
 */
export function tiledRotationToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
