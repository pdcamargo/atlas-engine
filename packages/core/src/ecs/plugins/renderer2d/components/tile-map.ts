import * as PIXI from "pixi.js";
import { Texture2D } from "../../assets";
import { subTexture } from "../utils";
import { SceneGraph } from "../resources";

export class TileMap {
  #root: PIXI.Container;
  #textures: Texture2D[];
  #layer?: number;
  #tileCache: Map<string, PIXI.Texture> = new Map();
  #pixiTextureCache: Map<Texture2D, PIXI.Texture> = new Map();

  public constructor(
    textures: Texture2D[] = [],
    private readonly options: { tileWidth: number; tileHeight: number } = {
      tileWidth: 16,
      tileHeight: 16,
    },
    layer?: number
  ) {
    this.#root = new PIXI.Container({
      isRenderGroup: true,
    });
    this.#textures = textures;
    this.#layer = layer;
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

  public attachTo(graphOrContainer: SceneGraph) {
    if (!this.isAttachable()) {
      throw new Error("Textures are not loaded");
    }
    graphOrContainer.addChild(this.#root, this.#layer);
  }

  public clear() {}

  private getPixiTexture(texture2D: Texture2D): PIXI.Texture {
    let pixiTexture = this.#pixiTextureCache.get(texture2D);
    if (!pixiTexture && texture2D.image) {
      // Convert HTMLImageElement to PIXI.Texture
      pixiTexture = PIXI.Texture.from({
        resource: texture2D.image,
        minFilter: "nearest",
        magFilter: "nearest",
      });
      this.#pixiTextureCache.set(texture2D, pixiTexture);
    }
    return pixiTexture!;
  }

  public addTile(
    textureIndex: number,
    tileX: number,
    tileY: number,
    options: { x: number; y: number; tileWidth?: number; tileHeight?: number }
  ) {
    if (!this.#textures.length) throw new Error("No textures provided");
    const base = this.#textures?.[textureIndex];
    if (!base) throw new Error("Texture index out of range");
    const texture = this.getPixiTexture(base);
    if (!texture) throw new Error("Texture not loaded");

    const slice = subTexture(
      this.#tileCache,
      texture,
      tileX * (options.tileWidth ?? this.options.tileWidth),
      tileY * (options.tileHeight ?? this.options.tileHeight),
      options.tileWidth ?? this.options.tileWidth,
      options.tileHeight ?? this.options.tileHeight
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
