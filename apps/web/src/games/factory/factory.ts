import { App, createSet, DefaultPlugin, EcsPlugin } from "@repo/engine";
import { WorldGrid } from "./resources/world-grid";
import { UserInteractionState } from "./resources/user-interaction";
import { updateGridIndicator } from "./systems/update-grid-indicator";
import { handleHoveredTile } from "./systems/handle-hovered-tile";
import { initGame } from "./systems/init-game";

class ChunkSettings {
  readonly size = 16;
}

class AppState {
  public hasLoadedTiles = false;
}

export class FactoryGamePlugin implements EcsPlugin {
  build(app: App) {
    app
      .setResource(new UserInteractionState())
      .setResource(new ChunkSettings())
      .setResource(new AppState())
      .setResource(new WorldGrid())
      .addPlugins(
        new DefaultPlugin({
          canvas: document.querySelector<HTMLCanvasElement>("canvas"),
        })
      )
      .addStartupSystems(createSet("Game", initGame))
      .addUpdateSystems(
        createSet("Game", updateGridIndicator, handleHoveredTile)
      );
  }
}
