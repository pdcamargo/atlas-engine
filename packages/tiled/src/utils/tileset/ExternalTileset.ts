import { TiledTileset } from "./Tileset";

/** Tileset in an external JSON file. */
export interface TiledExternalTileset extends TiledTileset {
  /** The Tiled version used to save the file. */
  tiledversion: string;

  /** Always "tileset" */
  type: "tileset";

  /** The JSON format version. */
  version: string;
}
