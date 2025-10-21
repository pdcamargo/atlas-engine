import { Handle, ImageAsset, WeakHandle } from "@atlas/core";
import { Texture } from "../../renderer/Texture";
export declare class TextureCache {
    #private;
    get(handle: Handle<ImageAsset> | WeakHandle<ImageAsset>): Texture | undefined;
    set(handle: Handle<ImageAsset> | WeakHandle<ImageAsset>, texture: Texture): void;
    remove(handle: Handle<ImageAsset> | WeakHandle<ImageAsset>): void;
    clear(): void;
}
//# sourceMappingURL=texture-cache.d.ts.map