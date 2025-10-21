import { defineBundle } from "@atlas/core";
import {
  UiNode,
  UiElement,
  Text,
  TextStyle,
  TextColor,
  TextAlign,
  Spacing,
  Background,
} from "../components";

/**
 * TextBundle - A styled text component
 *
 * Usage:
 * ```ts
 * commands.spawnBundle(TextBundle, {
 *   text: ['Hello, World!'],
 *   textStyle: [{ fontSize: 24, fontWeight: 'bold' }],
 *   textColor: [{ color: '#333333' }],
 *   textAlign: [{ textAlign: 'center' }]
 * });
 * ```
 */
export const TextBundle = defineBundle({
  uiNode: UiNode,
  uiElement: UiElement,
  text: defineBundle.required(Text),
  textStyle: TextStyle,
  textColor: TextColor,
  textAlign: TextAlign,
  spacing: Spacing,
  background: Background,
});
