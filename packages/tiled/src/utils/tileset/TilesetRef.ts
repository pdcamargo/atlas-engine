import { TiledBaseTileset } from "./BaseTileset";

/** External tileset reference. */
export interface TiledTilesetRef extends TiledBaseTileset {
  /** The external file that contains this tilesets data. */
  source: string;
}
