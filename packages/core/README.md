# @atlas/core

The core ECS (Entity-Component-System) package for Atlas Engine, providing the foundational architecture for building high-performance 2D games.

## Table of Contents

- [Introduction](#introduction)
- [Core Concepts](#core-concepts)
  - [Entity](#entity)
  - [Component](#component)
  - [System](#system)
- [Architecture](#architecture)
  - [World](#world)
  - [Archetype](#archetype)
  - [Commands](#commands)
- [Entity Lifecycle](#entity-lifecycle)
  - [Spawning Entities](#spawning-entities)
  - [Despawning Entities](#despawning-entities)
  - [Component Management](#component-management)
- [Systems](#systems)
  - [Writing Systems](#writing-systems)
  - [Execution Phases](#execution-phases)
  - [System Sets](#system-sets)
- [Queries](#queries)
  - [QueryBuilder](#querybuilder)
  - [Filtering](#filtering)
  - [Iteration Patterns](#iteration-patterns)
- [Resources](#resources)
  - [Global State](#global-state)
  - [Dependency Injection](#dependency-injection)
- [Events](#events)
  - [Event System](#event-system)
  - [Event Writers](#event-writers)
  - [Event Readers](#event-readers)
  - [Built-in Events](#built-in-events)
- [Observers](#observers)
  - [Observer System](#observer-system)
  - [Registering Observers](#registering-observers)
  - [Component Lifecycle Observers](#component-lifecycle-observers)
  - [Entity-Scoped Observers](#entity-scoped-observers)
  - [Custom Event Observers](#custom-event-observers)
  - [Observer Execution](#observer-execution)
- [Hierarchy](#hierarchy)
  - [Parent/Children Components](#parentchildren-components)
- [Serialization](#serialization)
  - [Component Serialization](#component-serialization)
  - [Scene Persistence](#scene-persistence)
- [Best Practices](#best-practices)
  - [Performance Tips](#performance-tips)
  - [Common Patterns](#common-patterns)
  - [Anti-Patterns](#anti-patterns)

---

## Introduction

**Atlas Engine** uses an **Entity-Component-System (ECS)** architecture, a data-oriented design pattern that separates data (components) from behavior (systems) and identity (entities). This approach provides:

- **Performance**: Cache-friendly data layout with archetype-based storage
- **Flexibility**: Compose entities from reusable components
- **Scalability**: Systems can process thousands of entities efficiently
- **Maintainability**: Clear separation of concerns

## Core Concepts

### Entity

An **Entity** is a unique identifier (integer) representing a game object. Entities have no behavior or data themselves—they are simply IDs that bind components together.

```typescript
type Entity = number;
```

**Example**: Player, enemy, bullet, UI element

### Component

A **Component** is a plain TypeScript class holding data. Components have no behavior—they are pure data containers.

```typescript
class Position {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}
}

class Velocity {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}
}
```

**Key Principle**: Components store state, not logic.

### System

A **System** is a function that processes entities with specific components. Systems contain all game logic and behavior.

```typescript
import { sys } from "@atlas/core";

const movementSystem = sys(({ commands }) => {
  commands.query(Position, Velocity).forEach((entity, position, velocity) => {
    position.x += velocity.x;
    position.y += velocity.y;
  });
});
```

**Key Principle**: Systems operate on components, not entities directly.

---

## Architecture

### World

The **World** is the central storage for all entities and components. It uses an **archetype-based** storage model for optimal performance.

**Key Features**:
- Sequential entity ID allocation (starting from 1)
- Archetype organization (entities grouped by component signature)
- Efficient component queries via columnar storage

**Internal Structure**:
```typescript
class World {
  createEntity(): Entity
  addComponents(entity, components): void
  removeComponent(entity, componentClass): boolean
  destroyEntity(entity): Map<ComponentClass, unknown> | null
  query(...components): Generator
}
```

### Archetype

An **Archetype** is an internal storage structure grouping entities with the same component types. This provides:

- **Cache efficiency**: Components of the same type stored contiguously
- **Fast queries**: Only scan archetypes matching the query signature
- **Swap-and-pop removal**: O(1) entity removal from archetypes

**Example**:
```
Archetype [Position, Velocity]:
  Entities: [1, 2, 3]
  Position: [pos1, pos2, pos3]
  Velocity: [vel1, vel2, vel3]

Archetype [Position, Sprite]:
  Entities: [4, 5]
  Position: [pos4, pos5]
  Sprite: [sprite4, sprite5]
```

### Commands

The **Commands** API is the primary interface for interacting with the ECS world from within systems.

```typescript
class Commands {
  // Entity spawning
  spawn(...components): EntityCommand
  spawnBundle(bundle, overrides?): EntityCommand

  // Entity despawning
  despawnEntity(entity): void
  despawnEntityRecursive(entity): void

  // Component management
  addComponent(entity, component): void
  removeComponent(entity, componentClass): boolean
  getComponent(entity, componentClass): T

  // Queries
  query(...components): QueryBuilder

  // Resources
  getResource(cls): T
  setResource(value): void

  // Entity commands
  entity(entity): EntityCommand
}
```

---

## Entity Lifecycle

### Spawning Entities

Entities are created using `commands.spawn()` or `commands.spawnBundle()`.

#### Spawning with Components

```typescript
import { sys, Position, Velocity } from "@atlas/core";

const spawnPlayerSystem = sys(({ commands }) => {
  const player = commands.spawn(
    new Position(100, 100),
    new Velocity(0, 0)
  ).id();

  console.log("Player spawned:", player);
});
```

**Method Signature**:
```typescript
commands.spawn(c1, c2, c3, c4): EntityCommand
```

You can spawn with 1-17 components (overloaded for type safety).

#### Spawning with Bundles

Bundles are reusable collections of components defined with `defineBundle()`:

```typescript
import { defineBundle, Position, Velocity } from "@atlas/core";

const PlayerBundle = defineBundle({
  position: Position,
  velocity: Velocity
});

// Spawn with constructor arguments as arrays
const player = commands.spawnBundle(PlayerBundle, {
  position: [100, 100],  // new Position(100, 100)
  velocity: [50, 0]      // new Velocity(50, 0)
}).id();
```

**Required Components**:

Use `defineBundle.required()` to enforce that certain components must be provided:

```typescript
const EnemyBundle = defineBundle({
  position: defineBundle.required(Position),  // Must provide
  sprite: Sprite                              // Optional
});

commands.spawnBundle(EnemyBundle, {
  position: [200, 150]  // Required
});
```

#### Entity Commands

Both `spawn()` and `spawnBundle()` return an `EntityCommand` with fluent API:

```typescript
const entity = commands.spawn(new Position())
  .insert(new Velocity())        // Add more components
  .withParent(parentEntity)      // Set parent
  .withChildren(child1, child2)  // Set children
  .id();                         // Get entity ID
```

### Despawning Entities

Entities are destroyed using `commands.despawnEntity()` or `commands.despawnEntityRecursive()`.

#### Deferred Despawning

**All despawn operations are deferred** until the end of the current update phase. This makes despawning update-loop safe—you can despawn entities while iterating over queries without causing crashes.

```typescript
const cleanupSystem = sys(({ commands }) => {
  commands.query(Health).forEach((entity, health) => {
    if (health.value <= 0) {
      commands.despawnEntity(entity);  // Queued for destruction
    }
  });

  // Entities are still alive here - despawn happens after this system finishes
});
```

#### Regular Despawn

```typescript
commands.despawnEntity(entity);
```

- Queues the entity for destruction
- Entity and all its components will be removed
- **Does NOT remove references from Parent/Children** components
- `EntityRemovedEvent` fires **before** destruction (systems can still read components)

#### Recursive Despawn

```typescript
commands.despawnEntityRecursive(entity);
```

- Queues the entity and all descendants for destruction
- Walks the hierarchy using `Children` components (breadth-first)
- Despawns children before parents (bottom-up order)
- **Does NOT remove references from Parent/Children** of non-despawned entities

#### Important Notes

**Parent/Children References**:

Despawning does NOT clean up parent/children references:

```typescript
// Parent has Children([child1, child2, child3])
commands.despawnEntity(child2);

// After despawn flush:
// - child2 is destroyed
// - Parent still has Children([child1, child2, child3])  ← child2 is now invalid!
// - Querying parent.childrenIds[1] will return an invalid entity
```

If you attempt to use an invalid entity ID, operations will fail gracefully (return `undefined` or `false`).

**Flush Timing**:

Despawns are flushed automatically at these points:
1. After `PostUpdate` phase
2. After each `PostFixedUpdate` cycle
3. Before `Render` phase

You should never need to call `commands.flushDespawns()` manually.

#### Entity Command API

You can also despawn using the fluent entity API:

```typescript
// Equivalent methods
commands.entity(entity).despawn();
commands.entity(entity).despawnRecursive();
```

### Component Management

#### Adding Components

```typescript
// Add single component
commands.addComponent(entity, new Velocity(10, 0));

// Add multiple components
commands.addComponents(entity, new Velocity(10, 0), new Sprite(texture));

// Using entity command
commands.entity(entity).insert(new Velocity(10, 0));
```

#### Removing Components

```typescript
const removed = commands.removeComponent(entity, Velocity);
console.log(removed);  // true if component was removed
```

**Note**: If you remove all components from an entity, it will be removed from all archetypes but the entity ID remains valid until despawned.

#### Getting Components

```typescript
// Get component (throws if not found)
const position = commands.getComponent(entity, Position);

// Try get component (returns undefined if not found)
const velocity = commands.tryGetComponent(entity, Velocity);

// Check if component exists
if (commands.hasComponent(entity, Health)) {
  // Entity has Health component
}
```

---

## Systems

### Writing Systems

Systems are functions that receive `commands` and `events` parameters. Use the `sys()` wrapper for system metadata:

```typescript
import { sys, QueryBuilder, Input, KeyCode } from "@atlas/core";

const movePlayerSystem = sys(({ commands, events }) => {
  const input = commands.getResource(Input);

  commands.query(Player, Position, Velocity).forEach((entity, player, position, velocity) => {
    // Reset velocity
    velocity.x = 0;
    velocity.y = 0;

    // Handle input
    if (input.pressed(KeyCode.ArrowRight)) velocity.x = 100;
    if (input.pressed(KeyCode.ArrowLeft)) velocity.x = -100;
    if (input.pressed(KeyCode.ArrowUp)) velocity.y = 100;
    if (input.pressed(KeyCode.ArrowDown)) velocity.y = -100;

    // Update position
    position.x += velocity.x * deltaTime;
    position.y += velocity.y * deltaTime;
  });
}).label("MovePlayer");
```

**System Features**:

```typescript
sys(({ commands, events }) => {
  // System logic
})
  .label("SystemName")                    // Debugging and ordering
  .runIf(() => boolean)                   // Conditional execution
  .before("OtherSystem")                  // Ordering constraint
  .after("DependencySystem");             // Ordering constraint
```

### Execution Phases

Systems execute in phases during each frame:

```
┌─ StartUp (once before loop)
│
├─ PreUpdate
├─ Update
├─ PostUpdate
│   └─ [Flush Despawns]
│
├─ Fixed Update Loop (60 FPS)
│   ├─ PreFixedUpdate
│   ├─ FixedUpdate
│   ├─ PostFixedUpdate
│   └─ [Flush Despawns]
│
├─ PreRender
├─ Render
├─ PostRender
│
└─ [Event Cleanup]
```

**Phase Descriptions**:

- **StartUp**: One-time initialization (runs once before loop)
- **PreUpdate**: Setup before main update (input processing, state preparation)
- **Update**: Main game logic (AI, gameplay, state changes)
- **PostUpdate**: Cleanup and validation after main update
- **PreFixedUpdate**: Setup before physics (constraint preparation)
- **FixedUpdate**: Physics simulation and deterministic logic (60 FPS)
- **PostFixedUpdate**: Physics cleanup and collision resolution
- **PreRender**: Prepare rendering data (frustum culling, sorting)
- **Render**: Rendering commands (draw calls, render pass execution)
- **PostRender**: Post-render cleanup (debug overlays, profiling)

**Registering Systems**:

```typescript
await App.create()
  .addStartupSystems(initSystem)
  .addUpdateSystems(gameplaySystem, aiSystem)
  .addFixedUpdateSystems(physicsSystem)
  .addRenderSystems(spriteRenderSystem, uiRenderSystem)
  .run();
```

### System Sets

Group related systems together with `createSet()`:

```typescript
import { createSet } from "@atlas/core";

app.addUpdateSystems(
  createSet("Physics::Update",
    velocitySystem,
    collisionSystem,
    constraintSystem
  )
);
```

**Set Features**:

```typescript
app.addSetRunIf("Physics::Update", () => !paused);
app.addSetBeforeSet("Physics::Update", ["Render::Update"]);
app.addSetAfterSet("Physics::Update", ["Input::Update"]);
```

---

## Queries

### QueryBuilder

The `QueryBuilder` provides a fluent API for querying entities:

```typescript
const query = commands.query(Position, Velocity);

// Iterate with forEach
query.forEach((entity, position, velocity) => {
  position.x += velocity.x;
  position.y += velocity.y;
});

// Get all results as array
const results = query.all();
for (const [entity, position, velocity] of results) {
  // Process entity
}

// Find first match
const player = query.tryFind();
if (player) {
  const [entity, position, velocity] = player;
}

// Find or throw
const [entity, position, velocity] = query.find();
```

### Filtering

Use `.without()` to exclude entities with specific components:

```typescript
// All entities with Position but WITHOUT Velocity
commands.query(Position)
  .without(Velocity)
  .forEach((entity, position) => {
    // Static entities only
  });

// Multiple exclusions
commands.query(Position)
  .without(Velocity, Health)
  .forEach((entity, position) => {
    // Entities with Position but no Velocity or Health
  });
```

### Iteration Patterns

**Pattern 1: Direct query in system**
```typescript
sys(({ commands }) => {
  commands.query(Position, Velocity).forEach((entity, pos, vel) => {
    pos.x += vel.x;
  });
});
```

**Pattern 2: Pre-defined query**
```typescript
const movableQuery = new QueryBuilder(Position, Velocity);

sys(({ commands }) => {
  commands.query(movableQuery).forEach((entity, pos, vel) => {
    pos.x += vel.x;
  });
});
```

**Pattern 3: Collect and process**
```typescript
sys(({ commands }) => {
  const entities = commands.query(Health).all();

  for (const [entity, health] of entities) {
    if (health.value <= 0) {
      commands.despawnEntity(entity);
    }
  }
});
```

---

## Resources

### Global State

Resources are singleton objects stored globally in the App. They provide global state and services to systems.

```typescript
class GameState {
  constructor(
    public score: number = 0,
    public level: number = 1
  ) {}
}

// Register resource
app.setResource(new GameState());

// Access in system
sys(({ commands }) => {
  const gameState = commands.getResource(GameState);
  gameState.score += 10;
});
```

### Dependency Injection

Resources are dependency-injected by class name:

```typescript
// Check if resource exists
if (commands.hasResource(AudioManager)) {
  const audio = commands.getResource(AudioManager);
  audio.play("explosion");
}

// Try get (returns undefined if missing)
const audio = commands.tryGetResource(AudioManager);
if (audio) {
  audio.play("music");
}
```

---

## Events

### Event System

Events provide decoupled communication between systems. Events are scoped per-system using readers.

```typescript
class EnemyDefeatedEvent {
  constructor(
    public entity: Entity,
    public score: number
  ) {}
}

// Register event
app.addEvent(EnemyDefeatedEvent);
```

### Event Writers

Send events from systems:

```typescript
sys(({ commands, events }) => {
  commands.query(Enemy, Health).forEach((entity, enemy, health) => {
    if (health.value <= 0) {
      events.send(new EnemyDefeatedEvent(entity, enemy.scoreValue));
      commands.despawnEntity(entity);
    }
  });
});
```

### Event Readers

Read events in other systems:

```typescript
sys(({ commands, events }) => {
  const reader = events.reader(EnemyDefeatedEvent);

  for (const event of reader.read()) {
    const gameState = commands.getResource(GameState);
    gameState.score += event.score;
    console.log("Enemy defeated! Score:", event.score);
  }
});
```

**Key Behavior**:
- Events are scoped per-reader (each system has its own read cursor)
- Events persist for 2 frames (configurable with `events.setRetentionFrames()`)
- Events are cleared automatically at frame end (`onFrameEnd()`)

### Built-in Events

#### EntityAddedEvent

Fired immediately when an entity is spawned:

```typescript
sys(({ events }) => {
  const reader = events.reader(EntityAddedEvent);

  for (const event of reader.read()) {
    console.log("Entity spawned:", event.entity);
  }
});
```

#### EntityRemovedEvent

Fired **before** an entity is destroyed (during `flushDespawns()`):

```typescript
sys(({ commands, events }) => {
  const reader = events.reader(EntityRemovedEvent);

  for (const event of reader.read()) {
    // Entity still exists - can query components
    const position = commands.tryGetComponent(event.entity, Position);
    if (position) {
      console.log("Entity despawned at:", position.x, position.y);
    }
  }
});
```

**Important**: `EntityRemovedEvent` fires before destruction, allowing systems to read component data for cleanup purposes.

---

## Observers

### Observer System

The **Observer System** provides reactive programming capabilities for the ECS, inspired by Bevy's observer pattern. Observers are callbacks that automatically fire in response to triggered events—perfect for game logic that reacts to specific occurrences like explosions, component changes, or custom game events.

**Key Features**:
- **Component lifecycle observers**: React to component add/remove events
- **Custom event observers**: Trigger observers with any event type
- **Entity-scoped observers**: Observers that only fire for specific entities
- **Deferred execution**: Observers flush at safe boundaries (like despawning)
- **Type-safe**: Full TypeScript type inference for event payloads

**Comparison with Events**:
- **Events**: Polled by systems using readers (pull model)
- **Observers**: Execute automatically when triggered (push model)

Use observers when you want reactive, event-driven logic without polling every frame.

### Registering Observers

Observers are registered at the app level using `app.addObserver()`:

```typescript
import { App, Trigger, Commands } from "@atlas/core";

class Explode {
  constructor(public entity: Entity) {}
}

// Register observer for Explode events
await App.create()
  .addObserver(Explode, (trigger: Trigger<Explode>, commands: Commands) => {
    const entity = trigger.entity();
    const event = trigger.event();

    console.log("Entity exploded:", entity);
    commands.despawnEntity(entity);
  })
  .run();
```

**Observer Signature**:
```typescript
type ObserverCallback<TEvent> = (
  trigger: Trigger<TEvent>,
  commands: Commands
) => void;
```

**Trigger API**:
```typescript
class Trigger<TEvent> {
  event(): TEvent          // Get the event instance
  entity(): Entity         // Get target entity (0 for broadcast events)
  hasEntity(): boolean     // Check if event targets a specific entity
}
```

### Component Lifecycle Observers

Observers can react to components being added or removed from entities. This is useful for initializing state, updating spatial indexes, or cleanup.

#### ComponentAdded Observer

```typescript
import { ComponentAdded, Trigger } from "@atlas/core";

class Mine {
  constructor(
    public pos: vec2,
    public size: number
  ) {}
}

// React when Mine component is added to any entity
app.addObserver(ComponentAdded, (trigger: Trigger<ComponentAdded<Mine>>, commands) => {
  const event = trigger.event();
  const entity = event.entity;
  const mine = event.component as Mine;

  // Add mine to spatial index
  const index = commands.getResource(SpatialIndex);
  index.add(entity, mine.pos);
});
```

**ComponentAdded Event**:
```typescript
class ComponentAdded<T> {
  entity: Entity;                // Entity that received the component
  component: T;                  // The component instance that was added
  componentClass: ComponentClass<T>;  // Component class reference
}
```

#### ComponentRemoved Observer

```typescript
// React when Mine component is removed from any entity
app.addObserver(ComponentRemoved, (trigger: Trigger<ComponentRemoved<Mine>>, commands) => {
  const event = trigger.event();
  const entity = event.entity;
  const mine = event.component as Mine;

  // Remove mine from spatial index
  const index = commands.getResource(SpatialIndex);
  index.remove(entity, mine.pos);
});
```

**ComponentRemoved Event**:
```typescript
class ComponentRemoved<T> {
  entity: Entity;                // Entity that lost the component
  component: T;                  // The component instance that was removed
  componentClass: ComponentClass<T>;  // Component class reference
}
```

**Important Notes**:
- Component events are triggered automatically by `World.addComponents()` and `World.removeComponent()`
- Events are deferred—observers fire during the next observer flush
- Component lifecycle observers are global by default (react to all entities)
- Use entity-scoped observers (see below) to watch specific entities

### Entity-Scoped Observers

Register observers that only fire for specific entities using `.observe()` during entity spawning:

```typescript
class Explode {
  constructor() {}
}

// Spawn a mine with entity-scoped observer
const mine = commands.spawn(
  new Mine(pos, size)
)
.observe(Explode, (trigger, commands) => {
  // This observer ONLY fires when THIS specific mine explodes
  const entity = trigger.entity();
  console.log("This mine exploded:", entity);

  // Trigger cascade explosion
  commands.trigger(new ExplodeMines({ pos: mine.pos, radius: mine.size }));
})
.id();
```

**When to use entity-scoped observers**:
- Entity-specific reactions (e.g., "this mine explodes")
- Behavior tied to individual entities (e.g., death animations)
- Avoiding global queries (better performance for targeted reactions)

**When to use global observers**:
- Reactions that apply to all entities of a type
- Centralized logic (e.g., updating a spatial index)
- Component lifecycle tracking

### Custom Event Observers

Trigger observers from systems using `commands.trigger()`:

```typescript
// Define custom event
class ExplodeMines {
  constructor(
    public pos: vec2,
    public radius: number
  ) {}
}

// Register observer
app.addObserver(ExplodeMines, (trigger, commands) => {
  const event = trigger.event();
  const index = commands.getResource(SpatialIndex);

  // Find nearby mines
  for (const entity of index.getNearby(event.pos, event.radius)) {
    // Trigger explosion on each mine
    commands.trigger(new Explode(), entity);
  }
});

// Trigger from system
sys(({ commands }) => {
  // Trigger broadcast event (no specific entity)
  commands.trigger(new ExplodeMines({ pos, radius: 50 }));

  // Trigger entity-targeted event
  commands.trigger(new Explode(), mineEntity);
});
```

**Broadcast vs Entity-Targeted Events**:

```typescript
// Broadcast event (no target entity)
commands.trigger(new GameOver({ score: 1000 }));

// Entity-targeted event
commands.trigger(new TakeDamage({ amount: 10 }), playerEntity);
```

- **Broadcast events**: Fire all global observers, skip entity-scoped observers
- **Entity-targeted events**: Fire global observers + entity-scoped observers for that entity

### Observer Execution

Observers use **deferred execution** (like despawning) for loop safety and predictable timing.

**Execution Flow**:
```
1. System calls commands.trigger(event)
2. Event is queued in ObserverTrigger
3. System continues executing
4. At flush boundary, all observers execute
5. Queue is cleared
```

**Flush Boundaries**:
- After `PostUpdate` phase
- After each `PostFixedUpdate` cycle

**Execution Order**:
```
┌─ PreUpdate
├─ Update
├─ PostUpdate
│   ├─ [Flush Observers]    ← Observers execute here
│   └─ [Flush Despawns]
│
├─ Fixed Update Loop
│   ├─ PreFixedUpdate
│   ├─ FixedUpdate
│   ├─ PostFixedUpdate
│   │   ├─ [Flush Observers]    ← Observers execute here
│   │   └─ [Flush Despawns]
│
├─ PreRender
├─ Render
├─ PostRender
```

**Complete Example: Mine Explosion Cascade**

```typescript
import { App, sys, Trigger, Commands, ComponentAdded } from "@atlas/core";

class Mine {
  constructor(public pos: vec2, public size: number) {}
}

class Explode {}

class ExplodeMines {
  constructor(public pos: vec2, public radius: number) {}
}

class SpatialIndex {
  private index: Map<string, Set<Entity>> = new Map();

  add(entity: Entity, pos: vec2) { /* ... */ }
  remove(entity: Entity, pos: vec2) { /* ... */ }
  getNearby(pos: vec2, radius: number): Entity[] { /* ... */ }
}

await App.create()
  // Register spatial index resource
  .addStartupSystems(({ commands }) => {
    commands.setResource(new SpatialIndex());
  })

  // Add mine to index when Mine component added
  .addObserver(ComponentAdded, (trigger: Trigger<ComponentAdded<Mine>>, commands) => {
    const event = trigger.event();
    if (!(event.component instanceof Mine)) return;

    const mine = event.component;
    const index = commands.getResource(SpatialIndex);
    index.add(event.entity, mine.pos);
  })

  // Remove mine from index when Mine component removed
  .addObserver(ComponentRemoved, (trigger: Trigger<ComponentRemoved<Mine>>, commands) => {
    const event = trigger.event();
    if (!(event.component instanceof Mine)) return;

    const mine = event.component;
    const index = commands.getResource(SpatialIndex);
    index.remove(event.entity, mine.pos);
  })

  // ExplodeMines: find nearby mines and trigger their explosions
  .addObserver(ExplodeMines, (trigger, commands) => {
    const event = trigger.event();
    const index = commands.getResource(SpatialIndex);

    for (const entity of index.getNearby(event.pos, event.radius)) {
      const mine = commands.tryGetComponent(entity, Mine);
      if (mine && distance(mine.pos, event.pos) < mine.size + event.radius) {
        commands.trigger(new Explode(), entity);
      }
    }
  })

  // Explode: despawn mine and trigger cascade
  .addObserver(Explode, (trigger, commands) => {
    const entity = trigger.entity();
    const mine = commands.tryGetComponent(entity, Mine);
    if (!mine) return;

    console.log("Mine exploded:", entity);
    commands.despawnEntity(entity);

    // Trigger cascade explosion
    commands.trigger(new ExplodeMines({ pos: mine.pos, radius: mine.size }));
  })

  // System: handle mouse clicks to explode mines
  .addUpdateSystems(sys(({ commands }) => {
    const input = commands.getResource(Input);
    if (input.isMouseButtonJustPressed(MouseButton.Left)) {
      const mousePos = input.getMousePosition();
      commands.trigger(new ExplodeMines({ pos: mousePos, radius: 10 }));
    }
  }))

  .run();
```

**Key Patterns**:

1. **Spatial Index Pattern**: Use `ComponentAdded`/`ComponentRemoved` for automatic index updates
2. **Cascade Events**: Observers can trigger more events (e.g., explosion chains)
3. **Entity-Scoped Cleanup**: Attach observers to entities for automatic cleanup
4. **Reactive Logic**: Let observers handle reactions instead of polling in systems

---

## Hierarchy

### Parent/Children Components

Atlas provides `Parent` and `Children` components for entity hierarchies:

```typescript
class Parent {
  constructor(public parentId: Entity) {}
}

class Children {
  constructor(public childrenIds: Entity[]) {}
}
```

**Creating Hierarchies**:

```typescript
// Spawn parent
const parent = commands.spawn(new Position(100, 100)).id();

// Spawn children with parent
const child1 = commands.spawn(new Position(10, 10))
  .withParent(parent)
  .id();

const child2 = commands.spawn(new Position(20, 20))
  .withParent(parent)
  .id();

// Add children to existing entity
commands.entity(parent).pushChildren(child1, child2);

// Set all children (replaces existing)
commands.entity(parent).setChildren(child1, child2, child3);

// Remove specific children
commands.entity(parent).removeChildren(child2);
```

**Traversing Hierarchies**:

```typescript
sys(({ commands }) => {
  commands.query(Parent).forEach((entity, parent) => {
    const parentEntity = parent.parentId;
    // Process parent
  });

  commands.query(Children).forEach((entity, children) => {
    for (const childId of children.childrenIds) {
      // Process each child
    }
  });
});
```

**Important Notes**:

1. **Despawning does NOT update references**: If you despawn a child, the parent's `Children` component still references it (becomes invalid entity ID).
2. **Recursive despawn**: Use `commands.despawnEntityRecursive(parent)` to despawn parent and all descendants.
3. **Manual cleanup**: If you need clean references, manually update `Parent`/`Children` components before despawning.

---

## Serialization

### Component Serialization

Components can be serialized for save/load functionality using decorators:

```typescript
import { Serializable, SerializeProperty } from "@atlas/core";

@Serializable()
class Player {
  @SerializeProperty()
  public health: number = 100;

  @SerializeProperty()
  public level: number = 1;

  // Not serialized
  public cachedSprite?: Sprite;
}
```

**Custom Serializers**:

```typescript
@Serializable()
class Position {
  @SerializeProperty({ serializer: "vec2" })
  public value: vec2;
}
```

### Scene Persistence

Save and load groups of entities:

```typescript
// Save entities to scene
const entities = [player, enemy1, enemy2];
const scene = commands.saveScene(entities);

// Save to JSON
const json = JSON.stringify(scene);

// Load from JSON
const loadedScene = JSON.parse(json);
const instance = commands.spawnScene(loadedScene);

// Get entity mappings (old ID → new ID)
const newPlayerId = instance.entityMap.get(player);
```

---

## Best Practices

### Performance Tips

1. **Use queries efficiently**: Pre-define `QueryBuilder` instances for reused queries
2. **Minimize archetype moves**: Avoid frequently adding/removing components
3. **Batch component updates**: Process all entities of a type together
4. **Prefer iteration over individual lookups**: `forEach` is faster than repeated `getComponent`
5. **Use deferred despawning**: Never despawn immediately during iteration
6. **Keep components small**: Large components hurt cache efficiency
7. **Avoid logic in components**: Components should be pure data

### Common Patterns

**Pattern: Conditional Component Addition**
```typescript
sys(({ commands }) => {
  commands.query(Player).forEach((entity) => {
    if (!commands.hasComponent(entity, Invincibility)) {
      commands.addComponent(entity, new Invincibility(2.0));
    }
  });
});
```

**Pattern: Component-based State Machine**
```typescript
class Idle {}
class Running {}
class Jumping {}

// Transition from Idle to Running
commands.removeComponent(player, Idle);
commands.addComponent(player, new Running());

// Query by state
commands.query(Player, Running).forEach((entity, player, running) => {
  // Player is running
});
```

**Pattern: Marker Components**
```typescript
class Dead {}

// Mark entity as dead
commands.addComponent(enemy, new Dead());

// Cleanup system
commands.query(Dead).forEach((entity) => {
  commands.despawnEntity(entity);
});
```

**Pattern: Event-Driven Spawning**
```typescript
sys(({ commands, events }) => {
  const reader = events.reader(SpawnEnemyEvent);

  for (const event of reader.read()) {
    commands.spawn(
      new Position(event.x, event.y),
      new Enemy()
    );
  }
});
```

### Anti-Patterns

**❌ Don't: Spawn during iteration over same query**
```typescript
// BAD - May cause infinite loop or skip entities
commands.query(Position).forEach((entity, position) => {
  commands.spawn(new Position());  // Spawns during iteration
});
```

**✅ Do: Collect entities, then spawn**
```typescript
const toSpawn: Position[] = [];
commands.query(Position).forEach((entity, position) => {
  toSpawn.push(new Position(position.x + 10, position.y));
});

for (const pos of toSpawn) {
  commands.spawn(pos);
}
```

**❌ Don't: Store entity references in components**
```typescript
// BAD - Entity might be despawned
class Enemy {
  public target: Entity;  // Risky!
}
```

**✅ Do: Use queries or Parent/Children**
```typescript
// GOOD - Query for target each frame
commands.query(Player).tryFind();

// GOOD - Use hierarchy
commands.entity(entity).setParent(targetEntity);
```

**❌ Don't: Call commands from component constructors**
```typescript
// BAD - Side effects in constructor
class Spawner {
  constructor(commands: Commands) {
    commands.spawn(new Enemy());  // Don't do this!
  }
}
```

**✅ Do: Use systems for spawning**
```typescript
// GOOD - Spawn from system
sys(({ commands }) => {
  commands.query(Spawner).forEach((entity, spawner) => {
    if (spawner.shouldSpawn) {
      commands.spawn(new Enemy());
    }
  });
});
```

---

## Summary

Atlas Core ECS provides:

- **Entities**: Unique identifiers (integers)
- **Components**: Pure data containers (classes)
- **Systems**: Logic and behavior (functions)
- **World**: Archetype-based storage (cache-efficient)
- **Commands**: Primary API for ECS operations
- **Queries**: Efficient entity filtering and iteration
- **Resources**: Global state and services
- **Events**: Decoupled communication
- **Hierarchy**: Parent/Children relationships
- **Serialization**: Save/load functionality

For more examples, see the demo games in `apps/web/src/games/`.
