import { defineBundle } from "@atlas/core";
import {
  UiNode,
  UiElement,
  FlexLayout,
  Spacing,
  Size,
  Background,
  Border,
  Position,
  Overflow,
  Shadow,
} from "../components";

/**
 * BoxBundle - A flexible container with layout capabilities
 *
 * Usage:
 * ```ts
 * commands.spawnBundle(BoxBundle, {
 *   flexLayout: [{ direction: 'column', gap: 10 }],
 *   spacing: [{ padding: { all: 20 } }],
 *   background: [{ color: '#f0f0f0' }],
 *   size: [{ width: '100%', height: 'auto' }]
 * });
 * ```
 */
export const BoxBundle = defineBundle({
  uiNode: UiNode,
  uiElement: UiElement,
  flexLayout: FlexLayout,
  spacing: Spacing,
  size: Size,
  background: Background,
  border: Border,
  position: Position,
  overflow: Overflow,
  shadow: Shadow,
});
