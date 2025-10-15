import { sys } from "@atlas/core";
import { MainCamera } from "../components";
import { Sprite } from "../../renderer/Sprite";

export const cull = sys(({ commands }) => {
  const mainCamera = commands.query(MainCamera).tryFind();

  if (!mainCamera) {
    return;
  }

  const sprites = commands.query(Sprite).all();

  for (const [, sprite] of sprites) {
    if (!sprite.visible) continue;
  }
});
