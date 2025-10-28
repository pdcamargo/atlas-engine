import { defineBundle } from "@atlas/core";
import {
  UiNode,
  UiElement,
  GridLayout,
  Spacing,
  Size,
  Background,
  Border,
  Position,
  Overflow,
  Shadow,
} from "../components";

/**
 * GridBundle - A CSS Grid container component
 *
 * Optimized bundle for creating grid containers with layout capabilities.
 * Uses CSS Grid for powerful 2D layouts.
 *
 * Usage:
 * ```ts
 * commands.spawnBundle(GridBundle, {
 *   gridLayout: [{
 *     templateColumns: 'repeat(3, 1fr)',
 *     gap: 16,
 *     alignItems: 'center'
 *   }],
 *   spacing: [{ padding: { all: 20 } }],
 *   size: [{ width: '100%' }],
 *   background: [{ color: '#f0f0f0' }]
 * });
 * ```
 */
export const GridBundle = defineBundle({
  uiNode: UiNode,
  uiElement: UiElement,
  gridLayout: GridLayout,
  spacing: Spacing,
  size: Size,
  background: Background,
  border: Border,
  position: Position,
  overflow: Overflow,
  shadow: Shadow,
});
