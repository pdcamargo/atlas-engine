import { TiledEmbeddedTileset } from "./EmbeddedTileset";
import { TiledTilesetRef } from "./TilesetRef";

/** Union of all tileset types. */
export type TiledAnyTileset = TiledEmbeddedTileset | TiledTilesetRef;

/**
 * Checks if given tileset is an embedded tileset.
 *
 * @params tileset - The tileset to check.
 * @returns True if tileset is an embedded tileset, false if not.
 */
export function isEmbeddedTileset(
  tileset: TiledAnyTileset
): tileset is TiledEmbeddedTileset {
  return (tileset as TiledTilesetRef).source == null;
}

/**
 * Checks if given tileset is a external tileset reference.
 *
 * @params tileset - The tileset to check.
 * @returns True if tileset is an external tileset reference, false if not.
 */
export function isTilesetRef(
  tileset: TiledAnyTileset
): tileset is TiledTilesetRef {
  return (tileset as TiledTilesetRef).source != null;
}
