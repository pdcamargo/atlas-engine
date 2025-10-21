# Animator Package Architecture

## Overview

The `@atlas/animator` package provides a comprehensive animation system for the Atlas ECS framework. It follows ECS best practices and is inspired by Unity's Animator system while being tailored for component-based architecture.

## Design Principles

1. **ECS-First**: All animation functionality is built around components, systems, and events
2. **Composable**: Multiple animation types can work together (Animation + Timeline + Controller)
3. **Event-Driven**: Rich event system for animation lifecycle and coordination
4. **Performance**: Efficient property access, automatic cleanup, and minimal overhead
5. **Type-Safe**: Full TypeScript support with strong typing

## Architecture Layers

### 1. Core Types (`types.ts`)

Defines fundamental types used throughout the package:
- `EasingFunction`: Function signature for easing
- `AnimationState`: Enum for animation playback state
- `LoopMode`: Enum for loop behavior
- `AnimationTrack`: Track definition for timelines
- `TimelineMarker`: Event marker for timelines
- `ControllerState`: State definition for controllers
- `ControllerTransition`: Transition definition for controllers
- `PropertyAccessor`: Interface for custom property access

### 2. Property Access Layer (`property-accessor.ts`)

**DefaultPropertyAccessor**: Handles reading/writing properties using dot notation
- Supports nested properties: `"transform.position.x"`
- Creates intermediate objects if needed
- Type-safe numeric property access
- Extensible for custom behaviors

### 3. Easing Layer (`easing/`)

**functions.ts**: Collection of 30+ easing functions
- Linear, Quad, Cubic, Quart, Quint
- Sine, Expo, Circ
- Back, Elastic, Bounce
- All with In, Out, and InOut variants

**Easing namespace**: Convenient access to all functions

### 4. Component Layer (`components/`)

#### Animation Component
**Purpose**: Animate a single property on a target object

**Features**:
- Property tweening with easing
- Delay support
- Loop modes (Once, Loop, PingPong)
- Speed control
- Auto-removal when complete
- Play/pause/resume/stop controls

**Lifecycle**:
1. Created with target, property, and parameters
2. Optionally delayed before starting
3. Updates property each frame using easing
4. Fires events at key moments
5. Optionally auto-removes when complete

#### Timeline Component
**Purpose**: Orchestrate multiple animations with precise timing

**Features**:
- Multiple parallel/sequential tracks
- Time markers with events
- Seek to specific time
- Loop entire sequences
- Auto-removal when complete

**Lifecycle**:
1. Created with animation tracks and markers
2. Updates all active tracks each frame
3. Fires marker events at specified times
4. Handles track start/end timing
5. Supports looping and seeking

#### AnimationController Component
**Purpose**: State machine for complex animation behaviors

**Features**:
- Multiple animation states
- Conditional transitions
- Parameters (bools, floats, triggers)
- Blend between states
- Speed control per state

**Lifecycle**:
1. Created with states and transitions
2. Evaluates transition conditions each frame
3. Handles state changes with blending
4. Updates current state animation
5. Fires state change events

### 5. System Layer (`systems/`)

#### Animation Update System
**Execution**: `SystemType.Update`

**Responsibilities**:
1. Query all Animation components
2. Skip non-playing animations
3. Handle delay countdown
4. Initialize `from` value if needed
5. Update elapsed time
6. Apply easing and interpolation
7. Set property value
8. Handle loop modes
9. Fire lifecycle events
10. Auto-remove completed animations

**Event Flow**:
- `AnimationStartedEvent` - After delay completes
- `AnimationLoopedEvent` - Each loop cycle
- `AnimationCompletedEvent` - When finished

#### Timeline Update System
**Execution**: `SystemType.Update` (after Animation)

**Responsibilities**:
1. Query all Timeline components
2. Skip non-playing timelines
3. Update timeline time
4. Fire marker events
5. Update all active tracks
6. Initialize track start values
7. Calculate track progress
8. Apply track animations
9. Handle timeline completion/looping
10. Auto-remove completed timelines

**Event Flow**:
- `TimelineStartedEvent` - When playback begins
- `TimelineMarkerEvent` - When marker time is reached
- Custom marker events - If specified in marker
- `TimelineCompletedEvent` - When timeline finishes

#### Controller Update System
**Execution**: `SystemType.Update` (before Animation and Timeline)

**Responsibilities**:
1. Query all AnimationController components
2. Skip inactive controllers
3. Check transition conditions
4. Handle active transitions
5. Update current state animation
6. Fire state change events
7. Reset consumed triggers

**Event Flow**:
- `ControllerStateChangedEvent` - On state transitions
- `ControllerParameterChangedEvent` - When parameters change

### 6. Resource Layer (`resources/`)

#### AnimationManager
**Purpose**: Global animation utilities and statistics

**Features**:
- Create one-shot animations imperatively
- Create multiple animations at once
- Global time scale
- Animation statistics (created, completed, active)

**Use Cases**:
- Fire-and-forget animations
- Dynamic animation creation
- Performance monitoring
- Global animation control

### 7. Event Layer (`events/`)

**Animation Events**:
- `AnimationStartedEvent`
- `AnimationCompletedEvent`
- `AnimationLoopedEvent`
- `AnimationPausedEvent`
- `AnimationResumedEvent`
- `AnimationStoppedEvent`

**Timeline Events**:
- `TimelineStartedEvent`
- `TimelineMarkerEvent`
- `TimelineTriggerEvent`
- `TimelineCompletedEvent`

**Controller Events**:
- `ControllerStateChangedEvent`
- `ControllerParameterChangedEvent`

### 8. Plugin Layer (`plugin.ts`)

**AnimatorPlugin**: Main plugin that integrates with ECS

