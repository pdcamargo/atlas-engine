import type { Commands } from "@atlas/core";
import {
  UiNode,
  FlexLayout,
  Spacing,
  Size,
  Position,
  FlexItem,
  Background,
  Border,
  Shadow,
  Overflow,
  Opacity,
  Cursor,
  TextStyle,
  TextColor,
  TextAlign,
} from "../components";

/**
 * System that applies CSS layout and styling properties to DOM elements.
 * This system reads ECS components and updates the element's style accordingly.
 */
export function layoutSystem({ commands }: { commands: Commands }) {
  // Apply FlexLayout
  for (const [entity, uiNode, flexLayout] of commands.all(UiNode, FlexLayout)) {
    if (!uiNode.element) continue;
    const style = uiNode.element.style;

    if (flexLayout.display) style.display = flexLayout.display;
    if (flexLayout.direction) style.flexDirection = flexLayout.direction;
    if (flexLayout.wrap) style.flexWrap = flexLayout.wrap;
    if (flexLayout.justifyContent)
      style.justifyContent = flexLayout.justifyContent;
    if (flexLayout.alignItems) style.alignItems = flexLayout.alignItems;
    if (flexLayout.alignContent) style.alignContent = flexLayout.alignContent;
    if (flexLayout.gap) style.gap = flexLayout.gap;
    if (flexLayout.rowGap) style.rowGap = flexLayout.rowGap;
    if (flexLayout.columnGap) style.columnGap = flexLayout.columnGap;
  }

  // Apply Spacing
  for (const [entity, uiNode, spacing] of commands.all(UiNode, Spacing)) {
    if (!uiNode.element) continue;
    const style = uiNode.element.style;

    if (spacing.margin !== undefined) style.margin = spacing.margin;
    if (spacing.padding !== undefined) style.padding = spacing.padding;
  }

  // Apply Size
  for (const [entity, uiNode, size] of commands.all(UiNode, Size)) {
    if (!uiNode.element) continue;
    const style = uiNode.element.style;

    if (size.width !== undefined) style.width = size.width;
    if (size.height !== undefined) style.height = size.height;
    if (size.minWidth !== undefined) style.minWidth = size.minWidth;
    if (size.minHeight !== undefined) style.minHeight = size.minHeight;
    if (size.maxWidth !== undefined) style.maxWidth = size.maxWidth;
    if (size.maxHeight !== undefined) style.maxHeight = size.maxHeight;
  }

  // Apply Position
  for (const [entity, uiNode, position] of commands.all(UiNode, Position)) {
    if (!uiNode.element) continue;
    const style = uiNode.element.style;

    if (position.position) style.position = position.position;
    if (position.top !== undefined) style.top = position.top;
    if (position.right !== undefined) style.right = position.right;
    if (position.bottom !== undefined) style.bottom = position.bottom;
    if (position.left !== undefined) style.left = position.left;
    if (position.zIndex !== undefined) style.zIndex = `${position.zIndex}`;
  }

  // Apply FlexItem
  for (const [entity, uiNode, flexItem] of commands.all(UiNode, FlexItem)) {
    if (!uiNode.element) continue;
    const style = uiNode.element.style;

    if (flexItem.flex !== undefined) style.flex = flexItem.flex;
    if (flexItem.flexGrow !== undefined) style.flexGrow = `${flexItem.flexGrow}`;
    if (flexItem.flexShrink !== undefined)
      style.flexShrink = `${flexItem.flexShrink}`;
    if (flexItem.flexBasis !== undefined) style.flexBasis = flexItem.flexBasis;
    if (flexItem.alignSelf !== undefined) style.alignSelf = flexItem.alignSelf;
    if (flexItem.order !== undefined) style.order = `${flexItem.order}`;
  }

  // Apply Background
  for (const [entity, uiNode, background] of commands.all(UiNode, Background)) {
    if (!uiNode.element) continue;
    const style = uiNode.element.style;

    if (background.color !== undefined)
      style.backgroundColor = background.color;
    if (background.image !== undefined)
      style.backgroundImage = background.image;
    if (background.size !== undefined) style.backgroundSize = background.size;
    if (background.position !== undefined)
      style.backgroundPosition = background.position;
    if (background.repeat !== undefined)
      style.backgroundRepeat = background.repeat;
    if (background.attachment !== undefined)
      style.backgroundAttachment = background.attachment;
    if (background.clip !== undefined)
      style.backgroundClip = background.clip;
    if (background.origin !== undefined)
      style.backgroundOrigin = background.origin;
  }

  // Apply Border
  for (const [entity, uiNode, border] of commands.all(UiNode, Border)) {
    if (!uiNode.element) continue;
    const style = uiNode.element.style;

    if (border.width !== undefined) style.borderWidth = border.width;
    if (border.style !== undefined) style.borderStyle = border.style;
    if (border.color !== undefined) style.borderColor = border.color;
    if (border.radius !== undefined) style.borderRadius = border.radius;

    // Individual sides
    if (border.topWidth !== undefined) style.borderTopWidth = border.topWidth;
    if (border.rightWidth !== undefined)
      style.borderRightWidth = border.rightWidth;
    if (border.bottomWidth !== undefined)
      style.borderBottomWidth = border.bottomWidth;
    if (border.leftWidth !== undefined)
      style.borderLeftWidth = border.leftWidth;

    if (border.topStyle !== undefined) style.borderTopStyle = border.topStyle;
    if (border.rightStyle !== undefined)
      style.borderRightStyle = border.rightStyle;
    if (border.bottomStyle !== undefined)
      style.borderBottomStyle = border.bottomStyle;
    if (border.leftStyle !== undefined)
      style.borderLeftStyle = border.leftStyle;

    if (border.topColor !== undefined) style.borderTopColor = border.topColor;
    if (border.rightColor !== undefined)
      style.borderRightColor = border.rightColor;
    if (border.bottomColor !== undefined)
      style.borderBottomColor = border.bottomColor;
    if (border.leftColor !== undefined)
      style.borderLeftColor = border.leftColor;

    // Individual corners
    if (border.topLeftRadius !== undefined)
      style.borderTopLeftRadius = border.topLeftRadius;
    if (border.topRightRadius !== undefined)
      style.borderTopRightRadius = border.topRightRadius;
    if (border.bottomRightRadius !== undefined)
      style.borderBottomRightRadius = border.bottomRightRadius;
    if (border.bottomLeftRadius !== undefined)
      style.borderBottomLeftRadius = border.bottomLeftRadius;
  }

  // Apply Shadow
  for (const [entity, uiNode, shadow] of commands.all(UiNode, Shadow)) {
    if (!uiNode.element) continue;
    const style = uiNode.element.style;

    if (shadow.boxShadow !== undefined) style.boxShadow = shadow.boxShadow;
    if (shadow.textShadow !== undefined) style.textShadow = shadow.textShadow;
  }

  // Apply Overflow
  for (const [entity, uiNode, overflow] of commands.all(UiNode, Overflow)) {
    if (!uiNode.element) continue;
    const style = uiNode.element.style;

    if (overflow.overflow !== undefined) style.overflow = overflow.overflow;
    if (overflow.overflowX !== undefined) style.overflowX = overflow.overflowX;
    if (overflow.overflowY !== undefined) style.overflowY = overflow.overflowY;
  }

  // Apply Opacity
  for (const [entity, uiNode, opacity] of commands.all(UiNode, Opacity)) {
    if (!uiNode.element) continue;
    uiNode.element.style.opacity = `${opacity.value}`;
  }

  // Apply Cursor
  for (const [entity, uiNode, cursor] of commands.all(UiNode, Cursor)) {
    if (!uiNode.element) continue;
    uiNode.element.style.cursor = cursor.cursor;
  }

  // Apply TextStyle
  for (const [entity, uiNode, textStyle] of commands.all(UiNode, TextStyle)) {
    if (!uiNode.element) continue;
    const style = uiNode.element.style;

    if (textStyle.fontSize !== undefined) style.fontSize = textStyle.fontSize;
    if (textStyle.fontWeight !== undefined)
      style.fontWeight = `${textStyle.fontWeight}`;
    if (textStyle.fontStyle !== undefined)
      style.fontStyle = textStyle.fontStyle;
    if (textStyle.fontFamily !== undefined)
      style.fontFamily = textStyle.fontFamily;
    if (textStyle.lineHeight !== undefined)
      style.lineHeight = textStyle.lineHeight;
    if (textStyle.letterSpacing !== undefined)
      style.letterSpacing = textStyle.letterSpacing;
    if (textStyle.wordSpacing !== undefined)
      style.wordSpacing = textStyle.wordSpacing;
    if (textStyle.textDecoration !== undefined)
      style.textDecoration = textStyle.textDecoration;
    if (textStyle.textTransform !== undefined)
      style.textTransform = textStyle.textTransform;
    if (textStyle.whiteSpace !== undefined)
      style.whiteSpace = textStyle.whiteSpace;
  }

  // Apply TextColor
  for (const [entity, uiNode, textColor] of commands.all(UiNode, TextColor)) {
    if (!uiNode.element) continue;
    uiNode.element.style.color = textColor.color;
  }

  // Apply TextAlign
  for (const [entity, uiNode, textAlign] of commands.all(UiNode, TextAlign)) {
    if (!uiNode.element) continue;
    const style = uiNode.element.style;

    style.textAlign = textAlign.textAlign;
    if (textAlign.verticalAlign !== undefined)
      style.verticalAlign = textAlign.verticalAlign;
  }
}
