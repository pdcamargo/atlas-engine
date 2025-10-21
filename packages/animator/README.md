# @atlas/animator

A powerful animation system for the Atlas ECS framework, inspired by Unity's Animator but tailored for ECS architecture.

## Features

- **Property Animation**: Animate any numeric property with easing functions
- **Timeline Sequences**: Coordinate multiple animations with markers and events
- **Animation Controller**: State machine for complex animation behaviors
- **Rich Event System**: Lifecycle events for all animation types
- **Flexible API**: Both component-based and imperative approaches
- **Performance Focused**: Efficient property access and automatic cleanup

## Installation

```bash
npm install @atlas/animator
```

## Quick Start

```typescript
import { App } from "@atlas/core";
import { AnimatorPlugin, Animation, Easing, LoopMode } from "@atlas/animator";

const app = App.create()
  .addPlugins(new AnimatorPlugin())
  .addStartupSystems(({ commands }) => {
    // Create an object to animate
    const myObject = { x: 0, y: 0, alpha: 1 };

    // Spawn an animation entity
    commands.spawn(
      new Animation({
        target: myObject,
        property: "x",
        to: 100,
        duration: 2.0,
        easing: Easing.easeInOutQuad,
        loopMode: LoopMode.Loop,
      })
    );
  });

await app.run();
```

## Core Concepts

### 1. Animation Component

The `Animation` component animates a single property on a target object.

```typescript
import { Animation, Easing, LoopMode } from "@atlas/animator";

const animation = new Animation({
  target: mySprite,
  property: "position.x", // Supports nested properties
  from: 0,                // Optional, uses current value if not specified
  to: 100,
  duration: 1.5,          // Seconds
  delay: 0.5,             // Delay before starting
  easing: Easing.easeOutBounce,
  loopMode: LoopMode.PingPong,
  autoPlay: true,         // Start immediately
  autoRemove: true,       // Remove component when complete
  speed: 1.0,             // Speed multiplier
});

// Spawn as an entity
commands.spawn(animation);

// Or add to existing entity
commands.entity(entityId).insert(animation);
```

**Control methods:**
```typescript
animation.play();
animation.pause();
animation.resume();
animation.stop();
animation.reset();

// Query state
animation.isPlaying();
animation.isCompleted();
animation.getProgress(); // 0-1
```

### 2. Timeline Component

The `Timeline` component orchestrates multiple animations with precise timing.

```typescript
import { Timeline, Easing, LoopMode } from "@atlas/animator";

const timeline = new Timeline({
  tracks: [
    {
      target: sprite,
      property: "alpha",
      from: 1,
      to: 0,
      duration: 0.5,
      easing: Easing.easeInQuad,
    },
    {
      target: sprite,
      property: "scale",
      to: 2,
      duration: 1.0,
      delay: 0.5, // Start after 0.5 seconds
      easing: Easing.easeOutBack,
    },
  ],
  markers: [
    {
      time: 0.25,
      name: "quarter",
      eventClass: QuarterCompleteEvent, // Optional custom event
    },
    {
      time: 0.75,
      name: "threequarters",
    },
  ],
  autoPlay: true,
  loopMode: LoopMode.Once,
  speed: 1.0,
  autoRemove: true,
});

commands.spawn(timeline);
```

**Timeline features:**
- Multiple parallel/sequential tracks
- Time markers fire events at specific times
- Precise control with `seekTo(time)`
- Loop entire sequences

### 3. AnimationController Component

A Unity-like state machine for complex animation behaviors.

```typescript
import { AnimationController, Easing } from "@atlas/animator";

const controller = new AnimationController({
  states: [
    {
      name: "idle",
      animation: {
        target: sprite,
        property: "scale",
        from: 1,
        to: 1.1,
        duration: 0.5,
        easing: Easing.easeInOutSine,
        loop: LoopMode.PingPong,
      },
    },
    {
      name: "jump",
      animation: {
        target: sprite,
        property: "position.y",
        to: -50,
        duration: 0.3,
        easing: Easing.easeOutQuad,
      },
    },
  ],
  transitions: [
    {
      from: "idle",
      to: "jump",
      condition: (params) => params.get("trigger_jump") === true,
      duration: 0.1, // Blend time
    },
    {
      from: "jump",
      to: "idle",
      condition: (params) => params.get("grounded") === true,
      duration: 0.1,
    },
  ],
  initialState: "idle",
  speed: 1.0,
});

commands.spawn(controller);

// Control the state machine
controller.setTrigger("trigger_jump");
controller.setBool("grounded", false);
controller.setFloat("speed", 5.0);

// Query state
controller.getCurrentState();
controller.isTransitioning();
```

