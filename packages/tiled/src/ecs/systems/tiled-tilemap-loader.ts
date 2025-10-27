import {
  sys,
  AssetServer,
  Handle,
  ImageAsset,
  LoadState,
  Color,
  Rect,
  Commands,
} from "@atlas/core";
import {
  TileMap,
  TileSet,
  Container,
  Sprite,
  TextureFilter,
} from "@atlas/webgpu-renderer";
import { TiledTileMap } from "../components/tiled-tilemap";
import { TiledMapAsset } from "../assets/tiled-map-asset";
import { TiledTilesetAsset } from "../assets/tiled-tileset-asset";
import {
  TiledAnyTileset,
  isEmbeddedTileset,
  isTilesetRef,
} from "../../utils/tileset/AnyTileset";
import {
  TiledAnyLayer,
  isTileLayer,
  isObjectGroup,
  isGroup,
} from "../../utils/layer/AnyLayer";
import { decodeTileLayer } from "../../utils/layer/decodeTileLayer";
import { TiledTileset } from "../../utils/tileset/Tileset";
import { TiledFrame } from "../../utils/tile/Frame";
import { decodeGID, findTilesetForGID, isEmptyTile } from "../utils/gid-utils";
import { objectToWorldPosition } from "../utils/coordinate-converter";

/**
 * System that processes TiledTileMap components and loads them into the renderer
 * This runs every frame and progressively loads tilemaps as their assets become ready
 */
export const tiledTilemapLoaderSystem = sys(({ commands }) => {
  const assetServer = commands.getResource(AssetServer);

  // Query all TiledTileMap components
  for (const [, tiledMap] of commands.query(TiledTileMap).all()) {
    // If not loaded yet, try to load it
    if (!tiledMap.loaded) {
      // Check if map asset is loaded
      const loadState = assetServer.getLoadState(tiledMap.mapHandle);
      if (loadState !== LoadState.Loaded) {
        continue; // Still loading or failed
      }

      // Get the map asset
      const mapAsset = assetServer.getAsset(tiledMap.mapHandle);
      if (!mapAsset) {
        console.error(
          "[TiledTileMap] Map asset not found for handle",
          tiledMap.mapHandle
        );
        continue;
      }

      // Start loading the tilemap
      try {
        loadTiledMap(tiledMap, mapAsset, assetServer, commands);
      } catch (error) {
        console.error("[TiledTileMap] Error loading tilemap:", error);
        // Don't mark as loaded so it can retry
      }
    } else {
      // Map is loaded, sync pending tiles and tile grids
      let totalGridsSynced = 0;
      let totalTilesSynced = 0;

      // Sync pending tile grids (tiles waiting for textures to load)
      for (const [, tileSet] of tiledMap.tilesets) {
        const synced = tileSet.syncPendingTileGrids();
        totalGridsSynced += synced;
      }

      // Sync pending tiles in layers
      if (tiledMap.tileMap) {
        for (const layer of tiledMap.tileMap.getLayers()) {
          const synced = layer.syncPendingTiles();
          totalTilesSynced += synced;
        }
      }

      // Only log when something was synced
      if (totalGridsSynced > 0 || totalTilesSynced > 0) {
        console.log(
          `[TiledTileMap] ✅ Synced ${totalGridsSynced} tile grids and ${totalTilesSynced} tiles`
        );
      }
    }
  }
}).label("TiledTilemapLoader");

/**
 * Load a Tiled map into the renderer
 */
