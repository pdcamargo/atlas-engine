import { App, EcsPlugin, Events } from "../..";
import { Vector2 } from "../../math";
import { createSet, sys } from "../system_builder";
import { SystemFnArguments, SystemType } from "../types";
import { Viewport, ViewportPlugin } from "./viewport";

export const InputSet = Symbol("InputSet");

export enum KeyCode {
  Space = " ",
  Enter = "Enter",
  Escape = "Escape",
  ArrowUp = "ArrowUp",
  ArrowDown = "ArrowDown",
  ArrowLeft = "ArrowLeft",
  ArrowRight = "ArrowRight",
  KeyA = "KeyA",
  KeyB = "KeyB",
  KeyC = "KeyC",
  KeyD = "KeyD",
  KeyE = "KeyE",
  KeyF = "KeyF",
  KeyG = "KeyG",
  KeyH = "KeyH",
  KeyI = "KeyI",
  KeyJ = "KeyJ",
  KeyK = "KeyK",
  KeyL = "KeyL",
  KeyM = "KeyM",
  KeyN = "KeyN",
  KeyO = "KeyO",
  KeyP = "KeyP",
  KeyQ = "KeyQ",
  KeyR = "KeyR",
  KeyS = "KeyS",
  KeyT = "KeyT",
  KeyU = "KeyU",
  KeyV = "KeyV",
  KeyW = "KeyW",
  KeyX = "KeyX",
  KeyY = "KeyY",
  KeyZ = "KeyZ",
  Digit0 = "Digit0",
  Digit1 = "Digit1",
  Digit2 = "Digit2",
  Digit3 = "Digit3",
  Digit4 = "Digit4",
  Digit5 = "Digit5",
  Digit6 = "Digit6",
  Digit7 = "Digit7",
  Digit8 = "Digit8",
  Digit9 = "Digit9",
  MouseLeft = "MouseLeft",
  MouseMiddle = "MouseMiddle",
  MouseRight = "MouseRight",
}

export class Input {
  #container: HTMLElement;
  #keyStates: Map<string, boolean> = new Map();
  #previousKeyStates: Map<string, boolean> = new Map();
  #mousePosition: Vector2 = new Vector2();
  #events: Events;
  #accumulatedMouseMotion: Vector2 = new Vector2();
  #accumulatedMouseWheel: Vector2 = new Vector2();
  #hasMouseMotion: boolean = false;
  #hasMouseWheel: boolean = false;

  constructor(container: HTMLElement, events: Events) {
    this.#container = container;
    this.#events = events;
    this.#setupEventListeners();
  }

  #setupEventListeners() {
    // Keyboard events
    this.#container.addEventListener("keydown", (event) => {
      this.#keyStates.set(event.code, true);
    });

    this.#container.addEventListener("keyup", (event) => {
      this.#keyStates.set(event.code, false);
    });

    // Mouse events
    this.#container.addEventListener("mousedown", (event) => {
      const buttonCode = this.#getMouseButtonCode(event.button);
      if (buttonCode) {
        this.#keyStates.set(buttonCode, true);
      }
    });

    this.#container.addEventListener("mouseup", (event) => {
      const buttonCode = this.#getMouseButtonCode(event.button);
      if (buttonCode) {
        this.#keyStates.set(buttonCode, false);
      }
    });

    this.#container.addEventListener("mousemove", (event) => {
      this.#mousePosition.set(event.clientX, event.clientY);
      this.#accumulatedMouseMotion.add(
        new Vector2(event.movementX, event.movementY)
      );
      this.#hasMouseMotion = true;
    });

    this.#container.addEventListener("wheel", (event) => {
      this.#accumulatedMouseWheel.add(new Vector2(event.deltaX, event.deltaY));
      this.#hasMouseWheel = true;
    });

    // Ensure the container can receive focus for keyboard events
    if (this.#container instanceof HTMLElement) {
      this.#container.tabIndex = -1;
      this.#container.style.outline = "none";
    }
  }

  #getMouseButtonCode(button: number): string | null {
    switch (button) {
      case 0:
        return KeyCode.MouseLeft;
      case 1:
        return KeyCode.MouseMiddle;
      case 2:
        return KeyCode.MouseRight;
      default:
        return null;
    }
  }

  #updatePreviousStates() {
    this.#previousKeyStates.clear();
    for (const [key, value] of this.#keyStates) {
      this.#previousKeyStates.set(key, value);
    }
  }

  get mousePosition() {
    return this.#mousePosition;
  }

  /**
   * Check if a key was just pressed (down this frame but not the previous frame)
   */
  justPressed(keyCode: KeyCode): boolean {
    const currentState = this.#keyStates.get(keyCode) ?? false;
    const previousState = this.#previousKeyStates.get(keyCode) ?? false;
    return currentState && !previousState;
  }

  /**
   * Check if a key was just released (up this frame but down the previous frame)
   */
  justReleased(keyCode: KeyCode): boolean {
    const currentState = this.#keyStates.get(keyCode) ?? false;
    const previousState = this.#previousKeyStates.get(keyCode) ?? false;
    return !currentState && previousState;
  }

  /**
   * Check if a key is currently being held down
   */
  pressed(keyCode: KeyCode): boolean {
    return this.#keyStates.get(keyCode) ?? false;
  }

  /**
   * Check if any of the provided keys are currently being held down
   */
  anyPressed(...keyCodes: KeyCode[]): boolean {
    return keyCodes.some((keyCode) => this.pressed(keyCode));
  }

  /**
   * Check if any of the provided keys were just pressed this frame
   */
  anyJustPressed(...keyCodes: KeyCode[]): boolean {
    return keyCodes.some((keyCode) => this.justPressed(keyCode));
  }

  /**
   * Update method to be called each frame to track previous states and fire accumulated events
   */
  update() {
    this.#updatePreviousStates();

    // Fire accumulated mouse motion event if there was any motion this frame
    if (this.#hasMouseMotion) {
      this.#events
        .writer(MouseMotionEvent)
        .send(new MouseMotionEvent(this.#accumulatedMouseMotion.clone()));
      this.#accumulatedMouseMotion.set(0, 0);
      this.#hasMouseMotion = false;
    }

    // Fire accumulated mouse wheel event if there was any wheel movement this frame
    if (this.#hasMouseWheel) {
      this.#events
        .writer(MouseWheelEvent)
        .send(new MouseWheelEvent(this.#accumulatedMouseWheel.clone()));
      this.#accumulatedMouseWheel.set(0, 0);
      this.#hasMouseWheel = false;
    }
  }
}

const updateInput = sys(({ commands }: SystemFnArguments) => {
  const input = commands.getResource(Input);
  input.update();
}).label("updateInput");

/**
 * Capture mouse motion event, without caring about the actual position
 */
export class MouseMotionEvent {
  constructor(public delta: Vector2) {}
}

export class MouseWheelEvent {
  constructor(public delta: Vector2) {}
}

export class InputPlugin implements EcsPlugin {
  constructor() {}

  public async build(app: App) {
    app.addEvent(MouseMotionEvent);
    app.addEvent(MouseWheelEvent);

    const viewport = app.getResource(Viewport);

    app.setResource(new Input(viewport.container, app.events));

    app.addSystems(SystemType.PostRender, createSet(InputSet, updateInput));
  }

  public ready(app: App): boolean | Promise<boolean> {
    return app.hasResource(Viewport) && app.hasResource(Input);
  }

  public dependsOn() {
    return [ViewportPlugin];
  }
}
