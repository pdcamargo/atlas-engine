import { defineBundle } from "@atlas/core";
import {
  UiNode,
  UiElement,
  Interactive,
  Text,
  TextStyle,
  TextColor,
  TextAlign,
  Spacing,
  Background,
  Border,
  Size,
  Cursor,
  Shadow,
} from "../components";

/**
 * ButtonBundle - An interactive button component
 *
 * Usage:
 * ```ts
 * commands.spawnBundle(ButtonBundle, {
 *   text: ['Click Me'],
 *   textStyle: [{ fontSize: 16, fontWeight: 'bold' }],
 *   textColor: [{ color: '#ffffff' }],
 *   background: [{ color: '#4CAF50' }],
 *   spacing: [{ padding: { vertical: 10, horizontal: 20 } }],
 *   border: [{ radius: 4 }]
 * });
 * ```
 */
export const ButtonBundle = defineBundle({
  uiNode: UiNode,
  uiElement: UiElement,
  interactive: Interactive,
  text: defineBundle.required(Text),
  textStyle: TextStyle,
  textColor: TextColor,
  textAlign: TextAlign,
  spacing: Spacing,
  background: Background,
  border: Border,
  size: Size,
  cursor: Cursor,
  shadow: Shadow,
});
