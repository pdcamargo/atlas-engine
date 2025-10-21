/**
 * TileMapTextureSynced marker component
 *
 * Flags TileMap entities that have had their tileset texture handles resolved to actual Textures.
 * Used to optimize queries - prevents re-checking already-loaded tilemaps every frame.
 *
 * This is automatically added by the tileSetLoadingSystem when handles are loaded.
 */
export class TileMapTextureSynced {
}
