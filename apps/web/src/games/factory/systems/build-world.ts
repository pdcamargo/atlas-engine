import { Input, KeyCode, sys } from "@repo/engine";
import { GameState } from "../resources/game-state";
import { BuildRequests } from "../resources/build-requests";
import { TilesType } from "../resources/world-grid";
import { ObjectsType } from "../data/tiles";
import { UserInteractionState } from "../resources/user-interaction";

export const buildWorld = sys(({ commands }) => {
  const builds = commands.getResource(BuildRequests);
  builds.enqueueFloor(0, 0, TilesType.Grass);
  builds.enqueueFloor(1, 0, TilesType.Grass);
  builds.enqueueFloor(2, 0, TilesType.Grass);
  builds.enqueueFloor(0, 1, TilesType.Grass);
  builds.enqueueFloor(1, 1, TilesType.Grass);
  builds.enqueueFloor(2, 1, TilesType.Grass);
  builds.enqueueFloor(3, 1, TilesType.Grass);
  builds.enqueueFloor(4, 1, TilesType.Grass);
  builds.enqueueFloor(5, 1, TilesType.Grass);

  builds.enqueueObject(0, 0, ObjectsType.Conveyor);
  builds.enqueueObject(1, 0, ObjectsType.Conveyor);
  builds.enqueueObject(2, 0, ObjectsType.Conveyor);
  builds.enqueueObject(3, 0, ObjectsType.Conveyor);
  builds.enqueueObject(4, 0, ObjectsType.Conveyor);
  builds.enqueueObject(5, 0, ObjectsType.Conveyor);

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