function loadTiledMap(
  tiledMap: TiledTileMap,
  mapAsset: TiledMapAsset,
  assetServer: AssetServer,
  commands: Commands
): void {
  const map = mapAsset.data;

  // Step 1: Load all tilesets
  if (!map.tilesets || map.tilesets.length === 0) {
    console.warn("[TiledTileMap] Map has no tilesets");
    tiledMap.loaded = true;
    return;
  }

  const loadedTilesets: Array<{
    firstgid: number;
    tileset: TiledTileset;
    imageHandle: Handle<ImageAsset>;
  }> = [];

  // Process each tileset
  for (const tilesetEntry of map.tilesets) {
    let tileset: TiledTileset;

    if (isEmbeddedTileset(tilesetEntry)) {
      // Embedded tileset - data is inline
      tileset = tilesetEntry;
    } else if (isTilesetRef(tilesetEntry)) {
      // External tileset - need to load .tsj file
      const externalPath = mapAsset.resolvePath(tilesetEntry.source);
      const tilesetHandle = assetServer.load<TiledTilesetAsset>(externalPath);

      // Check if loaded
      const tilesetLoadState = assetServer.getLoadState(tilesetHandle);
      if (tilesetLoadState !== LoadState.Loaded) {
        // Still loading, can't proceed yet
        return;
      }

      const tilesetAsset = assetServer.getAsset(tilesetHandle);
      if (!tilesetAsset) {
        console.error("[TiledTileMap] Tileset asset not found:", externalPath);
        continue;
      }

      tileset = tilesetAsset.data;
    } else {
      console.error("[TiledTileMap] Unknown tileset type:", tilesetEntry);
      continue;
    }

    // Load tileset image - don't wait for it to load, let deferred system handle it
    const imagePath = mapAsset.resolvePath(tileset.image);
    const imageHandle = assetServer.load<ImageAsset>(imagePath);

    loadedTilesets.push({
      firstgid: tilesetEntry.firstgid,
      tileset,
      imageHandle,
    });
  }

  // Step 2: Create renderer TileSets
  for (const { firstgid, tileset, imageHandle } of loadedTilesets) {
    // Create TileSet
    const tileSet = new TileSet(
      imageHandle,
      tileset.tilewidth,
      tileset.tileheight,
      {
        spacing: tileset.spacing,
        margin: tileset.margin,
      }
    );

    // Add tiles from grid (deferred - will sync when texture loads)
    tileSet.addTilesFromGrid(
      tileset.columns,
      Math.ceil(tileset.tilecount / tileset.columns)
    );

    // Add animated tiles
    if (tileset.tiles) {
      for (const tile of tileset.tiles) {
        if (tile.animation && tile.animation.length > 0) {
          // Create animated tile
          const frames = tile.animation.map((frame: TiledFrame) => ({
            frame: tileSet.getTile(frame.tileid)?.frame || new Rect(0, 0, 1, 1),
            duration: frame.duration,
          }));

          tileSet.addAnimatedTile({
            id: tile.id,
            frames,
            loop: true,
            speed: 1.0,
          });
        }
      }
    }

    tiledMap.tilesets.set(firstgid, tileSet);
  }

  // Step 3: Create TileMap
  const tileMap = new TileMap({
    tileWidth: map.tilewidth,
    tileHeight: map.tileheight,
  });

  // Step 4: Create object layers container
  const objectLayersContainer = new Container("tiled-object-layers");

  // Step 5: Process layers
  if (map.layers && map.layers.length > 0) {
    processLayers(
      map.layers,
      tileMap,
      objectLayersContainer,
      tiledMap,
      map.tilesets,
      map.tilewidth,
      map.tileheight,
      map.height
    );
  }

  // Step 6: Add to scene hierarchy as children of TiledTileMap container
  tiledMap.tileMap = tileMap;
  tiledMap.objectLayersContainer = objectLayersContainer;

  tiledMap.addChild(tileMap);
  tiledMap.addChild(objectLayersContainer);

  // Step 7: Spawn TileMap into ECS world so tileset-loading system can see it
  // Add TextureFilter for Tiled tilesets
  const textureFilter = new TextureFilter();
  textureFilter.flipY = false; // Tiled uses Y-down, don't flip the texture
  textureFilter.minFilter = "nearest"; // Use nearest-neighbor to prevent bleeding
  textureFilter.magFilter = "nearest"; // Use nearest-neighbor to prevent bleeding
  textureFilter.mips = false; // Disable mipmaps for pixel-perfect rendering
  commands.spawn(tileMap, textureFilter);

  // Mark as loaded
  tiledMap.loaded = true;

  console.log("[TiledTileMap] Loaded map:", mapAsset.path);
  console.log("  - TileMap layers:", tileMap.getLayers().length);
  console.log("  - Tilesets:", tiledMap.tilesets.size);
  console.log(
    "  - Object layer containers:",
    tiledMap.objectLayerContainers.size
  );
}

/**
 * Process layers recursively
 */
function processLayers(
  layers: TiledAnyLayer[],
  tileMap: TileMap,
  objectLayersContainer: Container,
  tiledMap: TiledTileMap,
  tilesets: TiledAnyTileset[],
  tileWidth: number,
  tileHeight: number,
  mapHeight: number,
  parentZIndex: number = 0
): void {
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];

    // Skip invisible layers
    if (layer.visible === false) {
      continue;
    }

    // In Tiled, first layer (index 0) renders on top, so reverse the z-index
    // Higher index = lower z-index (further back)
    const layerZIndex = parentZIndex + (layers.length - 1 - i) * 0.01;

    if (isTileLayer(layer)) {
      // Process tile layer
      processTileLayer(layer, tileMap, tiledMap, tilesets, layerZIndex);
    } else if (isObjectGroup(layer)) {
      // Process object layer
      processObjectLayer(
        layer,
        objectLayersContainer,
        tiledMap,
        tilesets,
        tileWidth,
        tileHeight,
        mapHeight,
        layerZIndex
      );
    } else if (isGroup(layer)) {
      // Process group layer (recursive)
      if (layer.layers && layer.layers.length > 0) {
        processLayers(
          layer.layers,
          tileMap,
          objectLayersContainer,
          tiledMap,
          tilesets,
          tileWidth,
          tileHeight,
          mapHeight,
          layerZIndex
        );
      }
    }
  }
}

/**
 * Process a tile layer
 */
