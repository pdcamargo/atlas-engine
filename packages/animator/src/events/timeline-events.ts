import type { Entity } from "@atlas/core";

/**
 * Event fired when a timeline marker is reached
 */
export class TimelineMarkerEvent {
  constructor(
    public readonly entity: Entity,
    public readonly markerName: string,
    public readonly time: number
  ) {}
}

/**
 * Event fired when a timeline trigger is activated
 */
export class TimelineTriggerEvent {
  constructor(
    public readonly entity: Entity,
    public readonly triggerName: string
  ) {}
}

/**
 * Event fired when a timeline completes
 */
export class TimelineCompletedEvent {
  constructor(public readonly entity: Entity) {}
}

/**
 * Event fired when a timeline starts
 */
export class TimelineStartedEvent {
  constructor(public readonly entity: Entity) {}
}
