import { TiledAnyTileset, isEmbeddedTileset } from "../../utils/tileset/AnyTileset";

/**
 * Tiled Global ID (GID) bit flags
 * GIDs are 32-bit integers where:
 * - Bits 0-28: Tile ID (536,870,911 possible tiles)
 * - Bit 29: Horizontal flip flag
 * - Bit 30: Vertical flip flag
 * - Bit 31: Diagonal flip flag (swap X/Y)
 */
const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
const FLIPPED_VERTICALLY_FLAG = 0x40000000;
const FLIPPED_DIAGONALLY_FLAG = 0x20000000;
const FLIP_FLAGS_MASK = ~(
  FLIPPED_HORIZONTALLY_FLAG |
  FLIPPED_VERTICALLY_FLAG |
  FLIPPED_DIAGONALLY_FLAG
);

export interface DecodedGID {
  /** The tile ID with flip flags removed */
  tileId: number;
  /** Whether the tile should be flipped horizontally */
  flippedHorizontally: boolean;
  /** Whether the tile should be flipped vertically */
  flippedVertically: boolean;
  /** Whether the tile should be flipped diagonally (swap X/Y axes) */
  flippedDiagonally: boolean;
}

/**
 * Decode a Tiled Global ID (GID) into its components
 * @param gid The global tile ID from Tiled
 * @returns Decoded GID with tile ID and flip flags
 */
export function decodeGID(gid: number): DecodedGID {
  return {
    tileId: gid & FLIP_FLAGS_MASK,
    flippedHorizontally: (gid & FLIPPED_HORIZONTALLY_FLAG) !== 0,
    flippedVertically: (gid & FLIPPED_VERTICALLY_FLAG) !== 0,
    flippedDiagonally: (gid & FLIPPED_DIAGONALLY_FLAG) !== 0,
  };
}

/**
 * Find which tileset contains a given GID and return the local tile ID
 * @param gid The global tile ID to look up
 * @param tilesets Array of tilesets from the map (must be sorted by firstgid)
 * @returns The tileset and local tile ID, or null if not found
 */
export function findTilesetForGID(
  gid: number,
  tilesets: TiledAnyTileset[]
): { tileset: TiledAnyTileset; localId: number } | null {
  // Decode GID to get the actual tile ID (without flip flags)
  const { tileId } = decodeGID(gid);

  // Special case: GID 0 means empty tile
  if (tileId === 0) {
    return null;
  }

  // Find the tileset with the highest firstgid that is <= tileId
  // Tilesets should be sorted by firstgid, so we iterate backwards
  let bestMatch: { tileset: TiledAnyTileset; localId: number } | null = null;
  let bestFirstGid = 0;

  for (const tileset of tilesets) {
    const firstgid = tileset.firstgid;

    // For embedded tilesets, we can check tile count
    if (isEmbeddedTileset(tileset)) {
      const lastgid = firstgid + tileset.tilecount - 1;
      if (tileId >= firstgid && tileId <= lastgid && firstgid > bestFirstGid) {
        bestFirstGid = firstgid;
        bestMatch = {
          tileset,
          localId: tileId - firstgid,
        };
      }
    } else {
      // For tileset refs, we can only check if firstgid matches
      // We'll assume it's valid if it's the best match so far
      if (tileId >= firstgid && firstgid > bestFirstGid) {
        bestFirstGid = firstgid;
        bestMatch = {
          tileset,
          localId: tileId - firstgid,
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Check if a GID represents an empty tile
 * @param gid The global tile ID to check
 * @returns true if the tile is empty (GID 0)
 */
export function isEmptyTile(gid: number): boolean {
  const { tileId } = decodeGID(gid);
  return tileId === 0;
}
