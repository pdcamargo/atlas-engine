/**
 * Represents a single audio bus in the hierarchy
 */
interface AudioBus {
  name: string;
  volume: number;
  gainNode: GainNode;
  parent?: string;
}

/**
 * AudioBusManager manages a hierarchy of audio buses
 *
 * Buses allow grouping audio sources and controlling their volume collectively.
 * Each bus can have a parent bus, creating a hierarchy where volume changes
 * propagate down the tree.
 *
 * Example hierarchy:
 * - master (volume 0.8)
 *   - sfx (volume 0.7) → effective volume: 0.56
 *   - music (volume 0.5) → effective volume: 0.4
 */
export class AudioBusManager {
  private buses: Map<string, AudioBus> = new Map();
  private readonly destination: AudioDestinationNode;

  constructor(audioContext: AudioContext) {
    this.destination = audioContext.destination;

    // Create the master bus that connects to the audio destination
    const masterGain = audioContext.createGain();
    masterGain.connect(this.destination);

    this.buses.set("master", {
      name: "master",
      volume: 1.0,
      gainNode: masterGain,
      parent: undefined,
    });
  }

  /**
   * Create a new audio bus
   * @param name Unique name for the bus
   * @param parent Parent bus name (defaults to "master")
   */
  createBus(name: string, parent: string = "master"): void {
    if (this.buses.has(name)) {
      console.warn(`Bus "${name}" already exists`);
      return;
    }

    const parentBus = this.buses.get(parent);
    if (!parentBus) {
      throw new Error(`Parent bus "${parent}" does not exist`);
    }

    const gainNode = parentBus.gainNode.context.createGain();
    gainNode.connect(parentBus.gainNode);

    this.buses.set(name, {
      name,
      volume: 1.0,
      gainNode,
      parent,
    });
  }

  /**
   * Set the volume for a specific bus
   * @param name Bus name
   * @param volume Volume level (0-1)
   */
  setBusVolume(name: string, volume: number): void {
    const bus = this.buses.get(name);
    if (!bus) {
      throw new Error(`Bus "${name}" does not exist`);
    }

    // Clamp volume to valid range
    bus.volume = Math.max(0, Math.min(1, volume));
    bus.gainNode.gain.value = bus.volume;
  }

  /**
   * Get the volume for a specific bus (not including parent volumes)
   * @param name Bus name
   * @returns Volume level (0-1)
   */
  getBusVolume(name: string): number {
    const bus = this.buses.get(name);
    if (!bus) {
      throw new Error(`Bus "${name}" does not exist`);
    }
    return bus.volume;
  }

  /**
   * Get the effective volume for a bus (including all parent volumes)
   * @param name Bus name
   * @returns Effective volume level (0-1)
   */
  getEffectiveBusVolume(name: string): number {
    const bus = this.buses.get(name);
    if (!bus) {
      throw new Error(`Bus "${name}" does not exist`);
    }

    let effectiveVolume = bus.volume;
    let currentBus = bus;

    // Traverse up the hierarchy multiplying volumes
    while (currentBus.parent) {
      const parentBus = this.buses.get(currentBus.parent);
      if (!parentBus) break;
      effectiveVolume *= parentBus.volume;
      currentBus = parentBus;
    }

    return effectiveVolume;
  }

  /**
   * Get the gain node for a specific bus
   * @param name Bus name
   * @returns GainNode for connecting audio sources
   */
  getBusGainNode(name: string): GainNode | undefined {
    return this.buses.get(name)?.gainNode;
  }

  /**
   * Check if a bus exists
   * @param name Bus name
   */
  hasBus(name: string): boolean {
    return this.buses.has(name);
  }

  /**
   * Remove a bus (does not remove master bus)
   * @param name Bus name
   */
  removeBus(name: string): void {
    if (name === "master") {
      console.warn("Cannot remove master bus");
      return;
    }

    const bus = this.buses.get(name);
    if (!bus) {
      return;
    }

    // Disconnect the gain node
    bus.gainNode.disconnect();
    this.buses.delete(name);
  }

  /**
   * Get all bus names
   */
  getBusNames(): string[] {
    return Array.from(this.buses.keys());
  }
}
