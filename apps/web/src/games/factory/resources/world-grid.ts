export enum TilesType {
  Air = "air",
  Grass = "grass",
  Rock = "rock",
  Sand = "sand",
}

type PlaceObjectOptions = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  blocksCollision?: boolean;
  meta?: Record<string, unknown>;
};

type MoveObjectOptions = {
  id: string;
  x: number;
  y: number;
};

export type PlacedTileMetadata = {
  floor: TilesType | null;
  blocksCollision: boolean;
  objectId?: string;
  meta?: Record<string, unknown>;
};

export type PlacedObjectMetadata = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  blocks: boolean;
  meta?: Record<string, unknown>;
};

export type PlacedMetadata =
  | {
      type: "object";
      value: PlacedObjectMetadata;
    }
  | {
      type: "cell";
      value: PlacedTileMetadata;
    };

class Chunk<T> {
  public readonly width: number;
  public readonly height: number;
  public readonly cells: T[][];

  constructor(width: number, height: number, factory: () => T) {
    this.width = width;
    this.height = height;
    this.cells = new Array(height)
      .fill(null)
      .map(() => new Array(width).fill(null).map(factory));
  }
}

export class Grid {
  readonly tileSize: number;
  readonly chunkSize: number;

  #chunks: Map<string, Chunk<PlacedTileMetadata>> = new Map();
  #objects: Map<
    string,
    {
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      blocks: boolean;
      meta?: Record<string, unknown>;
    }
  > = new Map();
  #minChunkX = 0;
  #maxChunkX = 0;
  #minChunkY = 0;
  #maxChunkY = 0;
  #nextObjectId = 1;

  constructor(options?: {
    tileSize?: number;
    chunkSize?: number;
    initialChunks?: Array<{ cx: number; cy: number }>;
  }) {
    this.tileSize = options?.tileSize ?? 16;
    this.chunkSize = options?.chunkSize ?? 16;

    const initial = options?.initialChunks?.length
      ? options.initialChunks
      : [{ cx: 0, cy: 0 }];
    for (const { cx, cy } of initial) {
      this.#ensureChunk(cx, cy, true);
      this.#minChunkX = Math.min(this.#minChunkX, cx);
      this.#maxChunkX = Math.max(this.#maxChunkX, cx);
      this.#minChunkY = Math.min(this.#minChunkY, cy);
      this.#maxChunkY = Math.max(this.#maxChunkY, cy);
    }
  }

  // Public API

