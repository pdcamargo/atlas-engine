import * as PIXI from "pixi.js";

import { Texture2D } from "../../assets";
import { SceneGraph } from "../resources";
import { subTexture } from "../utils";

export type SpriteFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export class Sprite {
  #texture: Texture2D;
  #sprite?: PIXI.Sprite;
  #frame?: SpriteFrame;
  #tileCache: Map<string, PIXI.Texture> = new Map();
  #layer?: number;

  constructor(texture: Texture2D, frame?: SpriteFrame, layer?: number) {
    this.#texture = texture;
    this.#frame = frame;
    this.#layer = layer;
  }

  public get() {
    return this.#sprite!;
  }

  public isAttached() {
    return !!this.#sprite?.parent;
  }

  public isAttachable() {
    return !this.isAttached() && this.#texture.isLoaded();
  }

  public attachTo(graphOrContainer: SceneGraph) {
    if (!this.isAttachable()) {
      throw new Error("Texture is not loaded");
    }

    const texture = this.#frame
      ? subTexture(
          this.#tileCache,
          this.#texture.get()!,
          this.#frame.x,
          this.#frame.y,
          this.#frame.width,
          this.#frame.height
        )
      : this.#texture.get()!;

    this.#sprite = new PIXI.Sprite({
      texture,
    });
    this.#sprite.pivot = {
      x: this.#sprite.width / 2,
      y: this.#sprite.height / 2,
    };

    graphOrContainer.addChild(this.#sprite, this.#layer);
  }
}