### 4. AnimationManager Resource

The `AnimationManager` provides utilities for one-shot animations.

```typescript
import { AnimationManager } from "@atlas/animator";

// In a system
const animManager = commands.getResource(AnimationManager);

// Create a fire-and-forget animation
animManager.createAnimation(commands, {
  target: myObject,
  property: "x",
  to: 100,
  duration: 1.0,
  easing: Easing.easeOutQuad,
});

// Create multiple animations at once
animManager.createAnimations(commands, [
  { target: obj1, property: "x", to: 100, duration: 1.0 },
  { target: obj2, property: "y", to: 200, duration: 1.5 },
]);

// Get statistics
const stats = animManager.getStats();
console.log(`Active animations: ${stats.active}`);
```

## Easing Functions

All standard easing functions are available:

```typescript
import { Easing } from "@atlas/animator";

// Linear
Easing.linear

// Quadratic
Easing.easeInQuad
Easing.easeOutQuad
Easing.easeInOutQuad

// Cubic
Easing.easeInCubic
Easing.easeOutCubic
Easing.easeInOutCubic

// Quartic, Quintic, Sine, Exponential, Circular
// Back, Elastic, Bounce
// ... and many more
```

## Events

Listen to animation lifecycle events:

```typescript
import {
  AnimationStartedEvent,
  AnimationCompletedEvent,
  AnimationLoopedEvent,
  TimelineMarkerEvent,
  ControllerStateChangedEvent,
} from "@atlas/animator";

// In a system
const reader = events.reader(AnimationCompletedEvent);
for (const event of reader.read()) {
  console.log(`Animation ${event.animationId} completed on entity ${event.entity}`);
}

// Timeline markers
const markerReader = events.reader(TimelineMarkerEvent);
for (const event of markerReader.read()) {
  console.log(`Marker ${event.markerName} reached at ${event.time}`);
}

// Controller state changes
const stateReader = events.reader(ControllerStateChangedEvent);
for (const event of stateReader.read()) {
  console.log(`State changed from ${event.fromState} to ${event.toState}`);
}
```

## Loop Modes

Three loop modes are available:

```typescript
import { LoopMode } from "@atlas/animator";

LoopMode.Once     // Play once and stop
LoopMode.Loop     // Loop continuously
LoopMode.PingPong // Play forward then backward
```

## Advanced Usage

### Custom Property Accessor

Create a custom property accessor for special cases:

```typescript
import { DefaultPropertyAccessor } from "@atlas/animator";

class MyPropertyAccessor extends DefaultPropertyAccessor {
  public get(target: any, path: string): number | undefined {
    // Custom logic
    return super.get(target, path);
  }

  public set(target: any, path: string, value: number): void {
    // Custom logic
    super.set(target, path, value);
  }
}
```

### Nested Property Paths

Animate nested properties using dot notation:

```typescript
const obj = {
  transform: {
    position: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
  },
};

new Animation({
  target: obj,
  property: "transform.position.x", // Nested path
  to: 100,
  duration: 1.0,
});
```

## Best Practices

1. **Auto-remove**: Set `autoRemove: true` for one-shot animations to prevent entity buildup
2. **Speed control**: Use the `speed` parameter instead of modifying `duration` for runtime control
3. **State machines**: Use `AnimationController` for character animations with multiple states
4. **Timelines**: Use `Timeline` for cutscenes, UI sequences, or synchronized effects
5. **Simple animations**: Use `Animation` component or `AnimationManager` for simple tweens

## System Execution Order

The animator systems run in this order during `SystemType.Update`:

1. **ControllerUpdate** - Updates state machines and evaluates transitions
2. **AnimationUpdate** - Updates individual property animations
3. **TimelineUpdate** - Updates timeline sequences

This ensures controllers can drive animations, and timelines can coordinate everything.

## Performance Tips

- Animations auto-remove by default to prevent entity accumulation
- Property accessors use efficient path caching
- Systems skip inactive/paused animations
- Use object pooling for frequently created/destroyed animations

## Examples

See the `examples/` directory for complete working examples:
- Basic animation
- Timeline sequences
- Animation controller state machine
- Event handling
- Multiple synchronized animations

## License

MIT
