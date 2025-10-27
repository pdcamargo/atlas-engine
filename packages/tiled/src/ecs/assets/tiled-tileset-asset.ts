import { TiledTileset } from "../../utils/tileset/Tileset";

/**
 * Asset type for Tiled tileset files (.tsj)
 * Stores the parsed TiledTileset JSON structure
 */
export class TiledTilesetAsset {
  constructor(
    public readonly data: TiledTileset,
    public readonly path: string
  ) {}

  /**
   * Get the base directory of this tileset file
   * Used for resolving relative paths to images
   */
  getBaseDirectory(): string {
    const lastSlash = this.path.lastIndexOf("/");
    return lastSlash === -1 ? "" : this.path.substring(0, lastSlash);
  }

  /**
   * Resolve a relative image path from this tileset's directory
   */
  resolveImagePath(relativePath: string): string {
    const baseDir = this.getBaseDirectory();
    if (baseDir === "") {
      return relativePath;
    }
    return `${baseDir}/${relativePath}`;
  }
}
