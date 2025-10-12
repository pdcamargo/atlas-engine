import { Input, KeyCode, sys } from "@atlas/core";
import { GameState } from "../resources/game-state";
import { BuildRequests } from "../resources/build-requests";
import { TilesType, WorldGrid } from "../resources/world-grid";
import { ObjectsType } from "../data/tiles";
import { UserInteractionState } from "../resources/user-interaction";
import { Conveyor } from "../components/flags";

export const buildWorld = sys(({ commands }) => {
  const builds = commands.getResource(BuildRequests);
  const grid = commands.getResource(WorldGrid);

  for (let x = 0; x < grid.chunkSize; x++) {
    for (let y = 0; y < grid.chunkSize; y++) {
      builds.enqueueFloor(x, y, TilesType.Grass);
    }
  }

  builds.enqueueObject(6, 6, ObjectsType.Conveyor, {
    components: [new Conveyor("up", 100)],
  });
  builds.enqueueObject(6, 7, ObjectsType.Conveyor, {
    components: [new Conveyor("right", 100)],
  });
  builds.enqueueObject(6, 8, ObjectsType.Conveyor, {
    components: [new Conveyor("right", 100)],
  });

  const gameState = commands.getResource(GameState);
  gameState.hasBuiltWorld = true;
}).runIf(({ commands }) => !commands.getResource(GameState).hasBuiltWorld);

// temp
export const addTilesSystem = sys(({ commands }) => {
  const userInteractionState = commands.getResource(UserInteractionState);
  if (!userInteractionState.hoveredTile) return;

  const input = commands.getResource(Input);

  if (input.pressed(KeyCode.MouseLeft)) {
    const builds = commands.getResource(BuildRequests);
    builds.enqueueFloor(
      userInteractionState.hoveredTile.x,
      userInteractionState.hoveredTile.y,
      TilesType.Rock
    );
  }

  if (input.justPressed(KeyCode.MouseRight)) {
    const builds = commands.getResource(BuildRequests);
    builds.enqueueFloor(
      userInteractionState.hoveredTile.x,
      userInteractionState.hoveredTile.y,
      TilesType.Grass
    );
  }

  if (input.justPressed(KeyCode.MouseMiddle)) {
    const builds = commands.getResource(BuildRequests);
    builds.enqueueFloor(
      userInteractionState.hoveredTile.x,
      userInteractionState.hoveredTile.y,
      TilesType.Sand
    );
  }

  if (input.justPressed(KeyCode.KeyQ)) {
    const builds = commands.getResource(BuildRequests);
    // conveyor
    builds.enqueueObject(
      userInteractionState.hoveredTile.x,
      userInteractionState.hoveredTile.y,
      ObjectsType.Conveyor
    );
  }
}).runIf(({ commands }) => commands.getResource(GameState).hasBuiltWorld);
