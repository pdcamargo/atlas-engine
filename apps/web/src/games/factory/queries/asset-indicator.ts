import { QueryBuilder, Renderable, Sprite, Transform } from "@repo/engine";
import { GridIndicator } from "../components/grid-indicator";

export const assetIndicatorQuery = new QueryBuilder(
  Transform,
  Sprite,
  Renderable,
  GridIndicator
);
