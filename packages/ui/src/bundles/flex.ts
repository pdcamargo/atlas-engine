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
 * FlexBundle - A flexbox container component
 *
 * Optimized bundle for creating flex containers with layout capabilities.
 * Similar to BoxBundle but explicitly includes FlexLayout by default.
 *
 * Usage:
 * ```ts
 * commands.spawnBundle(FlexBundle, {
 *   flexLayout: [{ direction: 'row', gap: 16, justifyContent: 'space-between' }],
 *   spacing: [{ padding: { all: 20 } }],
 *   size: [{ width: '100%' }],
 *   background: [{ color: '#f0f0f0' }]
 * });
 * ```
 */
export const FlexBundle = defineBundle({
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
