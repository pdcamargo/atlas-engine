import { type TiledChunk } from "./Chunk";
import { type TiledCompression } from "./Compression";
import { type TiledEncoding, TiledEncodingDataType } from "./Encoding";
import { type TiledLayer } from "./Layer";

/** Tile layer. */
export interface TiledTileLayer<E extends TiledEncoding = TiledEncoding>
  extends TiledLayer<"tilelayer"> {
  /** Array of chunks. Only set for tile layers in infinite maps. */
  chunks?: Array<TiledChunk<TiledEncodingDataType<E>>>;

  /** Compression method for base64 encoded data and chunks. Only set when base64 encoding is set. */
  compression?: TiledCompression;

  /** Array of unsigned integers (GIDs) or base64-encoded data. */
  data?: TiledEncodingDataType<E>;

  /**
   * The data encoding. When set to CSV or undefined then {@link data} and data in {@link chunks} are unsigned integers. When set to BASE64 then
   * data is base64 encoded and optionally compressed by the compression method defined in {@link compression}.
   */
  encoding?: E;

  /** Row count. Same as map height for fixed-size maps. */
  height: number;

  /** X coordinate where layer content stats. Only set to infinite maps. */
  startx?: number;

  /** Y coordinate where layer content stats. Only set to infinite maps. */
  starty?: number;

  /** Column count. Same as map width for fixed-size maps.  */
  width: number;
}
