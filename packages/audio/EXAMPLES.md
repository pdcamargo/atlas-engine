# Audio Examples

## Two Ways to Play Audio

**AudioManager (One-Shot Sounds)** - No entities created, perfect for:

- UI sounds (clicks, hover effects)
- Gunshots, explosions
- Footsteps, impacts
- Any fire-and-forget sound effect

**AudioSource Components** - Entity-based, perfect for:

- Background music
- Ambient loops attached to locations
- Sounds that move with entities
- Sounds you need to control (pause, resume, volume changes)

## Playing One-Shot Sounds (Recommended for Most SFX)

Here's how to play sound effects without creating entities:

```typescript
import { sys, AssetServer, Handle } from "@atlas/core";
import { AudioClip, AudioSource, AudioBusManager } from "@atlas/audio";

// Resource to store our loaded sound effect handles
class SoundEffects {
  jump?: Handle<AudioClip>;
  shoot?: Handle<AudioClip>;
  powerup?: Handle<AudioClip>;
}

// Startup system to load all sound effects
const loadSoundEffects = sys(({ commands }) => {
  const assetServer = commands.getResource(AssetServer);
  const soundEffects = new SoundEffects();

  // Load all your sound effects
  soundEffects.jump = assetServer.load<AudioClip>("/sounds/jump.mp3");
  soundEffects.shoot = assetServer.load<AudioClip>("/sounds/shoot.wav");
  soundEffects.powerup = assetServer.load<AudioClip>("/sounds/powerup.mp3");

  // Store in resources for easy access
  commands.setResource(soundEffects);
}).label("LoadSoundEffects");

// Update system to handle keyboard input and play sounds
const handleSoundEffects = sys(({ commands }) => {
  const soundEffects = commands.tryGetResource(SoundEffects);
  if (!soundEffects) return;

  // Listen for keyboard events
  const handleKeyPress = (event: KeyboardEvent) => {
    switch (event.code) {
      case "Space":
        // Play jump sound
        if (soundEffects.jump) {
          commands.spawn(
            new AudioSource({
              clip: soundEffects.jump,
              bus: "sfx",
              playing: true,
              loop: false,
              volume: 0.8,
              spatialBlend: 0, // 2D sound (no spatialization)
            })
          );
        }
        break;

      case "KeyF":
        // Play shoot sound
        if (soundEffects.shoot) {
          commands.spawn(
            new AudioSource({
              clip: soundEffects.shoot,
              bus: "sfx",
              playing: true,
              loop: false,
              volume: 1.0,
              spatialBlend: 0,
            })
          );
        }
        break;

      case "KeyP":
        // Play powerup sound
        if (soundEffects.powerup) {
          commands.spawn(
            new AudioSource({
              clip: soundEffects.powerup,
              bus: "sfx",
              playing: true,
              loop: false,
              volume: 0.9,
              spatialBlend: 0,
            })
          );
        }
        break;
    }
  };

  // Add event listener if not already added
  if (!(window as any).__audioKeyListenerAdded) {
    document.addEventListener("keydown", handleKeyPress);
    (window as any).__audioKeyListenerAdded = true;
  }
}).label("HandleSoundEffects");

// Add to your app
app.addStartupSystems(loadSoundEffects).addUpdateSystems(handleSoundEffects);
```

## Simple Example: Just Press Space to Play

The simplest possible example:

```typescript
import { sys, AssetServer } from "@atlas/core";
import { AudioClip, AudioManager } from "@atlas/audio";

// In your game startup
.addStartupSystems(({ commands }) => {
  const assetServer = commands.getResource(AssetServer);

  // Load sound and store the handle
  const jumpSoundHandle = assetServer.load<AudioClip>("/sounds/jump.mp3");

  // Set up spacebar listener
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      // Get the loaded asset
      const jumpSound = assetServer.getAsset<AudioClip>(jumpSoundHandle);
      if (jumpSound) {
        // Play it! No entity created.
        const audioManager = commands.getResource(AudioManager);
        audioManager.playSound(jumpSound, { bus: "sfx", volume: 0.8 });
      }
    }
  });
})
```

**Key advantages:**

- ✅ No entities created (can play 1000s of sounds)
- ✅ Automatic cleanup when sound finishes
- ✅ Much more efficient
- ✅ Simple API

## Playing Spatial Audio (One-Shot)

