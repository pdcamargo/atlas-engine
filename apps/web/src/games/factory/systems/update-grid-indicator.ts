import { sys } from "@repo/engine";
import { UserInteractionState } from "../resources/user-interaction";
import { assetIndicatorQuery } from "../queries/asset-indicator";
import { WorldGrid } from "../resources/world-grid";

export const updateGridIndicator = sys(({ commands }) => {
  const userInteraction = commands.getResource(UserInteractionState);
  const grid = commands.getResource(WorldGrid);
  const gridIndicator = commands.query(assetIndicatorQuery).tryFind();

  if (!gridIndicator) {
    return;
  }

  const [, transform, sprite] = gridIndicator;

  if (userInteraction.hoveredTile) {
    sprite.get().visible = true;

    transform.setPosition({
      x: userInteraction.hoveredTile.x * grid.tileSize,
      y: userInteraction.hoveredTile.y * grid.tileSize,
    });
  } else {
    sprite.get().visible = false;
  }
})
  .label("UpdateGridIndicator")
  .afterLabel("HandleHoveredTile");
