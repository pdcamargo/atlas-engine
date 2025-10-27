import { type TiledEncoding } from "./Encoding";
import { TiledTileLayer } from "./TileLayer";

/** Tile layer. */
export interface TiledEncodedTileLayer
  extends TiledTileLayer<Exclude<TiledEncoding, TiledEncoding.CSV>> {
  encoding: Exclude<TiledEncoding, TiledEncoding.CSV>;
}
