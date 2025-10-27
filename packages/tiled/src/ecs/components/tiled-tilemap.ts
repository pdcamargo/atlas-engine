import { Handle } from "@atlas/core";
import { Container, TileMap, TileSet } from "@atlas/webgpu-renderer";
import { TiledMapAsset } from "../assets/tiled-map-asset";

/**
 * Component for Tiled tilemap instances
 * Extends Container to act as root of the tilemap hierarchy
 *
 * Structure:
 * TiledTileMap (this)
 * ├── tileMap (TileMap) - renderer tilemap with tile layers
 * └── objectLayersContainer (Container) - container for object layers
 *     ├── ObjectLayer1Container (Container)
 *     │   ├── Sprite (tile object)
 *     │   └── Sprite (tile object)
 *     └── ObjectLayer2Container (Container)
 *         └── Sprite (tile object)
 */
export class TiledTileMap extends Container {
  /**
   * Handle to the loaded Tiled map asset
   */
  public readonly mapHandle: Handle<TiledMapAsset>;

  /**
   * Generated renderer tilemap (null until initialized)
   */
  public tileMap: TileMap | null = null;

  /**
   * Container for object layer sprites (null until initialized)
   */
  public objectLayersContainer: Container | null = null;

  /**
   * Mapping of Tiled firstgid to renderer TileSet
   * Used to efficiently lookup tilesets when placing tiles
   */
  public tilesets: Map<number, TileSet> = new Map();

  /**
   * Whether this tilemap has been fully initialized
   */
  public loaded: boolean = false;

  /**
   * Optional ID to name mapping for object layer containers
   * Allows finding specific object layers by name
   */
  public objectLayerContainers: Map<string, Container> = new Map();

  constructor(mapHandle: Handle<TiledMapAsset>, id?: string) {
    super(id);
    this.mapHandle = mapHandle;
  }

  /**
   * Find a tileset by global tile ID (GID)
   * Returns the tileset and the local tile ID within that tileset
   */
  findTilesetForGID(gid: number): { tileset: TileSet; localId: number } | null {
    let bestMatch: { tileset: TileSet; localId: number } | null = null;
    let bestFirstGid = 0;

    for (const [firstgid, tileset] of this.tilesets.entries()) {
      if (gid >= firstgid && firstgid > bestFirstGid) {
        bestFirstGid = firstgid;
        bestMatch = {
          tileset,
          localId: gid - firstgid,
        };
      }
    }

    return bestMatch;
  }

  /**
   * Get object layer container by name
   */
  getObjectLayerContainer(layerName: string): Container | undefined {
    return this.objectLayerContainers.get(layerName);
  }
}
