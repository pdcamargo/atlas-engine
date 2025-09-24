export class FactoryTileMap {
  #atlasIndexByUrl: Map<string, number> = new Map();

  public setAtlasIndex(url: string, index: number): void {
    this.#atlasIndexByUrl.set(url, index);
  }

  public getAtlasIndex(url: string): number | undefined {
    return this.#atlasIndexByUrl.get(url);
  }
}
