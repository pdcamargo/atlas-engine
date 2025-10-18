import { sys, Time } from "@atlas/core";
import { TileMap } from "../../renderer/tilemap/TileMap";
import { AnimatedTile } from "../../renderer/tilemap/AnimatedTile";

/**
 * System that updates all AnimatedTile instances in all TileMaps
 * Advances animation frames based on delta time and marks tilemaps dirty when frames change
 */
export const tileMapAnimationUpdateSystem = sys(({ commands }) => {
  const time = commands.getResource(Time);
  const deltaTime = time.deltaTime;

  // Get all tilemaps
  const tileMaps = commands.query(TileMap).all();

  // Update each tilemap's animated tiles
  for (const [entity, tileMap] of tileMaps) {
    let hasAnyFrameChanged = false;

    // Get all layers
    const layers = tileMap.getLayers();

    for (const layer of layers) {
      if (
        !layer.visible ||
        layer.getPendingTileCount() > 0 ||
        !("getAnimatedTiles" in layer)
      )
        continue;

      // Get ONLY animated tiles (much more efficient than iterating all tiles)
      const animatedTiles = layer.getAnimatedTiles();

      for (const { data } of animatedTiles) {
        const animatedTile = data.tile as AnimatedTile;

        // Update the animation
        const frameChanged = animatedTile.updateAnimation(deltaTime);

        if (frameChanged) {
          hasAnyFrameChanged = true;
        }
      }
    }

    // If any animated tile changed frames, mark the tilemap as dirty
    // This will trigger chunk rebuilding on the next render
    if (hasAnyFrameChanged) {
      tileMap.markDirty();
    }
  }
}).label("WebgpuRenderer::TileMapAnimationUpdate");