function processTileLayer(
  layer: any,
  tileMap: TileMap,
  tiledMap: TiledTileMap,
  tilesets: TiledAnyTileset[],
  zIndex: number
): void {
  // Decode layer if needed
  const decodedLayer = decodeTileLayer(layer);

  // Create tilemap layer
  const mapLayer = tileMap.addLayer(layer.name || `layer_${layer.id}`, zIndex);

  // Apply layer tint if present
  if (layer.tintcolor) {
    const color = parseColor(layer.tintcolor);
    if (color) {
      mapLayer.tint = color;
    }
  }

  // Note: Layer opacity would need to be implemented in TileMapLayer
  // For now, it's not supported in the renderer

  // Place tiles
  if (decodedLayer.data) {
    const width = decodedLayer.width;
    const height = decodedLayer.height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const gid = decodedLayer.data[index];

        if (isEmptyTile(gid)) {
          continue; // Skip empty tiles
        }

        // Find tileset for this GID
        const result = findTilesetForGID(gid, tilesets);

        if (!result) {
          continue;
        }

        const { tileset: tiledTileset, localId } = result;
        const firstgid = tiledTileset.firstgid;

        // Get renderer TileSet
        const tileSet = tiledMap.tilesets.get(firstgid);

        if (!tileSet) {
          continue;
        }

        // Decode flip flags (TODO: implement flip transformations)
        // const { flippedHorizontally, flippedVertically, flippedDiagonally } = decodeGID(gid);

        // Convert Tiled Y coordinate (top-down) to renderer Y coordinate (bottom-up)
        const rendererY = height - 1 - y;

        // Place the tile with flipped Y coordinate
        mapLayer.setTileById(x, rendererY, tileSet, localId);
      }
    }
  }
}

/**
 * Process an object layer
 */
function processObjectLayer(
  layer: any,
  objectLayersContainer: Container,
  tiledMap: TiledTileMap,
  tilesets: TiledAnyTileset[],
  tileWidth: number,
  tileHeight: number,
  mapHeight: number,
  zIndex: number
): void {
  // Create container for this object layer
  const layerContainer = new Container(
    layer.name || `object_layer_${layer.id}`
  );
  layerContainer.setPosition({ x: 0, y: 0, z: zIndex });

  // Store reference
  tiledMap.objectLayerContainers.set(
    layer.name || `layer_${layer.id}`,
    layerContainer
  );

  // Process objects
  if (layer.objects && layer.objects.length > 0) {
    for (const obj of layer.objects) {
      // Only handle tile objects for now (objects with gid)
      if (obj.gid) {
        const result = findTilesetForGID(obj.gid, tilesets);
        if (!result) {
          continue;
        }

        const { tileset: tiledTileset, localId } = result;
        const firstgid = tiledTileset.firstgid;

        // Get renderer TileSet
        const tileSet = tiledMap.tilesets.get(firstgid);
        if (!tileSet) {
          continue;
        }

        // Get tile
        const tile = tileSet.getTile(localId);
        if (!tile) {
          continue;
        }

        // Get image handle from tileset
        const imageHandle = tileSet.texture;

        // Create sprite
        const sprite = new Sprite(
          imageHandle,
          tileWidth,
          tileHeight,
          obj.name || `object_${obj.id}`
        );

        // Set frame from tile
        sprite.setFrame(tile.frame);

        // Set position (convert from Tiled coordinates)
        const pos = objectToWorldPosition(
          obj.x,
          obj.y,
          mapHeight * tileHeight,
          false // Don't invert Y for now
        );
        sprite.setPosition(pos);

        // Apply rotation if present
        if (obj.rotation) {
          const radians = (obj.rotation * Math.PI) / 180;
          sprite.setRotation(radians);
        }

        // Apply visibility
        if (obj.visible === false) {
          sprite.visible = false;
        }

        // Decode and apply flip flags
        const { flippedHorizontally, flippedVertically } = decodeGID(obj.gid);
        if (flippedHorizontally || flippedVertically) {
          const scaleX = flippedHorizontally ? -1 : 1;
          const scaleY = flippedVertically ? -1 : 1;
          sprite.setScale({ x: scaleX, y: scaleY });
        }

        // Add to layer container
        layerContainer.addChild(sprite);
      }
    }
  }

  // Add layer container to object layers container
  objectLayersContainer.addChild(layerContainer);
}

/**
 * Parse Tiled color string (#AARRGGBB or #RRGGBB) to Color
 */
function parseColor(colorString: string): Color | null {
  if (!colorString || !colorString.startsWith("#")) {
    return null;
  }

  const hex = colorString.substring(1);

  if (hex.length === 6) {
    // #RRGGBB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return new Color(r, g, b, 1);
  } else if (hex.length === 8) {
    // #AARRGGBB
    const a = parseInt(hex.substring(0, 2), 16) / 255;
    const r = parseInt(hex.substring(2, 4), 16) / 255;
    const g = parseInt(hex.substring(4, 6), 16) / 255;
    const b = parseInt(hex.substring(6, 8), 16) / 255;
    return new Color(r, g, b, a);
  }

  return null;
}
