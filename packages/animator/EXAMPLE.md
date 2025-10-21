# Animator Package Examples

## Example 1: Simple Property Animation

```typescript
import { App } from "@atlas/core";
import { AnimatorPlugin, Animation, Easing, LoopMode } from "@atlas/animator";

// Create a simple object to animate
const player = {
  position: { x: 0, y: 0 },
  health: 100,
  alpha: 1,
};

const app = App.create()
  .addPlugins(new AnimatorPlugin())
  .addStartupSystems(({ commands }) => {
    // Animate player position
    commands.spawn(
      new Animation({
        target: player.position,
        property: "x",
        from: 0,
        to: 100,
        duration: 2.0,
        easing: Easing.easeInOutQuad,
        loopMode: LoopMode.PingPong,
      })
    );

    // Fade out effect
    commands.spawn(
      new Animation({
        target: player,
        property: "alpha",
        from: 1,
        to: 0,
        duration: 1.0,
        delay: 0.5,
        easing: Easing.easeInQuad,
      })
    );
  });

await app.run();
```

## Example 2: Using AnimationManager for Fire-and-Forget Animations

```typescript
import { App } from "@atlas/core";
import {
  AnimatorPlugin,
  AnimationManager,
  Easing,
  AnimationCompletedEvent,
} from "@atlas/animator";

const sprite = { scale: 1, rotation: 0 };

const app = App.create()
  .addPlugins(new AnimatorPlugin())
  .addStartupSystems(({ commands }) => {
    const animManager = commands.getResource(AnimationManager);

    // Create a one-shot scale animation
    animManager.createAnimation(commands, {
      target: sprite,
      property: "scale",
      from: 1,
      to: 2,
      duration: 0.5,
      easing: Easing.easeOutBack,
    });

    // Create multiple animations at once
    animManager.createAnimations(commands, [
      {
        target: sprite,
        property: "rotation",
        to: 360,
        duration: 2.0,
        easing: Easing.linear,
      },
    ]);
  })
  .addUpdateSystems(({ commands, events }) => {
    // Listen for completion events
    const reader = events.reader(AnimationCompletedEvent);
    for (const event of reader.read()) {
      console.log(`Animation completed: ${event.animationId}`);
    }
  });

await app.run();
```

## Example 3: Timeline Sequences with Markers

```typescript
import { App } from "@atlas/core";
import {
  AnimatorPlugin,
  Timeline,
  TimelineMarkerEvent,
  Easing,
  LoopMode,
} from "@atlas/core";

const enemy = {
  position: { x: 0, y: 0 },
  scale: 1,
  alpha: 1,
};

// Custom event for explosion
class ExplosionEvent {
  constructor(
    public entity: number,
    public markerName: string
  ) {}
}

const app = App.create()
  .addPlugins(new AnimatorPlugin())
  .addEvent(ExplosionEvent)
  .addStartupSystems(({ commands }) => {
    // Create a death sequence
    commands.spawn(
      new Timeline({
        tracks: [
          // Shake effect
          {
            target: enemy.position,
            property: "x",
            to: 10,
            duration: 0.1,
            easing: Easing.easeInOutQuad,
          },
          {
            target: enemy.position,
            property: "x",
            from: 10,
            to: 0,
            duration: 0.1,
            delay: 0.1,
            easing: Easing.easeInOutQuad,
          },
          // Scale up then disappear
          {
            target: enemy,
            property: "scale",
            to: 1.5,
            duration: 0.3,
            delay: 0.2,
            easing: Easing.easeOutQuad,
          },
          // Fade out
          {
            target: enemy,
            property: "alpha",
            to: 0,
            duration: 0.2,
            delay: 0.3,
            easing: Easing.easeInQuad,
          },
        ],
        markers: [
          {
            time: 0.25,
            name: "explosion",
            eventClass: ExplosionEvent,
          },
        ],
      })
    );
  })
  .addUpdateSystems(({ events }) => {
    // Handle explosion event
    const explosionReader = events.reader(ExplosionEvent);
    for (const event of explosionReader.read()) {
      console.log("Boom! Explosion at", event.markerName);
      // Spawn particle effects, play sound, etc.
    }

    // Handle timeline markers
    const markerReader = events.reader(TimelineMarkerEvent);
    for (const event of markerReader.read()) {
      console.log(`Timeline marker reached: ${event.markerName} at ${event.time}s`);
    }
  });

await app.run();
```