**Responsibilities**:
1. Create and register AnimationManager resource
2. Register all event types
3. Add systems in correct order
4. Configure system dependencies

**System Ordering**:
```
ControllerUpdate -> AnimationUpdate -> TimelineUpdate
```

This ensures:
- Controllers can drive animations
- Animations update before timelines coordinate them
- Proper dependency flow

## Data Flow

### Animation Flow
```
User/System
    ↓
Creates Animation Component
    ↓
AnimationUpdateSystem
    ↓
Property Accessor (reads current value)
    ↓
Easing Function (applies curve)
    ↓
Property Accessor (writes new value)
    ↓
Target Object Updated
    ↓
Events Fired
```

### Timeline Flow
```
User/System
    ↓
Creates Timeline Component
    ↓
TimelineUpdateSystem
    ↓
For each track:
    - Property Accessor (reads/writes)
    - Easing Function
    ↓
For each marker:
    - Time comparison
    - Event firing
    ↓
Events Fired
```

### Controller Flow
```
User/System
    ↓
Creates Controller Component
    ↓
Sets Parameters (bool/float/trigger)
    ↓
ControllerUpdateSystem
    ↓
Evaluates Transitions
    ↓
Updates Current State
    ↓
Property Accessor (reads/writes)
    ↓
Events Fired
```

## Memory Management

### Component Lifecycle
1. **Creation**: User spawns animation entity
2. **Update**: System updates each frame
3. **Completion**: Animation finishes
4. **Removal**: Auto-removed if `autoRemove: true`

### Auto-Removal Strategy
- **Animation**: Removed when `state === Completed` and `autoRemove === true`
- **Timeline**: Removed when time >= duration and `autoRemove === true`
- **Controller**: Never auto-removed (state machines are persistent)

### Event Cleanup
- Events automatically cleaned up by ECS event system
- Retention window configurable (default 2 frames)
- No manual cleanup required

## Performance Considerations

### Property Access
- Path splitting cached per property
- Direct object property access (no string eval)
- Type checking only at boundaries

### System Updates
- Early exit for non-playing animations
- Batch component queries
- Minimal per-frame allocations

### Event System
- Event readers track last-read sequence
- No duplicate event processing
- Automatic cleanup of old events

## Extension Points

### Custom Easing
```typescript
const myEasing: EasingFunction = (t) => {
  return Math.sin(t * Math.PI);
};

new Animation({ easing: myEasing, ... });
```

### Custom Property Accessor
```typescript
class MyAccessor extends DefaultPropertyAccessor {
  get(target: any, path: string): number | undefined {
    // Custom logic
  }
  set(target: any, path: string, value: number): void {
    // Custom logic
  }
}
```

### Custom Events
```typescript
class MyMarkerEvent {
  constructor(public entity: Entity, public markerName: string) {}
}

app.addEvent(MyMarkerEvent);

new Timeline({
  markers: [{
    time: 1.0,
    name: "boom",
    eventClass: MyMarkerEvent,
  }],
});
```

## Future Enhancements

### Potential Additions
1. **Sprite Animation**: Frame-based sprite animation component
2. **Curve Editor**: Custom animation curves
3. **Animation Blending**: Blend multiple animations
4. **Animation Clips**: Reusable animation templates
5. **Path Following**: Animate along bezier/spline paths
6. **Physics Integration**: Animation with physics simulation
7. **IK (Inverse Kinematics)**: Procedural animation
8. **Animation Retargeting**: Share animations between objects

### Performance Optimizations
1. **SIMD**: Vectorized property updates
2. **Property Caching**: Cache property descriptors
3. **Batch Updates**: Update multiple animations in batch
4. **Worker Threads**: Offload animation calculations

## Testing Strategy

### Unit Tests
- Easing function accuracy
- Property accessor edge cases
- Component state transitions
- Event firing correctness

### Integration Tests
- System execution order
- Component interactions
- Event coordination
- Resource management

### Performance Tests
- Animation throughput (animations/frame)
- Property access speed
- Memory usage over time
- Event system overhead

## Comparison to Unity

### Similarities
- State machine concept (AnimationController)
- Event system for animation lifecycle
- Parameter-driven transitions
- Easing functions

### Differences
- **ECS-Native**: Built for component architecture
- **Property-Based**: Animates any property, not just transforms
- **Imperative API**: AnimationManager for dynamic animations
- **Timeline System**: More flexible than Unity's Timeline
- **Simpler**: Focused on core features, not bloated
- **Type-Safe**: Full TypeScript integration

## Usage Patterns

### Pattern 1: Simple Tween
```typescript
// One-shot property animation
animManager.createAnimation(commands, {
  target: obj,
  property: "x",
  to: 100,
  duration: 1.0,
});
```

### Pattern 2: Complex Sequence
```typescript
// Multi-step animation with events
new Timeline({
  tracks: [...],
  markers: [...],
});
```

### Pattern 3: State Machine
```typescript
// Character animation controller
new AnimationController({
  states: [...],
  transitions: [...],
});
```

### Pattern 4: Reactive Animation
```typescript
// Respond to game events
events.reader(EnemyDefeatedEvent).read().forEach(e => {
  animManager.createAnimation(commands, {
    target: enemy,
    property: "alpha",
    to: 0,
    duration: 0.5,
  });
});
```

## Summary

The animator package provides a robust, ECS-friendly animation system with:
- ✅ Property tweening with easing
- ✅ Timeline sequences
- ✅ State machines
- ✅ Rich event system
- ✅ Type-safe API
- ✅ Performance optimized
- ✅ Extensible design
- ✅ Comprehensive documentation

It follows ECS best practices while providing a familiar API for developers coming from Unity or other engines.
