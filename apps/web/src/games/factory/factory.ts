import { App, createSet, DefaultPlugin, EcsPlugin } from "@repo/engine";
import { WorldGrid } from "./resources/world-grid";
import { UserInteractionState } from "./resources/user-interaction";
import { updateGridIndicator } from "./systems/update-grid-indicator";
import { handleHoveredTile } from "./systems/handle-hovered-tile";
import { initGame } from "./systems/init-game";
import { BuildRequests } from "./resources/build-requests";
import { initTileMap } from "./systems/init-tilemap";
import { applyBuildRequests } from "./systems/apply-build-requests";
import { GameState } from "./resources/game-state";
import { addTilesSystem, buildWorld } from "./systems/build-world";

class ChunkSettings {
  readonly size = 16;
}

class AppState {
  public hasLoadedTiles = false;
}

export class FactoryGamePlugin implements EcsPlugin {
  build(app: App) {
    app
      .setResource(new GameState())
      .setResource(new UserInteractionState())
      .setResource(new ChunkSettings())
      .setResource(new AppState())
      .setResource(new BuildRequests())
      .setResource(new WorldGrid())
      .addPlugins(
        new DefaultPlugin({
          canvas: document.querySelector<HTMLCanvasElement>("canvas"),
          gravity: {
            x: 0,
            y: 0,
          },
        })
      )
      .addStartupSystems(createSet("GameSetup", initGame, initTileMap))
      .addUpdateSystems(
        createSet(
          "Game",
          updateGridIndicator,
          handleHoveredTile,
          applyBuildRequests,
          addTilesSystem
        ),
        createSet("GameSetup", buildWorld)
      )
      .addSetRunIf(
        "Game",
        ({ commands }) => !!commands.getResource(GameState).hasBuiltWorld
      );
  }
}
