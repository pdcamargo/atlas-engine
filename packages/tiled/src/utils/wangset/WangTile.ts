/** Wang tile. */
export interface TiledWangTile {
  /** Local ID of the tile. */
  tileid: number;

  /** Array of Wang color indices. */
  wangid: [number, number, number, number, number, number, number, number];
}
