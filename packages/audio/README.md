# @atlas/audio

WebAudio-based audio package for the Atlas game engine.

## Features

- **Asset Loading**: Load audio files (mp3, wav, ogg, m4a) through the existing asset system
- **Spatial Audio**: 2D positional audio with distance attenuation and stereo panning
- **Audio Bus System**: Hierarchical bus system for organized volume control
- **ECS Integration**: Components and systems for seamless integration with the engine

## Installation

Add the audio plugin to your app:

```typescript
import { App } from "@atlas/core";
import { AudioPlugin } from "@atlas/audio";

const app = App.create()
  .addPlugins(new AudioPlugin())
  // ... rest of your setup
  .run();
```

## Two Ways to Play Audio

The audio package provides two approaches depending on your needs:

### 1. AudioManager - One-Shot Sounds (Recommended for Most SFX)

Use `AudioManager.playSound()` for fire-and-forget sound effects. **No entities created**, perfect for:

- UI sounds (clicks, hovers)
- Gunshots, explosions, impacts
- Footsteps, jumps
- Any sound that plays once and you don't need to control

```typescript
import { sys, AssetServer } from "@atlas/core";
import { AudioClip, AudioManager } from "@atlas/audio";

const playButtonClick = sys(({ commands }) => {
  const assetServer = commands.getResource(AssetServer);
  const audioManager = commands.getResource(AudioManager);

  const clickHandle = assetServer.load<AudioClip>("/sounds/click.mp3");
  const clickSound = assetServer.getAsset<AudioClip>(clickHandle);

  if (clickSound) {
    // No entity created! Sound auto-cleans up when finished
    audioManager.playSound(clickSound, {
      bus: "ui",
      volume: 0.8,
    });
  }
});
```

**Key advantages:**

- ✅ Can play 1000s of sounds without creating entities
- ✅ Automatic cleanup when sound finishes
- ✅ Much more efficient than entity-based approach
- ✅ Simple, intuitive API

### 2. AudioSource Components - Persistent Audio

Use `AudioSource` components for audio that needs control or follows entities:

- Background music (pause/resume)
- Looping ambient sounds (campfire, waterfall)
- Sounds attached to moving entities (car engine)
- Any audio you need to dynamically control

```typescript
// Background music that loops
commands.spawn(
  new AudioSource({
    clip: musicHandle,
    playing: true,
    loop: true,
    volume: 0.6,
    bus: "music",
  })
);
```

## Usage

### Creating Audio Buses

The plugin creates a default "master" bus. You can create additional buses for organizing your audio:

```typescript
import { sys } from "@atlas/core";
import { AudioBusManager } from "@atlas/audio";

const setupAudio = sys(({ commands }) => {
  const busManager = commands.getResource(AudioBusManager);

  // Create buses with the master bus as parent
  busManager.createBus("sfx", "master");
  busManager.createBus("music", "master");
  busManager.createBus("ui", "master");

  // Set volumes (0-1 range)
  busManager.setBusVolume("sfx", 0.7);
  busManager.setBusVolume("music", 0.5);
  busManager.setBusVolume("master", 0.8);
});
```

### Playing One-Shot Sounds

```typescript
import { sys, AssetServer } from "@atlas/core";
import { AudioClip, AudioManager } from "@atlas/audio";

const playShootSound = sys(({ commands }) => {
  const assetServer = commands.getResource(AssetServer);
  const audioManager = commands.getResource(AudioManager);

  // Load audio clip
  const clipHandle = assetServer.load<AudioClip>("sounds/shoot.mp3");
  const shootSound = assetServer.getAsset<AudioClip>(clipHandle);

  if (shootSound) {
    // Play one-shot sound - no entity created!
    audioManager.playSound(shootSound, {
      bus: "sfx",
      volume: 1.0,
      // Optional: spatial audio
      position: { x: 100, y: 50 },
      listenerPosition: { x: 0, y: 0 },
      spatialBlend: 1.0, // 0 = no spatialization, 1 = full spatial
    });
  }
});
```

### Spatial Audio Setup

For spatial audio to work, you need an `AudioListener` component (typically on your camera or player):

```typescript
import { AudioListener } from "@atlas/audio";

// In a system, add listener to your camera/player entity
commands.spawn(
  new AudioListener({
    position: { x: 0, y: 0 },
  })
  // ... other components can be added as additional parameters
);
```

### AudioSource Component Options

- `clip`: Handle to the AudioClip asset to play
- `bus`: Name of the bus to route audio through (default: "master")
- `playing`: Whether the audio is currently playing
- `loop`: Whether to loop the audio
- `volume`: Source-specific volume (0-1)
- `position`: 2D position for spatial audio
- `spatialBlend`: Blend between 2D and spatial audio (0-1)
  - 0 = Pure 2D audio (no spatialization)
  - 1 = Full spatial audio (affected by distance and position)

## Audio Bus Hierarchy

Buses are organized hierarchically, where child bus volumes are multiplied by their parent's volume:

```
master (0.8)
├── sfx (0.7) → effective volume: 0.56
├── music (0.5) → effective volume: 0.4
└── ui (1.0) → effective volume: 0.8
```

This allows you to control categories of audio independently while still being able to adjust the overall volume.

## Browser Autoplay Policy

Modern browsers require user interaction before playing audio. The `AudioPlugin` automatically handles this by setting up listeners for user interactions (click, keydown, touchstart) that resume the AudioContext on first interaction. The audio playback system will wait until the context is running before attempting to play sounds.

## API Reference

### Components

- **`AudioSource`**: Component for playing audio on an entity
- **`AudioListener`**: Component representing the "ears" in the scene

### Resources

- **`AudioContextResource`**: Wraps the WebAudio AudioContext
- **`AudioBusManager`**: Manages the hierarchy of audio buses
- **`AudioManager`**: Plays one-shot sounds without creating entities (recommended for most SFX)

### Assets

- **`AudioClip`**: Wraps an AudioBuffer with decoded audio data

## Example: Background Music

```typescript
import { sys } from "@atlas/core";

const setupBackgroundMusic = sys(({ commands }) => {
  const assetServer = commands.getResource(AssetServer);
  const musicHandle = assetServer.load<AudioClip>("music/background.mp3");

  commands.spawn(
    new AudioSource({
      clip: musicHandle,
      bus: "music",
      playing: true,
      loop: true,
      volume: 1.0,
      spatialBlend: 0, // No spatialization for background music
    })
  );
});
```

## Example: Spatial Sound Effect

```typescript
import { sys } from "@atlas/core";

// This would be called from within a system when you need to play a footstep
function playFootstep(commands: Commands, x: number, y: number) {
  const assetServer = commands.getResource(AssetServer);
  const footstepHandle = assetServer.load<AudioClip>("sounds/footstep.wav");

  commands.spawn(
    new AudioSource({
      clip: footstepHandle,
      bus: "sfx",
      playing: true,
      loop: false,
      volume: 0.8,
      position: { x, y },
      spatialBlend: 1.0, // Full spatial audio
    })
  );
}
```
