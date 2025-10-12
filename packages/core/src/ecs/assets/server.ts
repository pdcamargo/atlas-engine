import { AssetId, Handle, createHandle } from "./handle";
import { Assets } from "./assets";

/**
 * State of asset loading
 */
export enum LoadState {
  NotLoaded = "NotLoaded",
  Loading = "Loading",
  Loaded = "Loaded",
  Failed = "Failed",
}

/**
 * Interface for asset loaders
 */
export interface AssetLoader<T> {
  /**
   * File extensions this loader supports (e.g., ["png", "jpg"])
   */
  extensions(): string[];

  /**
   * Load an asset from raw bytes
   */
  load(bytes: Uint8Array, path: string): Promise<T>;
}

/**
 * Metadata about a loading asset
 */
interface LoadingAsset {
  path: string;
  state: LoadState;
  error?: Error;
}

/**
 * AssetServer manages loading and caching assets
 * Based on Bevy's AssetServer pattern
 */
export class AssetServer {
  #loaders: Map<string, AssetLoader<any>> = new Map();
  #pathToId: Map<string, AssetId> = new Map();
  #idToPath: Map<string, string> = new Map();
  #loadingAssets: Map<string, LoadingAsset> = new Map();
  #pendingLoads: Map<string, Promise<Uint8Array>> = new Map();
  #loadedAssets: Map<string, any> = new Map(); // Stores loaded asset instances

  /**
   * Register an asset loader
   */
  public registerLoader<T>(loader: AssetLoader<T>): void {
    for (const ext of loader.extensions()) {
      this.#loaders.set(ext.toLowerCase(), loader);
    }
  }

  /**
   * Load an asset synchronously (returns handle immediately, loads in background)
   */
  public load<T>(path: string): Handle<T> {
    // Check if already loaded or loading
    const existingId = this.#pathToId.get(path);
    if (existingId) {
      return createHandle<T>(existingId);
    }

    // Create new asset ID and handle
    const id = AssetId.create();
    this.#pathToId.set(path, id);
    this.#idToPath.set(id.toString(), path);

    // Mark as loading
    this.#loadingAssets.set(id.toString(), {
      path,
      state: LoadState.Loading,
    });

    // Start loading in background
    void this.#loadAssetAsync(path, id);

    return createHandle<T>(id);
  }

  /**
   * Load an asset asynchronously (waits for load to complete)
   */
  public async loadAsync<T>(
    path: string,
    assets: Assets<T>
  ): Promise<Handle<T>> {
    const handle = this.load<T>(path);
    await this.waitForLoad(handle);
    return handle;
  }

  /**
   * Wait for an asset to finish loading
   */
  public async waitForLoad<T>(handle: Handle<T>): Promise<void> {
    const path = this.#idToPath.get(handle.id.toString());
    if (!path) {
      throw new Error("Handle does not correspond to a loaded asset");
    }

    const loadState = this.getLoadState(handle);
    if (loadState === LoadState.Loaded) {
      return;
    }

    if (loadState === LoadState.Failed) {
      const loading = this.#loadingAssets.get(handle.id.toString());
      throw loading?.error ?? new Error("Asset failed to load");
    }

    // Wait for the pending load
    const pending = this.#pendingLoads.get(path);
    if (pending) {
      await pending;
    }
  }

  /**
   * Get the load state of an asset
   */
  public getLoadState<T>(handle: Handle<T>): LoadState {
    const loading = this.#loadingAssets.get(handle.id.toString());
    return loading?.state ?? LoadState.NotLoaded;
  }

  /**
   * Get the path for a handle
   */
  public getPath<T>(handle: Handle<T>): string | undefined {
    return this.#idToPath.get(handle.id.toString());
  }

  /**
   * Get the handle for a path (if it exists)
   */
  public getHandle<T>(path: string): Handle<T> | undefined {
    const id = this.#pathToId.get(path);
    return id ? createHandle<T>(id) : undefined;
  }

  /**
   * Get a loaded asset by its handle
   */
  public getAsset<T>(handle: Handle<T>): T | undefined {
    return this.#loadedAssets.get(handle.id.toString());
  }

  /**
   * Load asset from a path
   */
  async #loadAssetAsync(path: string, id: AssetId): Promise<void> {
    try {
      // Start fetch
      const fetchPromise = fetch(path).then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to fetch asset: ${path} (${response.status})`
          );
        }
        return response.arrayBuffer().then((buffer) => new Uint8Array(buffer));
      });

      this.#pendingLoads.set(path, fetchPromise);
      const bytes = await fetchPromise;
      this.#pendingLoads.delete(path);

      // Find loader by extension
      const ext = this.#getExtension(path);
      const loader = ext ? this.#loaders.get(ext) : undefined;

      if (!loader) {
        throw new Error(`No loader registered for extension: ${ext}`);
      }

      // Load the asset
      const asset = await loader.load(bytes, path);

      // Store the loaded asset
      this.#loadedAssets.set(id.toString(), asset);

      // Mark as loaded
      const loading = this.#loadingAssets.get(id.toString());
      if (loading) {
        loading.state = LoadState.Loaded;
      }
    } catch (error) {
      // Mark as failed
      const loading = this.#loadingAssets.get(id.toString());
      if (loading) {
        loading.state = LoadState.Failed;
        loading.error = error as Error;
      }
      console.error(`Failed to load asset: ${path}`, error);
    }
  }

  /**
   * Get file extension from path
   */
  #getExtension(path: string): string | undefined {
    const lastDot = path.lastIndexOf(".");
    if (lastDot === -1) return undefined;
    return path.slice(lastDot + 1).toLowerCase();
  }

  /**
   * Unload an asset
   */
  public unload(path: string): void {
    const id = this.#pathToId.get(path);
    if (id) {
      this.#pathToId.delete(path);
      this.#idToPath.delete(id.toString());
      this.#loadingAssets.delete(id.toString());
      this.#pendingLoads.delete(path);
    }
  }

  /**
   * Clear all loaded assets
   */
  public clear(): void {
    this.#pathToId.clear();
    this.#idToPath.clear();
    this.#loadingAssets.clear();
    this.#pendingLoads.clear();
  }
}