## Example 4: Animation Controller State Machine

```typescript
import { App } from "@atlas/core";
import {
  AnimatorPlugin,
  AnimationController,
  ControllerStateChangedEvent,
  Easing,
  LoopMode,
} from "@atlas/animator";

const character = {
  position: { x: 0, y: 0 },
  scale: 1,
};

const app = App.create()
  .addPlugins(new AnimatorPlugin())
  .addStartupSystems(({ commands }) => {
    const controller = new AnimationController({
      states: [
        {
          name: "idle",
          animation: {
            target: character,
            property: "scale",
            from: 1,
            to: 1.05,
            duration: 0.5,
            easing: Easing.easeInOutSine,
            loop: LoopMode.PingPong,
          },
          speed: 1.0,
        },
        {
          name: "jump",
          animation: {
            target: character.position,
            property: "y",
            from: 0,
            to: -100,
            duration: 0.4,
            easing: Easing.easeOutQuad,
          },
          speed: 1.0,
        },
        {
          name: "fall",
          animation: {
            target: character.position,
            property: "y",
            from: -100,
            to: 0,
            duration: 0.4,
            easing: Easing.easeInQuad,
          },
          speed: 1.0,
        },
      ],
      transitions: [
        {
          from: "idle",
          to: "jump",
          condition: (params) => params.get("trigger_jump") === true,
          duration: 0.05,
        },
        {
          from: "jump",
          to: "fall",
          condition: (params) => params.get("jump_elapsed") > 0.4,
          duration: 0.05,
        },
        {
          from: "fall",
          to: "idle",
          condition: (params) => params.get("grounded") === true,
          duration: 0.1,
        },
      ],
      initialState: "idle",
    });

    const entity = commands.spawn(controller).id();

    // Store entity for later access
    commands.setResource({ controllerEntity: entity });
  })
  .addUpdateSystems(({ commands, events }) => {
    // Get the controller
    const [entity, controller] = commands.find(AnimationController);

    // Simple jump logic
    const runtime = controller.getCurrentStateRuntime();
    if (runtime) {
      controller.setFloat("jump_elapsed", runtime.elapsed);
    }

    // Simulate grounded check
    if (character.position.y >= 0) {
      controller.setBool("grounded", true);
      character.position.y = 0;
    } else {
      controller.setBool("grounded", false);
    }

    // Trigger jump every 2 seconds (for demo)
    const time = commands.getResource(Time);
    if (Math.floor(time.elapsed) % 2 === 0 && time.elapsed % 1 < 0.016) {
      controller.setTrigger("trigger_jump");
    }

    // Listen for state changes
    const reader = events.reader(ControllerStateChangedEvent);
    for (const event of reader.read()) {
      console.log(`State changed: ${event.fromState} -> ${event.toState}`);
    }
  });

await app.run();
```

## Example 5: Comprehensive UI Animation

