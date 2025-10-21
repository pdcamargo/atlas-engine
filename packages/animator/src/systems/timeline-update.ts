import { sys, Time } from "@atlas/core";
import { Timeline } from "../components/timeline";
import { AnimationState, LoopMode } from "../types";
import { propertyAccessor } from "../property-accessor";
import {
  TimelineStartedEvent,
  TimelineMarkerEvent,
  TimelineCompletedEvent,
} from "../events";

/**
 * System that updates all Timeline components each frame
 *
 * Responsibilities:
 * - Advances timeline playhead
 * - Updates all active animation tracks
 * - Fires marker events at specified times
 * - Handles timeline looping
 * - Auto-removes completed timelines if configured
 */
export const timelineUpdateSystem = sys(({ commands, events }) => {
  const time = commands.getResource(Time);
  const deltaTime = time.deltaTime;

  // Track timelines that should be removed
  const toRemove: Array<[number, Timeline]> = [];

  // Query all Timeline components
  const timelines = commands.query(Timeline).all();

  for (const [entity, timeline] of timelines) {
    // Skip if not playing
    if (timeline.state !== AnimationState.Playing) {
      continue;
    }

    const previousTime = timeline.time;

    // Update timeline time
    timeline.time += deltaTime * timeline.speed;

    // Check if timeline just started
    if (previousTime === 0 && timeline.time > 0) {
      events.writer(TimelineStartedEvent).send(
        new TimelineStartedEvent(entity)
      );
    }

    // Handle markers between previousTime and current time
    for (let i = 0; i < timeline.markers.length; i++) {
      const marker = timeline.markers[i]!;

      // Check if we crossed this marker
      if (
        previousTime < marker.time &&
        timeline.time >= marker.time &&
        !timeline.firedMarkers.has(i)
      ) {
        timeline.firedMarkers.add(i);

        // Fire marker event
        events.writer(TimelineMarkerEvent).send(
          new TimelineMarkerEvent(entity, marker.name, marker.time)
        );

        // Fire custom event if specified
        if (marker.eventClass) {
          const customEvent = new marker.eventClass(entity, marker.name);
          events.writer(marker.eventClass).send(customEvent);
        }
      }
    }

    // Update animation tracks
    for (const trackState of timeline.trackStates) {
      const track = trackState.track;
      const trackTime = timeline.time;

      // Check if track should start
      if (!trackState.hasStarted && trackTime >= trackState.startTime) {
        trackState.hasStarted = true;

        // Initialize start value if not specified
        if (trackState.startValue === undefined) {
          const currentValue = propertyAccessor.get(track.target, track.property);
          if (currentValue !== undefined) {
            trackState.startValue = currentValue;
          } else {
            trackState.startValue = 0;
          }
        }
      }

      // Skip if track hasn't started yet
      if (!trackState.hasStarted) {
        continue;
      }

      // Skip if track is already completed
      if (trackState.hasCompleted) {
        continue;
      }

      // Calculate track progress
      const trackElapsed = trackTime - trackState.startTime;
      let progress = 0;

      if (track.duration > 0) {
        progress = Math.min(1, trackElapsed / track.duration);
      } else {
        progress = 1;
      }

      // Apply easing if specified
      const easedProgress = track.easing ? track.easing(progress) : progress;

      // Calculate and apply value
      const startValue = trackState.startValue ?? track.from ?? 0;
      const value = startValue + (track.to - startValue) * easedProgress;
      propertyAccessor.set(track.target, track.property, value);

      // Mark track as completed if finished
      if (progress >= 1) {
        trackState.hasCompleted = true;
      }
    }

    // Handle timeline completion/looping
    if (timeline.time >= timeline.duration) {
      switch (timeline.loopMode) {
        case LoopMode.Once:
          timeline.state = AnimationState.Completed;

          // Fire completion event
          events.writer(TimelineCompletedEvent).send(
            new TimelineCompletedEvent(entity)
          );

          // Mark for removal if configured
          if (timeline.autoRemove) {
            toRemove.push([entity, timeline]);
          }
          break;

        case LoopMode.Loop:
          // Loop back to beginning
          timeline.loopCount++;
          timeline.time = timeline.time % timeline.duration;
          timeline.firedMarkers.clear();

          // Reset track states
          for (const trackState of timeline.trackStates) {
            trackState.hasStarted = false;
            trackState.hasCompleted = false;
          }
          break;

        case LoopMode.PingPong:
          // For timelines, ping-pong means playing in reverse
          // This is complex to implement properly, so for now treat as loop
          // TODO: Implement proper ping-pong for timelines
          timeline.loopCount++;
          timeline.time = timeline.time % timeline.duration;
          timeline.firedMarkers.clear();

          for (const trackState of timeline.trackStates) {
            trackState.hasStarted = false;
            trackState.hasCompleted = false;
          }
          break;
      }
    }
  }

  // Remove completed timelines
  for (const [entity, timeline] of toRemove) {
    commands.removeComponent(entity, Timeline);
  }
}).label("Animator::TimelineUpdate");
