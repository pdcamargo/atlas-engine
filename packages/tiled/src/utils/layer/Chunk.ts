/** Used to store the tile layer data for infinite maps. */
export interface TiledChunk<
  Data extends string | number[] = string | number[],
> {
  /** Array of unsigned integers (GIDs) or base64-encoded data. */
  data: Data;

  /** Height in tiles. */
  height: number;

  /** Width in tiles. */
  width: number;

  /** X coordinate in tiles. */
  x: number;

  /** Y coordinate in tiles. */
  y: number;
}
