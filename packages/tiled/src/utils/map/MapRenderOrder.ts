/** Map render order. */
export enum TiledMapRenderOrder {
  /** Default right-down render order. */
  RIGHT_DOWN = "right-down",

  /** Right-up render order. */
  RIGHT_UP = "right-up",

  /** Left-down render order. */
  LEFT_DOWN = "left-down",

  /** Left-up render order. Currently only supported for orthogonal maps. */
  LEFT_UP = "left-up",
}
