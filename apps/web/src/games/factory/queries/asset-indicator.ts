import { QueryBuilder, Renderable, Sprite, Transform } from "@atlas/core";
import { GridIndicator } from "../components/flags";

export const assetIndicatorQuery = new QueryBuilder(
  Transform,
  Sprite,
  Renderable,
  GridIndicator
);
