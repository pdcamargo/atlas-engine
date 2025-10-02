import { ObjectsType } from "../data/tiles";
import { TilesType } from "./world-grid";

export type FloorTileId = Exclude<TilesType, TilesType.Air>;

export type FloorPlacementRequest = {
  type: "floor";
  x: number;
  y: number;
  tile: FloorTileId;
  components?: unknown[];
};

export type ObjectPlacementRequest = {
  type: "object";
  x: number;
  y: number;
  object: ObjectsType;
  width?: number;
  height?: number;
  blocks?: boolean;
  meta?: Record<string, unknown>;
  components?: unknown[];
};

export type BuildRequest = FloorPlacementRequest | ObjectPlacementRequest;

export class BuildRequests {
  #queue: BuildRequest[] = [];

  public enqueueFloor(x: number, y: number, tile: FloorTileId): void {
    this.#queue.push({ type: "floor", x, y, tile });
  }

  public enqueueObject(
    x: number,
    y: number,
    object: ObjectsType,
    options?: {
      width?: number;
      height?: number;
      blocks?: boolean;
      meta?: Record<string, unknown>;
      components?: unknown[];
    }
  ): void {
    this.#queue.push({
      type: "object",
      x,
      y,
      object,
      width: options?.width,
      height: options?.height,
      blocks: options?.blocks,
      meta: options?.meta,
      components: options?.components,
    });
  }

  public drain(): BuildRequest[] {
    const out = this.#queue;
    this.#queue = [];
    return out;
  }

  public requeue(requests: BuildRequest[]): void {
    // Re-insert at the front to preserve processing order
    this.#queue = [...requests, ...this.#queue];
  }
}
