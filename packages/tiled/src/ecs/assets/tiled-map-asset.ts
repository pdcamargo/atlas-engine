import { TiledMap } from "../../utils/map/Map";

/**
 * Asset type for Tiled map files (.tmj)
 * Stores the parsed TiledMap JSON structure
 */
export class TiledMapAsset {
  constructor(
    public readonly data: TiledMap,
    public readonly path: string
  ) {}

  /**
   * Get the base directory of this map file
   * Used for resolving relative paths to external tilesets
   */
  getBaseDirectory(): string {
    const lastSlash = this.path.lastIndexOf("/");
    return lastSlash === -1 ? "" : this.path.substring(0, lastSlash);
  }

  /**
   * Resolve a relative path from this map's directory
   */
  resolvePath(relativePath: string): string {
    const baseDir = this.getBaseDirectory();
    if (baseDir === "") {
      return relativePath;
    }
    return `${baseDir}/${relativePath}`;
  }
}
