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
  #pixiTexture?: PIXI.Texture;
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

  private getPixiTexture(): PIXI.Texture {
    if (!this.#pixiTexture && this.#texture.image) {
      // Convert HTMLImageElement to PIXI.Texture
      this.#pixiTexture = PIXI.Texture.from({
        resource: this.#texture.image,
        minFilter: "nearest",
        magFilter: "nearest",
      });
    }
    return this.#pixiTexture!;
  }

  public attachTo(graphOrContainer: SceneGraph) {
    if (!this.isAttachable()) {
      throw new Error("Texture is not loaded");
    }

    const baseTexture = this.getPixiTexture();
    const texture = this.#frame
      ? subTexture(
          this.#tileCache,
          baseTexture,
          this.#frame.x,
          this.#frame.y,
          this.#frame.width,
          this.#frame.height
        )
      : baseTexture;

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
