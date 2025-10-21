export class TextureCache {
    #textures = new Map();
    get(handle) {
        return this.#textures.get(handle.id.toString());
    }
    set(handle, texture) {
        this.#textures.set(handle.id.toString(), texture);
    }
    remove(handle) {
        this.#textures.delete(handle.id.toString());
    }
    clear() {
        this.#textures.clear();
    }
}