```typescript
import { App } from "@atlas/core";
import {
  AnimatorPlugin,
  Timeline,
  Animation,
  AnimationManager,
  Easing,
  LoopMode,
} from "@atlas/animator";

// UI elements
const menuPanel = { x: -300, y: 0, alpha: 0, scale: 0.8 };
const titleText = { y: -50, alpha: 0 };
const button1 = { scale: 0, alpha: 0 };
const button2 = { scale: 0, alpha: 0 };
const button3 = { scale: 0, alpha: 0 };

const app = App.create()
  .addPlugins(new AnimatorPlugin())
  .addStartupSystems(({ commands }) => {
    // Menu slide-in animation
    commands.spawn(
      new Timeline({
        tracks: [
          // Panel slides in
          {
            target: menuPanel,
            property: "x",
            from: -300,
            to: 0,
            duration: 0.5,
            easing: Easing.easeOutQuart,
          },
          {
            target: menuPanel,
            property: "alpha",
            from: 0,
            to: 1,
            duration: 0.3,
            easing: Easing.linear,
          },
          {
            target: menuPanel,
            property: "scale",
            from: 0.8,
            to: 1,
            duration: 0.4,
            easing: Easing.easeOutBack,
          },
          // Title appears
          {
            target: titleText,
            property: "y",
            from: -50,
            to: 0,
            duration: 0.4,
            delay: 0.2,
            easing: Easing.easeOutQuad,
          },
          {
            target: titleText,
            property: "alpha",
            from: 0,
            to: 1,
            duration: 0.3,
            delay: 0.2,
            easing: Easing.linear,
          },
          // Buttons pop in sequentially
          {
            target: button1,
            property: "scale",
            to: 1,
            duration: 0.3,
            delay: 0.4,
            easing: Easing.easeOutBack,
          },
          {
            target: button1,
            property: "alpha",
            to: 1,
            duration: 0.2,
            delay: 0.4,
            easing: Easing.linear,
          },
          {
            target: button2,
            property: "scale",
            to: 1,
            duration: 0.3,
            delay: 0.5,
            easing: Easing.easeOutBack,
          },
          {
            target: button2,
            property: "alpha",
            to: 1,
            duration: 0.2,
            delay: 0.5,
            easing: Easing.linear,
          },
          {
            target: button3,
            property: "scale",
            to: 1,
            duration: 0.3,
            delay: 0.6,
            easing: Easing.easeOutBack,
          },
          {
            target: button3,
            property: "alpha",
            to: 1,
            duration: 0.2,
            delay: 0.6,
            easing: Easing.linear,
          },
        ],
        markers: [
          {
            time: 0.5,
            name: "panel_complete",
          },
          {
            time: 0.9,
            name: "animation_complete",
          },
        ],
      })
    );

    // Add subtle floating animation to title (starts after main animation)
    setTimeout(() => {
      commands.spawn(
        new Animation({
          target: titleText,
          property: "y",
          from: 0,
          to: -5,
          duration: 1.5,
          easing: Easing.easeInOutSine,
          loopMode: LoopMode.PingPong,
        })
      );
    }, 1000);
  });

await app.run();
```

## Example 6: Particle System Animation

```typescript
import { App } from "@atlas/core";
import { AnimatorPlugin, AnimationManager, Easing, LoopMode } from "@atlas/animator";

class Particle {
  x = 0;
  y = 0;
  alpha = 1;
  scale = 1;
}

const app = App.create()
  .addPlugins(new AnimatorPlugin())
  .addUpdateSystems(({ commands }) => {
    const animManager = commands.getResource(AnimationManager);

    // Spawn particles at random intervals
    if (Math.random() < 0.1) {
      const particle = new Particle();
      particle.x = Math.random() * 800;
      particle.y = 600;

      // Animate particle upward
      animManager.createAnimations(commands, [
        {
          target: particle,
          property: "y",
          from: 600,
          to: -100,
          duration: 3.0,
          easing: Easing.linear,
        },
        {
          target: particle,
          property: "alpha",
          from: 1,
          to: 0,
          duration: 3.0,
          easing: Easing.easeInQuad,
        },
        {
          target: particle,
          property: "scale",
          from: 1,
          to: 0.5,
          duration: 3.0,
          easing: Easing.easeOutQuad,
        },
        {
          target: particle,
          property: "x",
          from: particle.x,
          to: particle.x + (Math.random() - 0.5) * 100,
          duration: 3.0,
          easing: Easing.easeInOutSine,
        },
      ]);
    }
  });

await app.run();
```

## Tips

1. **Nested properties**: Use dot notation to animate nested properties: `"transform.position.x"`
2. **Auto-remove**: Set `autoRemove: true` for fire-and-forget animations
3. **Events**: Listen to events for coordinating behavior (e.g., spawn effects when animations complete)
4. **Timelines**: Use timelines for complex sequences with precise timing
5. **Controllers**: Use animation controllers for state machines (idle, walk, jump, etc.)
6. **Performance**: AnimationManager creates entities that auto-remove, preventing buildup