  get boundsInChunks(): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    return {
      minX: this.#minChunkX,
      maxX: this.#maxChunkX,
      minY: this.#minChunkY,
      maxY: this.#maxChunkY,
    };
  }

  /**
   * Return the placed object whose footprint occupies tile (x, y), if any.
   * Coordinates are tile indices.
   */
  getObjectAt(x: number, y: number) {
    const tx = Math.round(x);
    const ty = Math.round(y);
    const cell = this.#getCell(tx, ty);
    if (!cell || !cell.objectId) return null;
    return this.#objects.get(cell.objectId) ?? null;
  }

  /**
   * Prefer object over cell: returns
   * - { type: 'object', value: GridObject }
   * - { type: 'cell', value: TileMetadata }
   * - null when nothing exists or out of bounds
   */
  getObjectOrCell(x: number, y: number): PlacedMetadata | null {
    const obj = this.getObjectAt(x, y);
    if (obj) return { type: "object", value: obj };
    const cell = this.getTile(x, y);
    if (cell) return { type: "cell", value: cell };
    return null;
  }

  get boundsInTiles(): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    return {
      minX: this.#minChunkX * this.chunkSize,
      maxX: (this.#maxChunkX + 1) * this.chunkSize - 1,
      minY: this.#minChunkY * this.chunkSize,
      maxY: (this.#maxChunkY + 1) * this.chunkSize - 1,
    };
  }

  canAddTile(
    x: number,
    y: number,
    width?: number,
    height?: number,
    options?: { blocks?: boolean; ignoreObjectId?: string }
  ): boolean {
    const w = width ?? this.tileSize;
    const h = height ?? this.tileSize;
    const blocks = options?.blocks ?? true;
    const ignoreId = options?.ignoreObjectId;

    const tiles = this.#footprintTiles(x, y, w, h);

    for (const { tx, ty } of tiles) {
      if (!this.#isInBounds(tx, ty)) return false;
      const cell = this.#getCell(tx, ty);
      if (!cell) return false; // out of current chunks
      if (cell.objectId && cell.objectId !== ignoreId) return false;
      if (cell.blocksCollision && blocks) return false;
    }
    return true;
  }

  placeObject(options: PlaceObjectOptions): string {
    const x = Math.round(options.x);
    const y = Math.round(options.y);
    const width = options.width ?? this.tileSize;
    const height = options.height ?? this.tileSize;
    const blocks = options.blocksCollision ?? true;

    if (!this.canAddTile(x, y, width, height, { blocks })) {
      throw new Error(
        "Cannot place object: out of bounds or collides with blocking tiles/objects"
      );
    }

    const id = String(this.#nextObjectId++);
    const tiles = this.#footprintTiles(x, y, width, height);
    for (const { tx, ty } of tiles) {
      const cell = this.#getCellStrict(tx, ty);
      cell.objectId = id;
    }
    this.#objects.set(id, {
      id,
      x,
      y,
      width,
      height,
      blocks,
      meta: options.meta,
    });
    return id;
  }

  removeObject(id: string): void {
    const obj = this.#objects.get(id);
    if (!obj) return;
    const tiles = this.#footprintTiles(obj.x, obj.y, obj.width, obj.height);
    for (const { tx, ty } of tiles) {
      const cell = this.#getCell(tx, ty);
      if (cell && cell.objectId === id) cell.objectId = undefined;
    }
    this.#objects.delete(id);
  }

  moveObject(options: MoveObjectOptions): void {
    const obj = this.#objects.get(options.id);
    if (!obj) throw new Error(`Object ${options.id} not found`);

    const newX = Math.round(options.x);
    const newY = Math.round(options.y);

    if (
      !this.canAddTile(newX, newY, obj.width, obj.height, {
        blocks: obj.blocks,
        ignoreObjectId: obj.id,
      })
    ) {
      throw new Error(
        "Cannot move object: out of bounds or collides with blocking tiles/objects"
      );
    }

    // Clear old
    const oldTiles = this.#footprintTiles(obj.x, obj.y, obj.width, obj.height);
    for (const { tx, ty } of oldTiles) {
      const cell = this.#getCell(tx, ty);
      if (cell && cell.objectId === obj.id) cell.objectId = undefined;
    }

    // Set new
    const newTiles = this.#footprintTiles(newX, newY, obj.width, obj.height);
    for (const { tx, ty } of newTiles) {
      const cell = this.#getCellStrict(tx, ty);
      cell.objectId = obj.id;
    }

    obj.x = newX;
    obj.y = newY;
  }

  setFloor(
    x: number,
    y: number,
    floor: TilesType | null,
    options?: { blocks?: boolean; meta?: Record<string, unknown> }
  ): void {
    const tx = Math.round(x);
    const ty = Math.round(y);
    if (!this.#isInBounds(tx, ty))
      throw new Error("setFloor out of bounds - expand grid first");
    const cell = this.#getCellStrict(tx, ty);
    cell.floor = floor;
    cell.blocksCollision = options?.blocks ?? false;
    cell.meta = options?.meta;
  }

  getTile(x: number, y: number): PlacedTileMetadata | null {
    const tx = Math.round(x);
    const ty = Math.round(y);
    const cell = this.#getCell(tx, ty);
    return cell ? { ...cell } : null;
  }

  expandAt(dx: -1 | 0 | 1, dy: -1 | 0 | 1): void {
    if (dx === 0 && dy === 0)
      throw new Error("expandAt requires a non-zero direction");

    // Select anchor along extremes
    const anchorX =
      dx < 0 ? this.#minChunkX : dx > 0 ? this.#maxChunkX : this.#minChunkX;

    // Collect candidates at anchorX (or all if dx === 0)
    const candidateChunks: Array<{ cx: number; cy: number }> = [];
    for (const key of this.#chunks.keys()) {
      const { cx, cy } = this.#parseKey(key);
      if (dx === 0 || cx === anchorX) candidateChunks.push({ cx, cy });
    }
    if (candidateChunks.length === 0)
      throw new Error("No chunks to anchor expansion");

    let anchorCY = candidateChunks[0].cy;
    if (dy < 0) {
      anchorCY = Math.min(...candidateChunks.map((c) => c.cy));
    } else if (dy > 0) {
      anchorCY = Math.max(...candidateChunks.map((c) => c.cy));
    }

    const targetCX = (dx === 0 ? candidateChunks[0].cx : anchorX) + dx;
    const targetCY = anchorCY + dy;

    if (this.#hasChunk(targetCX, targetCY)) {
      throw new Error(
        `Cannot expand: chunk (${targetCX}, ${targetCY}) already exists`
      );
    }

    this.#ensureChunk(targetCX, targetCY, true);
    this.#minChunkX = Math.min(this.#minChunkX, targetCX);
    this.#maxChunkX = Math.max(this.#maxChunkX, targetCX);
    this.#minChunkY = Math.min(this.#minChunkY, targetCY);
    this.#maxChunkY = Math.max(this.#maxChunkY, targetCY);
  }

  // Internals

  #hasChunk = (cx: number, cy: number): boolean =>
    this.#chunks.has(this.#key(cx, cy));

  #ensureChunk(
    cx: number,
    cy: number,
    createIfMissing: boolean
  ): Chunk<PlacedTileMetadata> | null {
    const key = this.#key(cx, cy);
    const existing = this.#chunks.get(key);
    if (existing) return existing;
    if (!createIfMissing) return null;
    const chunk = new Chunk<PlacedTileMetadata>(
      this.chunkSize,
      this.chunkSize,
      () => ({ floor: null, blocksCollision: false })
    );
    this.#chunks.set(key, chunk);
    return chunk;
  }

  #getCell(tx: number, ty: number): PlacedTileMetadata | null {
    const { cx, cy, lx, ly } = this.#worldToChunk(tx, ty);
    const chunk = this.#chunks.get(this.#key(cx, cy));
    if (!chunk) return null;
    return chunk.cells[ly]?.[lx] ?? null;
  }

  #getCellStrict(tx: number, ty: number): PlacedTileMetadata {
    const cell = this.#getCell(tx, ty);
    if (!cell) throw new Error("Cell not found - out of bounds");
    return cell;
  }

  #isInBounds(tx: number, ty: number): boolean {
    const { cx, cy } = this.#worldToChunk(tx, ty);
    return (
      cx >= this.#minChunkX &&
      cx <= this.#maxChunkX &&
      cy >= this.#minChunkY &&
      cy <= this.#maxChunkY &&
      this.#hasChunk(cx, cy)
    );
  }

  #footprintTiles(
    x: number,
    y: number,
    width: number,
    height: number
  ): Array<{ tx: number; ty: number }> {
    const centerX = Math.round(x);
    const centerY = Math.round(y);
    const neighborsX = Math.max(
      0,
      Math.ceil((width - this.tileSize) / this.tileSize)
    );
    const neighborsY = Math.max(
      0,
      Math.ceil((height - this.tileSize) / this.tileSize)
    );

    const tiles: Array<{ tx: number; ty: number }> = [];
    for (let ty = centerY - neighborsY; ty <= centerY + neighborsY; ty++) {
      for (let tx = centerX - neighborsX; tx <= centerX + neighborsX; tx++) {
        tiles.push({ tx, ty });
      }
    }
    return tiles;
  }

  #worldToChunk(
    tx: number,
    ty: number
  ): { cx: number; cy: number; lx: number; ly: number } {
    const cx = Math.floor(tx / this.chunkSize);
    const cy = Math.floor(ty / this.chunkSize);
    const lx = ((tx % this.chunkSize) + this.chunkSize) % this.chunkSize;
    const ly = ((ty % this.chunkSize) + this.chunkSize) % this.chunkSize;
    return { cx, cy, lx, ly };
  }

  #key(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  #parseKey(key: string): { cx: number; cy: number } {
    const [sx, sy] = key.split(",");
    return { cx: Number(sx), cy: Number(sy) };
  }
}

export class WorldGrid extends Grid {
  constructor() {
    super({
      tileSize: 16,
      chunkSize: 12,
      initialChunks: [{ cx: 0, cy: 0 }],
    });
  }
}
