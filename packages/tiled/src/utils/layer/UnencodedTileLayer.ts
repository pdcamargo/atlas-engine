import { TiledEncoding } from "./Encoding";
import { TiledTileLayer } from "./TileLayer";

/** Tile layer. */
export interface TiledUnencodedTileLayer
  extends TiledTileLayer<TiledEncoding.CSV> {}
