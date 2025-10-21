import type { ControllerState, ControllerTransition } from "../types";
import { AnimationState } from "../types";

/**
 * Internal state runtime information
 */
interface StateRuntime {
  state: ControllerState;
  elapsed: number;
  hasStarted: boolean;
  startValue?: number;
}

/**
 * AnimationController component - Unity-like animator controller
 *
 * Provides a state machine for managing complex animation behaviors:
 * - Multiple animation states
 * - Conditional transitions between states
 * - Parameters (bools, floats, triggers) for controlling behavior
 * - Blending support between states
 */
export class AnimationController {
  /** All animation states */
  public states: Map<string, ControllerState>;

  /** All transitions */
  public transitions: ControllerTransition[];

  /** Current active state name */
  public currentState: string;

  /** Parameters used for transition conditions */
  public parameters: Map<string, any>;

  /** Speed multiplier */
  public speed: number;

  /** Whether the controller is active */
  public active: boolean;

  /** @internal Runtime state information */
  public stateRuntime: Map<string, StateRuntime>;

  /** @internal Next state to transition to (if transitioning) */
  public nextState: string | null;

  /** @internal Transition progress (0-1) */
  public transitionProgress: number;

  /** @internal Transition duration */
  public transitionDuration: number;

  constructor(options: {
    states: ControllerState[];
    transitions: ControllerTransition[];
    initialState: string;
    speed?: number;
  }) {
    this.states = new Map();
    for (const state of options.states) {
      this.states.set(state.name, state);
    }

    this.transitions = options.transitions;
    this.currentState = options.initialState;
    this.parameters = new Map();
    this.speed = options.speed ?? 1.0;
    this.active = true;

    // Initialize runtime state
    this.stateRuntime = new Map();
    for (const state of options.states) {
      this.stateRuntime.set(state.name, {
        state,
        elapsed: 0,
        hasStarted: false,
      });
    }

    this.nextState = null;
    this.transitionProgress = 0;
    this.transitionDuration = 0;
  }

  /**
   * Set a boolean parameter
   */
  public setBool(name: string, value: boolean): void {
    this.parameters.set(name, value);
  }

  /**
   * Get a boolean parameter
   */
  public getBool(name: string): boolean {
    return this.parameters.get(name) ?? false;
  }

  /**
   * Set a float parameter
   */
  public setFloat(name: string, value: number): void {
    this.parameters.set(name, value);
  }

  /**
   * Get a float parameter
   */
  public getFloat(name: string): number {
    return this.parameters.get(name) ?? 0;
  }

  /**
   * Set a trigger parameter (will be auto-reset after being consumed)
   */
  public setTrigger(name: string): void {
    this.parameters.set(name, true);
  }

  /**
   * Reset a trigger parameter
   */
  public resetTrigger(name: string): void {
    this.parameters.set(name, false);
  }

  /**
   * Get a trigger parameter
   */
  public getTrigger(name: string): boolean {
    return this.parameters.get(name) ?? false;
  }

  /**
   * Get the current state
   */
  public getCurrentState(): ControllerState | undefined {
    return this.states.get(this.currentState);
  }

  /**
   * Get the current state runtime
   */
  public getCurrentStateRuntime(): StateRuntime | undefined {
    return this.stateRuntime.get(this.currentState);
  }

  /**
   * Check if currently transitioning
   */
  public isTransitioning(): boolean {
    return this.nextState !== null;
  }

  /**
   * Force a transition to a specific state
   */
  public transitionTo(stateName: string, duration: number = 0): void {
    if (!this.states.has(stateName)) {
      console.warn(
        `[AnimationController] State '${stateName}' does not exist`
      );
      return;
    }

    this.nextState = stateName;
    this.transitionProgress = 0;
    this.transitionDuration = duration;
  }
}
