import { QueryBuilder, Transform, Sprite, Visibility } from "@atlas/engine";
import { GridIndicator } from "../components/flags";

export const assetIndicatorQuery = new QueryBuilder(
  Transform,
  Sprite,
  Visibility,
  GridIndicator
);