For positional audio that changes based on player location:

```typescript
const playSpatialSound = sys(({ commands }) => {
  const assetServer = commands.getResource(AssetServer);
  const audioManager = commands.getResource(AudioManager);

  // Get loaded sound
  const explosionHandle = assetServer.load<AudioClip>("/sounds/explosion.wav");
  const explosion = assetServer.getAsset<AudioClip>(explosionHandle);

  if (explosion) {
    // Play sound at a specific world position
    const enemyPosition = { x: 200, y: 150 };
    const playerPosition = { x: 0, y: 0 }; // Your actual player position

    audioManager.playSound(explosion, {
      bus: "sfx",
      volume: 1.0,
      position: enemyPosition,
      listenerPosition: playerPosition,
      spatialBlend: 1.0, // Full spatial audio
    });
  }
});
```

## When to Use AudioSource Components vs AudioManager

### Use AudioManager.playSound() for:

- ❌ **UI sounds** - button clicks, hovers
- ❌ **Gunshots, explosions** - instant effects
- ❌ **Footsteps, jumps** - player actions
- ❌ **Any one-shot sound effect**

### Use AudioSource Components for:

- ✅ **Background music** - needs pause/resume control
- ✅ **Looping ambient sounds** - campfire, waterfall
- ✅ **Sounds attached to moving entities** - car engine sound that follows the car
- ✅ **Sounds you need to control** - fade in/out, dynamic volume changes

```typescript
// ❌ DON'T DO THIS for one-shot sounds:
commands.spawn(
  new AudioSource({
    clip: buttonClickSound,
    playing: true,
    loop: false,
  })
); // Creates unnecessary entity!

// ✅ DO THIS instead:
audioManager.playSound(buttonClickSound, {
  bus: "ui",
  volume: 0.8,
}); // No entity, auto-cleanup

// ✅ DO USE AudioSource for persistent audio:
commands.spawn(
  new AudioSource({
    clip: musicHandle,
    playing: true,
    loop: true, // Loops forever
    volume: 0.6,
    bus: "music",
  })
); // Entity makes sense here - you'll control it

// ✅ DO USE AudioSource for positional audio on entities:
const carEntity = commands.spawn(
  carSprite,
  new Transform({ position: { x: 0, y: 0 } }),
  new AudioSource({
    clip: engineSoundHandle,
    playing: true,
    loop: true,
    volume: 0.8,
    position: { x: 0, y: 0 }, // Updated by a system each frame
    spatialBlend: 1.0,
  })
); // Entity makes sense - sound follows the car
```

## Cleaning Up Finished Sounds

Add this system to automatically remove entities with finished audio sources:

```typescript
import { sys, Entity } from "@atlas/core";
import { AudioSource } from "@atlas/audio";

const cleanupFinishedAudio = sys(({ commands }) => {
  const sources = commands.query(AudioSource).all();
  const toRemove: Entity[] = [];

  for (const [entity, source] of sources) {
    // If audio is finished and not looping, mark for removal
    if (source.finished && !source.loop) {
      toRemove.push(entity);
    }
  }

  // Remove finished audio entities
  for (const entity of toRemove) {
    commands.removeComponent(entity, AudioSource);
    // Or despawn the entire entity if it only had audio
  }
}).label("CleanupFinishedAudio");

app.addUpdateSystems(cleanupFinishedAudio);
```

## Audio Bus Management

```typescript
const setupAudioBuses = sys(({ commands }) => {
  const busManager = commands.getResource(AudioBusManager);

  // Create organized buses
  busManager.createBus("sfx", "master");
  busManager.createBus("music", "master");
  busManager.createBus("ambient", "master");
  busManager.createBus("ui", "master");

  // Set initial volumes
  busManager.setBusVolume("sfx", 0.8);
  busManager.setBusVolume("music", 0.5);
  busManager.setBusVolume("ambient", 0.3);
  busManager.setBusVolume("ui", 1.0);
  busManager.setBusVolume("master", 0.7);
}).label("SetupAudioBuses");

// Later, in settings menu:
const updateAudioSettings = sys(({ commands }) => {
  const busManager = commands.getResource(AudioBusManager);

  // User adjusted master volume slider to 50%
  busManager.setBusVolume("master", 0.5);

  // All buses will be affected (sfx, music, ambient, ui)
});
```
