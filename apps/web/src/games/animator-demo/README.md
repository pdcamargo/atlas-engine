# Animator Demo

A comprehensive demonstration of the `@atlas/animator` package showcasing all animation capabilities.

## What This Demo Shows

### 1. Simple Animations with Different Easing Functions (Top Row)
- **6 sprites** demonstrating different easing functions:
  - Linear (Red) - Constant speed
  - EaseInQuad (Green) - Slow start, fast end
  - EaseOutQuad (Blue) - Fast start, slow end
  - EaseInOutQuad (Yellow) - Slow at both ends
  - Bounce (Magenta) - Bouncing effect
  - Elastic (Cyan) - Spring/rubber band effect
- All sprites animate up and down using `LoopMode.PingPong`

### 2. Timeline Sequence (Middle Left)
- **Orange sprite** demonstrating complex timeline:
  - Moves from left to right
  - Bounces up and down in the middle
  - Scales up then back down
  - Shows timeline markers at key moments
  - Loops continuously

**Timeline Events:**
- `jump_start` (0.5s) - Fires custom `ExplosionEvent`
- `scale_start` (1.5s) - Scaling begins
- `sequence_end` (3.0s) - Full sequence complete

### 3. Animation Controller State Machine (Middle)
- **Green sprite** with character-like behavior:
  - **Idle state**: Gentle breathing animation (scale pulsing)
  - **Jump state**: Moves upward with ease-out
  - **Fall state**: Returns down with ease-in
  - Automatically cycles: idle → jump → fall → idle every 3 seconds
- Demonstrates parameter-driven state transitions
- Shows state change events in console

### 4. Fire-and-Forget Particles (Bottom Right)
- **Random colored particles** spawn every 0.5 seconds
- Each particle has multiple synchronized animations:
  - Moves upward
  - Drifts sideways randomly
  - Fades out
  - Scales down
- Auto-removes when complete (no memory leaks!)
- Created using `AnimationManager.createAnimations()`

### 5. Synchronized Rotating Sprites (Bottom Circle)
- **8 sprites** arranged in a circle
- Each sprite:
  - Rotates at a different speed
  - Pulses in scale with staggered timing
  - Demonstrates multiple simultaneous animations per entity
- Rainbow colors based on position

## Events Being Logged

The demo logs all animation events to the console:

- 🎬 `AnimationStartedEvent` - When animations begin
- ✅ `AnimationCompletedEvent` - When animations finish
- 🔁 `AnimationLoopedEvent` - Each time a loop completes
- 📍 `TimelineMarkerEvent` - When timeline markers are reached
- 🎞️ `TimelineCompletedEvent` - When timelines finish
- 💥 `ExplosionEvent` - Custom event from timeline marker
- 🎮 `ControllerStateChangedEvent` - State machine transitions
- 📊 Animation Statistics - Every 5 seconds

## Key Concepts Demonstrated

### Component-Based Animations
```typescript
// Attach animation to an entity
commands.entity(entity).insert(
  new Animation({
    target: sprite.position,
    property: "y",
    to: targetY,
    duration: 1.5,
    easing: Easing.easeOutBounce,
    loopMode: LoopMode.PingPong,
  })
);
```

### Timeline Sequences
```typescript
// Coordinate multiple animations with markers
new Timeline({
  tracks: [
    { target: obj1, property: "x", to: 100, duration: 2.0 },
    { target: obj2, property: "y", to: 50, duration: 1.0, delay: 0.5 },
  ],
  markers: [
    { time: 0.5, name: "halfway", eventClass: MyEvent },
  ],
});
```

### State Machines
```typescript
// Character-like animation controller
new AnimationController({
  states: [
    { name: "idle", animation: {...} },
    { name: "jump", animation: {...} },
  ],
  transitions: [
    {
      from: "idle",
      to: "jump",
      condition: (params) => params.get("trigger_jump") === true,
    },
  ],
  initialState: "idle",
});
```

### Fire-and-Forget
```typescript
// Create animations that auto-cleanup
animManager.createAnimations(commands, [
  { target: particle, property: "y", to: 100, duration: 2.0 },
  { target: particle.tint, property: "a", to: 0, duration: 2.0 },
]);
```

## Controls

- The demo runs automatically - just watch!
- All animations loop or regenerate
- Check the console for event logging

## Performance Notes

- **Active Animations**: Check console stats (logged every 5 seconds)
- **Auto-Cleanup**: Completed animations are automatically removed
- **Efficient Updates**: Systems skip non-playing animations
- **No Memory Leaks**: Fire-and-forget particles clean up themselves

## Running the Demo

Set `GAME = "animator-demo"` in [main.ts](../../main.ts):

```typescript
const GAME: string = "animator-demo";
```

Then start the dev server:

```bash
npm run dev
```

## Code Reference

See [animator-demo.ts](./animator-demo.ts) for the complete implementation.

## Learn More

- **Package Docs**: [packages/animator/README.md](/packages/animator/README.md)
- **Examples**: [packages/animator/EXAMPLE.md](/packages/animator/EXAMPLE.md)
- **Architecture**: [packages/animator/ARCHITECTURE.md](/packages/animator/ARCHITECTURE.md)
