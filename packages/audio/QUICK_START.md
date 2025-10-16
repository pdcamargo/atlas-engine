# Audio Package - Quick Start

## Two Ways to Play Sounds

### Method 1: Direct AudioClip (Simple)

Play a sound by passing the AudioClip and options:

```typescript
const audioManager = commands.getResource(AudioManager);
const assetServer = commands.getResource(AssetServer);

const clickHandle = assetServer.load<AudioClip>("/sounds/click.mp3");
const clickSound = assetServer.getAsset<AudioClip>(clickHandle);

if (clickSound) {
  audioManager.playSound(clickSound, {
    bus: "ui",
    volume: 0.8,
  });
}
```

### Method 2: AudioSource as Template (Reusable Presets)

Create reusable sound configurations with `AudioSource`:

```typescript
import { AudioSource } from "@atlas/audio";

// Create sound templates/presets
class GameSounds {
  jumpSound: AudioSource;
  shootSound: AudioSource;
  explosionSound: AudioSource;

  constructor(assetServer: AssetServer) {
    // Load and configure each sound
    this.jumpSound = new AudioSource({
      clip: assetServer.load<AudioClip>("/sounds/jump.mp3"),
      bus: "sfx",
      volume: 0.7,
      playing: true, // Autoplay flag - if false, playSound() won't play it
      spatialBlend: 0,
    });

    this.shootSound = new AudioSource({
      clip: assetServer.load<AudioClip>("/sounds/shoot.wav"),
      bus: "sfx",
      volume: 1.0,
      playing: true,
      spatialBlend: 0,
    });

    this.explosionSound = new AudioSource({
      clip: assetServer.load<AudioClip>("/sounds/explosion.wav"),
      bus: "sfx",
      volume: 0.9,
      playing: true,
      position: { x: 0, y: 0 }, // Can be overridden
      spatialBlend: 1.0, // Full spatial audio
    });
  }
}

// In startup:
const gameSounds = new GameSounds(assetServer);
commands.setResource(gameSounds);

// Later, play anytime:
const audioManager = commands.getResource(AudioManager);
const gameSounds = commands.getResource(GameSounds);

// Just pass the AudioSource - it contains all the settings!
audioManager.playSound(gameSounds.jumpSound);
audioManager.playSound(gameSounds.shootSound);
audioManager.playSound(gameSounds.explosionSound);
```

**Benefits of AudioSource templates:**

- ✅ **No duplication** - define sound settings once, reuse everywhere
- ✅ **Type-safe** - all settings in one place
- ✅ **Easy to tweak** - change volume/bus in one spot
- ✅ **Autoplay logic** - `playing: false` prevents sound from playing
- ✅ **No repetitive code** - no need to specify options every time

## Complete Example: Spacebar to Play

```typescript
import { sys, AssetServer } from "@atlas/core";
import { AudioSource, AudioManager } from "@atlas/audio";

// Define your sound presets
class SoundEffects {
  levelUp: AudioSource;

  constructor(assetServer: AssetServer) {
    this.levelUp = new AudioSource({
      clip: assetServer.load<AudioClip>("/level-up.mp3"),
      bus: "sfx",
      volume: 0.8,
      playing: true, // Will play when passed to audioManager.playSound()
      loop: false,
      spatialBlend: 0,
    });
  }
}

// Startup: Create the presets
app.addStartupSystems(
  sys(({ commands }) => {
    const assetServer = commands.getResource(AssetServer);
    const sfx = new SoundEffects(assetServer);
    commands.setResource(sfx);
  })
);

// Setup keyboard listener
app.addStartupSystems(
  sys(({ commands }) => {
    const audioManager = commands.getResource(AudioManager);
    const sfx = commands.getResource(SoundEffects);

    document.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        // Super simple - just play the preset!
        audioManager.playSound(sfx.levelUp);
      }
    });
  })
);
```

## Autoplay Logic

The `playing` flag in AudioSource controls whether the sound will play:

```typescript
// Sound that only plays under certain conditions
const conditionalSound = new AudioSource({
  clip: soundHandle,
  bus: "sfx",
  volume: 1.0,
  playing: playerIsAlive, // Dynamic condition
});

// Later:
audioManager.playSound(conditionalSound);
// ^ Will only play if playing === true

// Or update the flag:
conditionalSound.playing = playerHasAmmo && !isReloading;
audioManager.playSound(conditionalSound); // Respects the flag
```

## When to Use Each Method

### Use Method 1 (Direct AudioClip) when:

- Playing sounds rarely (one-off events)
- Settings change dynamically every time
- Prototyping/testing

### Use Method 2 (AudioSource Template) when:

- Playing the same sound many times
- Sound has specific configuration (volume, bus, etc.)
- Building a game with many sound effects
- Want clean, maintainable code

**Recommendation:** Use Method 2 (AudioSource templates) for production games!
