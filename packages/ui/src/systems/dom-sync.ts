import type { Commands } from "@atlas/core";
import { Parent, Children } from "@atlas/core";
import {
  UiNode,
  UiElement,
  UiRoot,
  UiClass,
  UiStyle,
  Text,
  Disabled,
} from "../components";

/**
 * Global UI root wrapper element
 * This wraps all UI elements and prevents click-through to canvas/other elements
 */
class UiRootWrapper {
  public element: HTMLElement | null = null;
  public initialized = false;
}

/**
 * System that synchronizes ECS UI entities with the DOM.
 * - Creates DOM elements for new UI entities
 * - Updates text content
 * - Manages parent-child relationships in the DOM
 * - Handles element cleanup when entities are destroyed
 */
export function domSyncSystem({ commands }: { commands: Commands }) {
  // Ensure the global UI root wrapper exists
  let wrapper = commands.tryGetResource(UiRootWrapper);
  if (!wrapper) {
    wrapper = new UiRootWrapper();
    commands.setResource(wrapper);
  }

  if (!wrapper.initialized) {
    // Create the wrapper div
    wrapper.element = document.createElement("div");
    wrapper.element.id = "atlas-ui-root";

    // Style the wrapper
    const style = wrapper.element.style;
    style.position = "absolute";
    style.top = "0";
    style.left = "0";
    style.right = "0";
    style.bottom = "0";
    style.zIndex = "999";
    style.pointerEvents = "none";
    style.boxSizing = "border-box";

    // Inject global styles for all UI elements
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      #atlas-ui-root * {
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(styleSheet);

    // Append to body
    document.body.appendChild(wrapper.element);
    wrapper.initialized = true;
  }

  // Mount root elements to the wrapper
  for (const [entity, uiNode, uiElement, uiRoot] of commands.all(
    UiNode,
    UiElement,
    UiRoot
  )) {
    if (!uiNode.mounted && !uiNode.element) {
      // Create the element
      uiNode.element = document.createElement(uiElement.tag);

      // Enable pointer events on this element
      uiNode.element.style.pointerEvents = "auto";

      // Mount to the global wrapper
      if (wrapper.element) {
        wrapper.element.appendChild(uiNode.element);
        uiNode.mounted = true;
      }
    }
  }

  // Create elements for non-root UI nodes
  for (const [entity, uiNode, uiElement] of commands.all(UiNode, UiElement)) {
    if (!uiNode.element) {
      uiNode.element = document.createElement(uiElement.tag);
      // Enable pointer events on all UI elements
      uiNode.element.style.pointerEvents = "auto";
    }
  }

  // Update text content
  for (const [entity, uiNode, text] of commands.all(UiNode, Text)) {
    if (uiNode.element) {
      if (uiNode.element.textContent !== text.content) {
        uiNode.element.textContent = text.content;
      }
    }
  }

  // Update CSS classes
  for (const [entity, uiNode, uiClass] of commands.all(UiNode, UiClass)) {
    if (uiNode.element) {
      const currentClasses = Array.from(uiNode.element.classList);
      const targetClasses = uiClass.toArray();

      // Remove classes that shouldn't be there
      for (const cls of currentClasses) {
        if (!targetClasses.includes(cls)) {
          uiNode.element.classList.remove(cls);
        }
      }

      // Add missing classes
      for (const cls of targetClasses) {
        if (!currentClasses.includes(cls)) {
          uiNode.element.classList.add(cls);
        }
      }
    }
  }

  // Update inline styles
  for (const [entity, uiNode, uiStyle] of commands.all(UiNode, UiStyle)) {
    if (uiNode.element) {
      // Apply all styles from the component
      for (const [prop, value] of Object.entries(uiStyle.styles)) {
        if ((uiNode.element.style as any)[prop] !== value) {
          (uiNode.element.style as any)[prop] = value;
        }
      }
    }
  }

  // Update disabled state
  for (const [entity, uiNode, disabled] of commands.all(UiNode, Disabled)) {
    if (uiNode.element) {
      const shouldBeDisabled = disabled.value;
      const isDisabled = (uiNode.element as any).disabled;

      if (shouldBeDisabled !== isDisabled) {
        (uiNode.element as any).disabled = shouldBeDisabled;
      }
    }
  }

  // Sync DOM hierarchy based on Parent/Children components
  for (const [entity, uiNode, children] of commands.all(UiNode, Children)) {
    if (!uiNode.element) continue;

    // Get child UiNodes
    const childNodes: HTMLElement[] = [];
    for (const childId of children.childrenIds) {
      const childUiNode = commands.tryGetComponent(childId, UiNode);
      if (childUiNode?.element) {
        childNodes.push(childUiNode.element);
      }
    }

    // Ensure all children are in the right order and attached
    for (let i = 0; i < childNodes.length; i++) {
      const childElement = childNodes[i]!;

      // Check if child is already in the right position
      if (uiNode.element.children[i] !== childElement) {
        // Remove from current parent if it has one
        if (childElement.parentElement) {
          childElement.parentElement.removeChild(childElement);
        }

        // Insert at the correct position
        if (i < uiNode.element.children.length) {
          uiNode.element.insertBefore(
            childElement,
            uiNode.element.children[i]!
          );
        } else {
          uiNode.element.appendChild(childElement);
        }
      }
    }

    // Remove any extra DOM children that aren't in the ECS children list
    while (uiNode.element.children.length > childNodes.length) {
      const extraChild =
        uiNode.element.children[childNodes.length] as HTMLElement;
      uiNode.element.removeChild(extraChild);
    }
  }

  // Handle orphaned nodes that have a Parent but no DOM parent
  for (const [entity, uiNode, parent] of commands.all(UiNode, Parent)) {
    if (!uiNode.element) continue;

    const parentUiNode = commands.tryGetComponent(parent.parentId, UiNode);
    if (!parentUiNode?.element) continue;

    // If the element's DOM parent doesn't match the ECS parent, fix it
    if (uiNode.element.parentElement !== parentUiNode.element) {
      if (uiNode.element.parentElement) {
        uiNode.element.parentElement.removeChild(uiNode.element);
      }
      parentUiNode.element.appendChild(uiNode.element);
    }
  }
}
