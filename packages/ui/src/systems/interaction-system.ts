import type { Entity, SystemFnArguments } from "@atlas/core";
import {
  UiNode,
  Interactive,
  OnClick,
  OnHoverEnter,
  OnHoverExit,
  OnFocus,
  OnBlur,
  Disabled,
  Hovered,
  Focused,
} from "../components";

/**
 * Tracks which entities have event listeners attached
 */
class InteractionState {
  public listenersAttached = new Set<Entity>();
}

/**
 * System that handles DOM event listeners and fires ECS events.
 * It reads OnClick, OnHoverEnter, OnHoverExit, OnFocus, OnBlur components
 * and fires the specified event classes when interactions occur.
 */
export function interactionSystem({ commands, events }: SystemFnArguments) {
  let state = commands.tryGetResource(InteractionState);

  if (!state) {
    state = new InteractionState();
    commands.setResource(state);
  }

  // Attach event listeners to interactive elements
  for (const [entity, uiNode, interactive] of commands.all(
    UiNode,
    Interactive
  )) {
    if (!uiNode.element || state.listenersAttached.has(entity)) continue;

    const disabled = commands.tryGetComponent(entity, Disabled);
    if (disabled?.value) continue;

    // Check if entity has OnClick component
    const onClick = commands.tryGetComponent(entity, OnClick);
    if (onClick) {
      uiNode.element.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const disabled = commands.tryGetComponent(entity, Disabled);
        if (disabled?.value) return;

        // Fire the event specified in OnClick component
        const writer = events.writer(onClick.eventClass as any);
        writer.send(new onClick.eventClass(entity, onClick.data));
      });
    }

    // Check if entity has OnHoverEnter component
    const onHoverEnter = commands.tryGetComponent(entity, OnHoverEnter);
    if (onHoverEnter) {
      uiNode.element.addEventListener("mouseenter", (e) => {
        const disabled = commands.tryGetComponent(entity, Disabled);
        if (disabled?.value) return;

        // Add Hovered component
        if (!commands.hasComponent(entity, Hovered)) {
          commands.addComponent(entity, new Hovered());
        }

        // Fire the event specified in OnHoverEnter component
        const writer = events.writer(onHoverEnter.eventClass);
        writer.send(new onHoverEnter.eventClass(entity, onHoverEnter.data));
      });
    }

    // Check if entity has OnHoverExit component
    const onHoverExit = commands.tryGetComponent(entity, OnHoverExit);
    if (onHoverExit) {
      uiNode.element.addEventListener("mouseleave", (e) => {
        const disabled = commands.tryGetComponent(entity, Disabled);
        if (disabled?.value) return;

        // Remove Hovered component
        if (commands.hasComponent(entity, Hovered)) {
          commands.removeComponent(entity, Hovered);
        }

        // Fire the event specified in OnHoverExit component
        const writer = events.writer(onHoverExit.eventClass);
        writer.send(new onHoverExit.eventClass(entity, onHoverExit.data));
      });
    }

    // Check if entity has OnFocus component
    const onFocus = commands.tryGetComponent(entity, OnFocus);
    if (onFocus) {
      uiNode.element.addEventListener("focus", (e) => {
        const disabled = commands.tryGetComponent(entity, Disabled);
        if (disabled?.value) return;

        // Add Focused component
        if (!commands.hasComponent(entity, Focused)) {
          commands.addComponent(entity, new Focused());
        }

        // Fire the event specified in OnFocus component
        const writer = events.writer(onFocus.eventClass);
        writer.send(new onFocus.eventClass(entity, onFocus.data));
      });
    }

    // Check if entity has OnBlur component
    const onBlur = commands.tryGetComponent(entity, OnBlur);
    if (onBlur) {
      uiNode.element.addEventListener("blur", (e) => {
        const disabled = commands.tryGetComponent(entity, Disabled);
        if (disabled?.value) return;

        // Remove Focused component
        if (commands.hasComponent(entity, Focused)) {
          commands.removeComponent(entity, Focused);
        }

        // Fire the event specified in OnBlur component
        const writer = events.writer(onBlur.eventClass);
        writer.send(new onBlur.eventClass(entity, onBlur.data));
      });
    }

    state.listenersAttached.add(entity);
  }
}
