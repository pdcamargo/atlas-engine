import type { Entity } from "@atlas/core";

/**
 * Event fired when an animation controller changes state
 */
export class ControllerStateChangedEvent {
  constructor(
    public readonly entity: Entity,
    public readonly fromState: string,
    public readonly toState: string
  ) {}
}

/**
 * Event fired when a controller parameter is updated
 */
export class ControllerParameterChangedEvent {
  constructor(
    public readonly entity: Entity,
    public readonly parameterName: string,
    public readonly value: any
  ) {}
}
