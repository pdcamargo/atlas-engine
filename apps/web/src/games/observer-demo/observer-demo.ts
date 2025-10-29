import { App, sys, Entity, EcsPlugin } from "@atlas/engine";

/**
 * Observer Demo - Mine Explosion Cascade
 *
 * Demonstrates the Observer System with a mine field that explodes in cascades.
 * Click anywhere to trigger an explosion that chains to nearby mines.
 *
 * Features:
 * - Mine "onAdded" observer (spatial index)
 * - Mine "onRemoved" observer (cleanup)
 * - Custom event observers (Explode, ExplodeMines)
 * - Reactive cascade explosions
 */

// ==================== Components ====================

type vec2 = [number, number];

class Mine {
  constructor(
    public pos: vec2,
    public size: number
  ) {}

  static random(rng: () => number): Mine {
    const pos = [(rng() - 0.5) * 2400, (rng() - 0.5) * 1200] as vec2;
    const size = 8 + rng() * 32;
    return new Mine(pos, size);
  }
}

// ==================== Events ====================

class Explode {}

class ExplodeMines {
  constructor(
    public pos: vec2,
    public radius: number
  ) {}
}

// ==================== Resources ====================

const CELL_SIZE = 128.0;

class SpatialIndex {
  private map = new Map<string, Set<Entity>>();

  private getTile(pos: vec2): [number, number] {
    return [Math.floor(pos[0] / CELL_SIZE), Math.floor(pos[1] / CELL_SIZE)];
  }

  private getTileKey(tile: [number, number]): string {
    return `${tile[0]},${tile[1]}`;
  }

  public add(entity: Entity, pos: vec2): void {
    const tile = this.getTile(pos);
    const key = this.getTileKey(tile);
    let set = this.map.get(key);
    if (!set) {
      set = new Set();
      this.map.set(key, set);
    }
    set.add(entity);
  }

  public remove(entity: Entity, pos: vec2): void {
    const tile = this.getTile(pos);
    const key = this.getTileKey(tile);
    const set = this.map.get(key);
    if (set) {
      set.delete(entity);
      if (set.size === 0) {
        this.map.delete(key);
      }
    }
  }

  public getNearby(pos: vec2): Entity[] {
    const tile = this.getTile(pos);
    const nearby: Entity[] = [];

    // Check 3x3 grid around the tile
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const checkTile: [number, number] = [tile[0] + dx, tile[1] + dy];
        const key = this.getTileKey(checkTile);
        const set = this.map.get(key);
        if (set) {
          nearby.push(...set);
        }
      }
    }

    return nearby;
  }
}

class GameState {
  public explosionCount = 0;
  public mineCount = 0;
  public totalMines = 0;
}

// Simple seeded RNG for consistent randomness
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  public next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
}

// ==================== Systems ====================

const setupSystem = sys(({ commands }) => {
  // Initialize resources
  commands.setResource(new SpatialIndex());
  const gameState = new GameState();
  commands.setResource(gameState);

  // Spawn mines
  const rng = new SeededRandom(19878367467713);
  const mineCount = 1000;

  for (let i = 0; i < mineCount; i++) {
    const mine = Mine.random(() => rng.next());
    commands.spawn(mine);
  }

  gameState.mineCount = mineCount;
  gameState.totalMines = mineCount;

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║            OBSERVER DEMO - MINE EXPLOSION CASCADE             ║
╠═══════════════════════════════════════════════════════════════╣
║  Spawned ${mineCount} mines                                           ║
║                                                               ║
║  🖱️  Click anywhere to trigger an explosion!                 ║
║  💥 Watch the cascade as nearby mines detonate               ║
║                                                               ║
║  Features:                                                    ║
║  • Mine "onAdded" observer (spatial index)                   ║
║  • Mine "onRemoved" observer (cleanup)                       ║
║  • Explode observer (mine detonation)                        ║
║  • ExplodeMines observer (cascade trigger)                   ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

const handleClickSystem = sys(({ commands }) => {
  if (Math.random() < 0.2) {
    commands.trigger(new ExplodeMines([0, 0], 10.0));
  }
});

const displayStatsSystem = sys(({ commands }) => {
  const gameState = commands.tryGetResource(GameState);
  if (!gameState) return;

  // Simple console logging for stats
  if (gameState.explosionCount > 0 && gameState.explosionCount % 10 === 0) {
    const remaining = gameState.mineCount;
    const exploded = gameState.explosionCount;
    const percent = ((exploded / gameState.totalMines) * 100).toFixed(1);

    console.log(
      `💥 Explosions: ${exploded} | 🟢 Remaining: ${remaining} | 📊 ${percent}% destroyed`
    );
  }
});

// ==================== Plugin ====================

export class ObserverDemoPlugin implements EcsPlugin {
  name() {
    return "ObserverDemoPlugin";
  }

  build(app: App) {
    // Register events
    app.addEvent(Explode);
    app.addEvent(ExplodeMines);

    // Add systems
    app.addStartupSystems(setupSystem.build());
    app.addUpdateSystems(handleClickSystem.build(), displayStatsSystem.build());

    // ==================== Observers ====================

    // Observer 1: Add mines to spatial index when Mine component is added
    app.addObserver(Mine, "onAdded", ({ trigger, commands }) => {
      const index = commands.getResource(SpatialIndex);

      // Batch processing: iterate over all [mine, entity] pairs
      for (const [mine, entity] of trigger.events()) {
        index.add(entity, mine.pos);
      }

      console.log(`Mine added observer: processed ${trigger.count()} mines`);
    });

    // Observer 2: Remove mines from spatial index when Mine component is removed
    app.addObserver(Mine, "onRemoved", ({ trigger, commands }) => {
      const index = commands.getResource(SpatialIndex);

      // Batch processing: iterate over all [mine, entity] pairs
      for (const [mine, entity] of trigger.events()) {
        index.remove(entity, mine.pos);
      }

      console.log(`Mine removed observer: processed ${trigger.count()} mines`);
    });

    // Observer 3: Handle individual mine explosions
    app.addObserver(Explode, ({ trigger, commands }) => {
      const gameState = commands.getResource(GameState);

      // Batch processing: iterate over all [event, entity] pairs
      for (const [, entity] of trigger.events()) {
        const mine = commands.tryGetComponent(entity, Mine);
        if (!mine) continue;

        // Update stats
        gameState.explosionCount++;
        gameState.mineCount--;

        // Despawn the mine
        commands.despawnEntity(entity);

        // Trigger cascade explosion
        commands.trigger(new ExplodeMines(mine.pos, mine.size));
      }

      console.log(`Explode observer: processed ${trigger.count()} explosions`);
    });

    // Observer 4: Find nearby mines and trigger their explosions
    app.addObserver(ExplodeMines, ({ trigger, commands }) => {
      const index = commands.getResource(SpatialIndex);

      // Batch processing: iterate over all [event, entity] pairs
      for (const [event] of trigger.events()) {
        const nearby = index.getNearby(event.pos);

        for (const nearbyEntity of nearby) {
          const nearbyMine = commands.tryGetComponent(nearbyEntity, Mine);
          if (!nearbyMine) continue;

          // Check if mine is within explosion radius
          const dx = nearbyMine.pos[0] - event.pos[0];
          const dy = nearbyMine.pos[1] - event.pos[1];
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < nearbyMine.size + event.radius) {
            // Trigger explosion on this mine
            commands.trigger(new Explode(), nearbyEntity);
          }
        }
      }

      console.log(`ExplodeMines observer: processed ${trigger.count()} explosion zones`);
    });
  }
}
