import * as PIXI from "pixi.js";

export function subTexture(
  cache: Map<string, PIXI.Texture>,
  base: PIXI.Texture,
  tileX: number,
  tileY: number,
  tileWidth: number,
  tileHeight: number
) {
  const key = `${tileX}-${tileY}-${tileWidth}-${tileHeight}`;
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const texture = new PIXI.Texture({
    source: base.source,
    frame: new PIXI.Rectangle(tileX, tileY, tileWidth, tileHeight),
  });

  cache.set(key, texture);

  return texture;
}
