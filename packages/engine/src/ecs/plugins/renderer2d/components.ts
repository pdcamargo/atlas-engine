import * as PIXI from "pixi.js";

import { subTexture } from "./utils";
import { Texture2D } from "../assets";
import { SceneGraph } from "./resources";
import { Viewport } from "../viewport";
import { Transform } from "../../components";

export type SpriteFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AnimationFrame = SpriteFrame & {
  duration: number;
};

export class TileMap {
  #root: PIXI.Container;
  #textures: Texture2D[];

  #tileCache: Map<string, PIXI.Texture> = new Map();

  public constructor(
    textures: Texture2D[] = [],
    private readonly options: { tileWidth: number; tileHeight: number } = {
      tileWidth: 16,
      tileHeight: 16,
    }
  ) {
    this.#root = new PIXI.Container({
      isRenderGroup: true,
    });
    this.#textures = textures;
  }

  public get() {
    return this.#root;
  }

  public isAttached() {
    return !!this.#root?.parent;
  }

  public isAttachable() {
    return (
      !this.isAttached() &&
      (this.#textures.every((t) => t.isLoaded()) || this.#textures.length === 0)
    );
  }

  public attachTo(graphOrContainer: SceneGraph | PIXI.Container) {
    if (!this.isAttachable()) {
      throw new Error("Textures are not loaded");
    }
    graphOrContainer.addChild(this.#root);
  }

  public clear() {}

  public addTile(
    textureIndex: number,
    tileX: number,
    tileY: number,
    options: { x: number; y: number; tileWidth?: number; tileHeight?: number }
  ) {
    if (!this.#textures.length) throw new Error("No textures provided");
    if (textureIndex !== 0)
      throw new Error("Single-atlas TileMap (tileId must be 0)");

    const texture = this.#textures[textureIndex].get();
    if (!texture) throw new Error("Texture not loaded");

    const slice = subTexture(
      this.#tileCache,
      texture,
      tileX,
      tileY,
      options.tileWidth || this.options.tileWidth,
      options.tileHeight || this.options.tileHeight
    );

    const sprite = new PIXI.Sprite(slice);

    sprite.pivot = {
      x: sprite.width / 2,
      y: sprite.height / 2,
    };

    sprite.x = options.x;
    sprite.y = options.y;

    this.#root.addChild(sprite);
  }

  public cache() {
    this.#root.cacheAsTexture(true);
  }
}

export class Sprite {
  #texture: Texture2D;
  #sprite?: PIXI.Sprite;
  #frame?: SpriteFrame;
  #tileCache: Map<string, PIXI.Texture> = new Map();

  constructor(texture: Texture2D, frame?: SpriteFrame) {
    this.#texture = texture;
    this.#frame = frame;
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

  public attachTo(graphOrContainer: SceneGraph | PIXI.Container) {
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

    graphOrContainer.addChild(this.#sprite);
  }
}

export class AnimatedSprite {
  #texture: Texture2D;
  #sprite?: PIXI.Sprite;
  #frames: AnimationFrame[];
  #tileCache: Map<string, PIXI.Texture> = new Map();

  public frameIndex = 0;
  public frameTimer = 0;
  public frameAccumulator = 0;

  constructor(texture: Texture2D, frames: AnimationFrame[]) {
    this.#texture = texture;
    this.#frames = frames;
  }

  public get() {
    return this.#sprite!;
  }

  public get frames() {
    return this.#frames;
  }

  public isAttached() {
    return !!this.#sprite?.parent;
  }

  public isAttachable() {
    return !this.isAttached() && this.#texture.isLoaded();
  }

  public attachTo(graphOrContainer: SceneGraph | PIXI.Container) {
    if (!this.isAttachable()) {
      throw new Error("Texture is not loaded");
    }

    const texture = this.getTextureForFrame(this.frameIndex);

    this.#sprite = new PIXI.Sprite({
      texture,
    });

    this.#sprite.pivot = {
      x: this.#sprite.width / 2,
      y: this.#sprite.height / 2,
    };

    graphOrContainer.addChild(this.#sprite);
  }

  public get currentFrame() {
    const frame = this.#frames?.[this.frameIndex];
    if (!frame) throw new Error("No frame found for index " + this.frameIndex);
    return frame;
  }

  public getTextureForFrame(frameIndex: number) {
    const frame = this.#frames?.[frameIndex];
    if (!frame) throw new Error("No frame found for index " + frameIndex);
    return subTexture(
      this.#tileCache,
      this.#texture.get()!,
      frame.x,
      frame.y,
      frame.width,
      frame.height
    );
  }

  public setTextureForFrame(frameIndex: number) {
    const texture = this.getTextureForFrame(frameIndex);

    this.#sprite!.texture = texture;
  }
}

/**
 * Flag component to indicate that the entity is renderable (already attached to the scene graph)
 */
export class Renderable {
  constructor() {}
}

export class Camera2D {
  zoom = 1;

  target?: Transform;

  #transform: Transform = new Transform();
  #followLerp = 0.2;

  constructor(public readonly viewport: Viewport) {}

  public get transform() {
    return this.#transform;
  }

  public set followLerp(value: number) {
    this.#followLerp = Math.max(0, Math.min(1, value));
  }

  public get followLerp() {
    return this.#followLerp;
  }

  public render(sceneGraph: SceneGraph) {
    // Follow target with simple exponential smoothing (lerp)
    if (this.target) {
      const currentX = this.#transform.position.x;
      const currentY = this.#transform.position.y;
      const targetX = this.target.position.x;
      const targetY = this.target.position.y;

      const t = this.#followLerp;
      const nextX = currentX + (targetX - currentX) * t;
      const nextY = currentY + (targetY - currentY) * t;
      this.#transform.position = { x: nextX, y: nextY } as any;
    }

    const zoom = Math.max(0.0001, this.zoom);

    // Apply camera to scene graph: center camera position in viewport
    const cx = this.#transform.position.x;
    const cy = this.#transform.position.y;

    const stage = sceneGraph.stage;
    const root = sceneGraph.root;

    // Reset stage to identity (stage is the ROOT root)
    stage.position.set(0, 0);
    stage.scale.set(1, 1);

    // Move and scale the world root where content is added
    root.scale.set(zoom, zoom);
    root.position.set(
      this.viewport.width / 2 - cx * zoom,
      this.viewport.height / 2 - cy * zoom
    );
  }
}
