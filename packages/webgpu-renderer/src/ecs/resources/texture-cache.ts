import { Handle, ImageAsset, WeakHandle } from "@atlas/core";
import { Texture } from "../../renderer/Texture";

export class TextureCache {
  #textures: Map<string, Texture> = new Map();

  public get(
    handle: Handle<ImageAsset> | WeakHandle<ImageAsset>
  ): Texture | undefined {
    return this.#textures.get(handle.id.toString());
  }

  public set(
    handle: Handle<ImageAsset> | WeakHandle<ImageAsset>,
    texture: Texture
  ): void {
    this.#textures.set(handle.id.toString(), texture);
  }

  public remove(handle: Handle<ImageAsset> | WeakHandle<ImageAsset>): void {
    this.#textures.delete(handle.id.toString());
  }

  public clear(): void {
    this.#textures.clear();
  }
}
