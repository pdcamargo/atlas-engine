# @atlas/ui

Modern, ECS-first UI system for the Atlas Engine that renders to HTML/DOM.

## Overview

The `@atlas/ui` package provides a component-based UI system that integrates seamlessly with Atlas's Entity-Component-System architecture. Instead of rendering to canvas/WebGPU, UI elements are synchronized to actual DOM elements, allowing you to leverage the full power of HTML, CSS, and browser APIs while maintaining the consistency of the ECS pattern.

## Features

- **ECS Integration** - UI elements are first-class entities with components
- **Automatic DOM Synchronization** - Components automatically sync to DOM
- **Flexbox Layout System** - Modern CSS flexbox with component-based configuration
- **Event System Integration** - Custom events fired through ECS event system
- **Parent-Child Hierarchy** - Uses ECS `Parent`/`Children` for scene graph
- **Runtime State Markers** - `Hovered` and `Focused` components added/removed automatically
- **Bundles** - Pre-configured component collections for common UI patterns

## Installation

```bash
pnpm add @atlas/ui
```

## Quick Start

```typescript
import { App } from "@atlas/engine";
import { UiPlugin, ButtonBundle, OnClick } from "@atlas/ui";

// Define a custom event
class ButtonClickEvent {
  constructor(public entity: Entity) {}
}

await App.create()
  .addPlugins(new UiPlugin())
  .addEvent(ButtonClickEvent)
  .addStartupSystems(({ commands }) => {
    // Create a button using a bundle
    commands.spawnBundle(ButtonBundle, {
      text: ['Click Me!'],
      background: [{ color: '#4CAF50' }],
      spacing: [{ padding: { all: 16 } }],
      border: [{ radius: 8 }]
    })
    .insert(new OnClick(ButtonClickEvent))
    .insert(new UiRoot());
  })
  .addUpdateSystems(({ events }) => {
    // Handle button clicks
    const reader = events.reader(ButtonClickEvent);
    for (const event of reader.read()) {
      console.log('Button clicked!', event.entity);
    }
  })
  .run();
```

## Architecture

The UI system follows a three-phase update cycle executed every frame:

### 1. DOM Sync Phase (`domSyncSystem`)

Creates and maintains DOM elements synchronized with ECS entities:

- Creates global `#atlas-ui-root` wrapper div
- Creates DOM elements from `UiElement` component tag specification
- Syncs text content from `Text` component
- Syncs parent-child relationships to actual DOM tree
- Applies CSS classes from `UiClass` component
- Applies inline styles from `UiStyle` component
- Sets disabled attribute from `Disabled` component

### 2. Layout Phase (`layoutSystem`)

Applies CSS properties from ECS components to DOM elements:

- Processes layout components in order: `FlexLayout`, `Spacing`, `Size`, `Position`, `FlexItem`
- Processes appearance components: `Background`, `Border`, `Shadow`, `Overflow`, `Opacity`, `Cursor`
- Processes text components: `TextStyle`, `TextColor`, `TextAlign`

### 3. Interaction Phase (`interactionSystem`)

Attaches DOM event listeners and fires ECS events:

- Attaches listeners for `OnClick`, `OnHoverEnter`, `OnHoverExit`, `OnFocus`, `OnBlur`
- Adds/removes runtime markers: `Hovered`, `Focused`
- Respects `Disabled` component state
- Fires custom events through ECS event system

## Components

### Core Components

#### `UiNode`

Marks an entity as a UI element and holds the reference to its DOM element. Automatically managed by the DOM sync system.

```typescript
const entity = commands.spawn(new UiNode());
```

#### `UiElement`

Specifies the HTML tag type for the UI element. Common tags: `'div'`, `'button'`, `'span'`, `'p'`, `'h1'`, `'input'`, etc.

```typescript
new UiElement("button")
new UiElement("h1")
new UiElement("div") // default
```

#### `UiRoot`

Marks a UI element as a root container. Root elements are mounted to the global `#atlas-ui-root` wrapper.

```typescript
commands.spawn(new UiNode(), new UiElement("div"))
  .insert(new UiRoot());
```

#### `UiClass`

CSS class names to apply to the element. Uses a `Set`-based API for efficient class management.

```typescript
const classes = new UiClass("btn", "btn-primary");
classes.add("active");
classes.remove("btn-primary");
classes.has("btn"); // true
```

#### `UiStyle`

Custom inline styles as a key-value map. Useful for dynamic styles or one-off overrides.

```typescript
const style = new UiStyle({
  transform: "rotate(45deg)",
  transition: "all 0.3s ease"
});
style.set("opacity", "0.5");
```

### Layout Components

#### `FlexLayout`

Complete flexbox layout properties.

```typescript
new FlexLayout({
  direction: 'column',        // flex-direction
  wrap: 'nowrap',             // flex-wrap
  justifyContent: 'center',   // justify-content
  alignItems: 'flex-start',   // align-items
  alignContent: 'stretch',    // align-content
  gap: 16,                    // gap (number or CSS string)
  rowGap: 8,                  // row-gap
  columnGap: 8                // column-gap
})
```

#### `FlexItem`

Flex child properties for elements inside a flex container.

```typescript
new FlexItem({
  flex: '1 1 auto',           // flex shorthand
  flexGrow: 1,                // flex-grow
  flexShrink: 0,              // flex-shrink
  flexBasis: '200px',         // flex-basis
  alignSelf: 'center',        // align-self
  order: 2                    // order
})
```

#### `GridLayout`

Complete CSS Grid layout properties for creating powerful 2D grid layouts.

```typescript
new GridLayout({
  display: 'grid',                      // display mode
  templateColumns: 'repeat(3, 1fr)',    // column template
  templateRows: 'auto 1fr auto',        // row template
  templateAreas: `
    "header header header"
    "sidebar main main"
    "footer footer footer"
  `,                                    // grid template areas
  gap: 16,                              // gap (number or CSS string)
  rowGap: 8,                            // row-gap
  columnGap: 16,                        // column-gap
  justifyItems: 'center',               // justify-items
  alignItems: 'stretch',                // align-items
  justifyContent: 'space-between',      // justify-content
  alignContent: 'start',                // align-content
  autoColumns: '1fr',                   // grid-auto-columns
  autoRows: 'minmax(100px, auto)',      // grid-auto-rows
  autoFlow: 'row dense'                 // grid-auto-flow
})
```

#### `GridItem`

Grid child properties for elements inside a grid container.

```typescript
new GridItem({
  gridColumn: '1 / 3',        // grid-column (span across columns)
  gridRow: '2',               // grid-row
  gridArea: 'header',         // grid-area (named area)
  justifySelf: 'center',      // justify-self
  alignSelf: 'start',         // align-self
  order: 1                    // order
})
```

#### `Spacing`

Margin and padding with flexible configuration. Accepts number, CSS string, or object notation.

```typescript
// All sides
new Spacing({ padding: { all: 16 } })

// Vertical and horizontal
new Spacing({
  padding: { vertical: 16, horizontal: 24 },
  margin: { vertical: 8, horizontal: 0 }
})

// Individual sides
new Spacing({
  padding: { top: 16, right: 24, bottom: 16, left: 24 },
  margin: { top: 8 }
})

// CSS strings
new Spacing({
  padding: { all: '1rem' },
  margin: { top: '2em', bottom: '1em' }
})
```

#### `Size`

Width, height, and min/max constraints.

```typescript
new Size({
  width: '100%',
  height: 'auto',
  minWidth: 200,
  minHeight: 50,
  maxWidth: '800px',
  maxHeight: '90vh'
})
```

#### `Position`

Absolute/relative/fixed positioning with offset and z-index.

```typescript
new Position({
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 100
})
```

### Appearance Components

#### `Background`

Background color, image, size, position, and repeat.

```typescript
new Background({
  color: '#4CAF50',
  image: 'url(/path/to/image.png)',
  size: 'cover',
  position: 'center',
  repeat: 'no-repeat'
})
```

#### `Border`

Border width, style, color (all-side and per-side), and border radius.

```typescript
// All sides
new Border({
  width: 2,
  style: 'solid',
  color: '#333',
  radius: 8
})

// Per-side configuration
new Border({
  topWidth: 2,
  topStyle: 'solid',
  topColor: '#333',
  rightWidth: 1,
  rightStyle: 'dashed',
  rightColor: '#666',
  radius: { topLeft: 8, topRight: 8 }
})
```

#### `Shadow`

Box shadow and text shadow with static helper methods.

```typescript
new Shadow({
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
})

// Using static helpers
Shadow.box(4, 6, 8, 'rgba(0, 0, 0, 0.2)')  // offsetX, offsetY, blur, color
Shadow.text(1, 1, 2, 'rgba(0, 0, 0, 0.5)') // offsetX, offsetY, blur, color
```

#### `Overflow`

Overflow behavior for content that exceeds element bounds.

```typescript
new Overflow('hidden')           // overflow: hidden
new Overflow('scroll', 'auto')   // overflow-x: scroll, overflow-y: auto
```

#### `Opacity`

Element opacity (0-1 range, clamped automatically).

```typescript
new Opacity(0.8)  // 80% opaque
```

#### `Cursor`

Cursor style when hovering over the element.

```typescript
new Cursor('pointer')
new Cursor('text')
new Cursor('grab')
```

### Text Components

#### `Text`

Text content string. Updates DOM `textContent` when changed.

```typescript
const text = new Text('Hello, World!');
text.content = 'New text';  // Updates DOM
```

#### `TextStyle`

Font properties including size, weight, family, line-height, letter-spacing, etc.

```typescript
new TextStyle({
  fontSize: 18,                    // number (px) or CSS string
  fontWeight: 'bold',              // 'normal' | 'bold' | number
  fontFamily: 'Arial, sans-serif',
  lineHeight: 1.5,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  textDecoration: 'underline',
  fontStyle: 'italic'
})
```

#### `TextColor`

Text color (defaults to black).

```typescript
new TextColor({ color: '#333333' })
```

#### `TextAlign`

Text alignment (horizontal and vertical).

```typescript
new TextAlign({
  textAlign: 'center',      // 'left' | 'center' | 'right' | 'justify'
  verticalAlign: 'middle'   // 'top' | 'middle' | 'bottom' | 'baseline'
})
```

### Interactive Components

#### `Interactive`

Marks an entity as interactive (listens to DOM events). Required for event handling.

```typescript
new Interactive()
```

#### `OnClick<T>`

Fires a custom event when the element is clicked. The user must register the event class with `app.addEvent()`.

```typescript
class ButtonClickEvent {
  constructor(public entity: Entity, public data?: string) {}
}

app.addEvent(ButtonClickEvent);

// Without data
commands.spawn(new OnClick(ButtonClickEvent));

// With data
commands.spawn(new OnClick(ButtonClickEvent, 'button-id'));
```

#### `OnHoverEnter<T>` / `OnHoverExit<T>`

Fires custom events on mouse enter/exit. Automatically adds/removes `Hovered` component.

```typescript
class HoverEnterEvent {
  constructor(public entity: Entity) {}
}

app.addEvent(HoverEnterEvent);

commands.spawn(
  new OnHoverEnter(HoverEnterEvent),
  new OnHoverExit(HoverEnterEvent)
);
```

#### `OnFocus<T>` / `OnBlur<T>`

Fires custom events on focus/blur. Automatically adds/removes `Focused` component.

```typescript
class FocusEvent {
  constructor(public entity: Entity) {}
}

app.addEvent(FocusEvent);

commands.spawn(
  new OnFocus(FocusEvent),
  new OnBlur(FocusEvent)
);
```

#### `Disabled`

Prevents interaction with the element. Sets the `disabled` attribute on form elements.

```typescript
const disabled = new Disabled();
disabled.enable();
disabled.disable();
disabled.toggle();
```

#### `Hovered` (Runtime Marker)

Added automatically by the interaction system when the mouse enters the element. Removed on exit.

**Important**: Do not manually add this component. Query for it to apply visual effects.

```typescript
// Query for hovered buttons to apply styles
for (const [entity, button, hovered] of commands.all(Button, Hovered)) {
  const background = commands.getComponent(entity, Background);
  background.color = '#45a049';  // Hover color
}
```

#### `Focused` (Runtime Marker)

Added automatically by the interaction system when the element receives focus. Removed on blur.

**Important**: Do not manually add this component. Query for it to apply visual effects.

## Bundles

Bundles are pre-configured collections of components for common UI patterns.

### `BoxBundle`

Flexible container with layout capabilities.

**Components**: `UiNode`, `UiElement`, `FlexLayout`, `Spacing`, `Size`, `Background`, `Border`, `Position`, `Overflow`, `Shadow`

```typescript
commands.spawnBundle(BoxBundle, {
  flexLayout: [{ direction: 'column', gap: 20 }],
  spacing: [{ padding: { all: 24 } }],
  size: [{ width: '100%', height: 'auto' }],
  background: [{ color: '#f0f0f0' }],
  border: [{ radius: 8 }],
  shadow: [{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }]
});
```

### `ButtonBundle`

Interactive button component.

**Components**: `UiNode`, `UiElement`, `Interactive`, `Text` (required), `TextStyle`, `TextColor`, `TextAlign`, `Spacing`, `Background`, `Border`, `Size`, `Cursor`, `Shadow`

```typescript
commands.spawnBundle(ButtonBundle, {
  text: ['Click Me'],  // Required
  textStyle: [{ fontSize: 16, fontWeight: 'bold' }],
  textColor: [{ color: '#ffffff' }],
  background: [{ color: '#4CAF50' }],
  spacing: [{ padding: { vertical: 12, horizontal: 24 } }],
  border: [{ radius: 4 }],
  cursor: ['pointer']
});
```

### `TextBundle`

Styled text element.

**Components**: `UiNode`, `UiElement`, `Text` (required), `TextStyle`, `TextColor`, `TextAlign`, `Spacing`, `Background`

```typescript
commands.spawnBundle(TextBundle, {
  text: ['Hello, World!'],  // Required
  textStyle: [{ fontSize: 24, fontWeight: 'bold' }],
  textColor: [{ color: '#333333' }],
  textAlign: [{ textAlign: 'center' }]
});
```

### `FlexBundle`

Flexbox container with layout capabilities. Similar to `BoxBundle` but explicitly includes `FlexLayout` for flexbox-specific layouts.

**Components**: `UiNode`, `UiElement`, `FlexLayout`, `Spacing`, `Size`, `Background`, `Border`, `Position`, `Overflow`, `Shadow`

```typescript
commands.spawnBundle(FlexBundle, {
  flexLayout: [{ direction: 'row', gap: 16, justifyContent: 'space-between' }],
  spacing: [{ padding: { all: 20 } }],
  size: [{ width: '100%' }],
  background: [{ color: '#f0f0f0' }],
  border: [{ radius: 8 }]
});
```

### `GridBundle`

CSS Grid container for powerful 2D layouts.

**Components**: `UiNode`, `UiElement`, `GridLayout`, `Spacing`, `Size`, `Background`, `Border`, `Position`, `Overflow`, `Shadow`

```typescript
commands.spawnBundle(GridBundle, {
  gridLayout: [{
    templateColumns: 'repeat(3, 1fr)',
    gap: 16,
    alignItems: 'center'
  }],
  spacing: [{ padding: { all: 20 } }],
  size: [{ width: '100%' }],
  background: [{ color: '#ffffff' }],
  border: [{ width: 1, style: 'solid', color: '#ddd' }]
});
```

## Usage Patterns

### Creating UI Elements

**Using bundles (recommended):**

```typescript
const button = commands.spawnBundle(ButtonBundle, {
  text: ['Submit'],
  background: [{ color: '#2196F3' }]
})
.insert(new UiRoot())
.id();
```

**Using individual components:**

```typescript
const button = commands.spawn(
  new UiNode(),
  new UiElement('button'),
  new Text('Submit'),
  new Background({ color: '#2196F3' }),
  new Spacing({ padding: { all: 12 } })
)
.insert(new UiRoot())
.id();
```

### Building Hierarchies

Use ECS parent-child relationships to build UI hierarchies:

**Flexbox layout:**
```typescript
// Create flex container
const container = commands.spawnBundle(FlexBundle, {
  flexLayout: [{ direction: 'column', gap: 16 }]
})
.insert(new UiRoot())
.id();

// Add children
commands.spawn(new UiNode(), new Text('Title'))
  .withParent(container);

commands.spawn(new UiNode(), new Text('Subtitle'))
  .withParent(container);
```

**Grid layout:**
```typescript
// Create grid container with 3 columns
const grid = commands.spawnBundle(GridBundle, {
  gridLayout: [{
    templateColumns: 'repeat(3, 1fr)',
    gap: 16,
    alignItems: 'center'
  }],
  spacing: [{ padding: { all: 20 } }]
})
.insert(new UiRoot())
.id();

// Add grid items
for (let i = 0; i < 6; i++) {
  commands.spawn(
    new UiNode(),
    new UiElement('div'),
    new Text(`Item ${i + 1}`),
    new Background({ color: '#e0e0e0' }),
    new Spacing({ padding: { all: 16 } }),
    new GridItem({ justifySelf: 'stretch', alignSelf: 'stretch' })
  )
  .withParent(grid);
}
```

### Handling Events

**1. Define custom event classes:**

```typescript
class ButtonClickEvent {
  constructor(
    public entity: Entity,
    public buttonId?: string
  ) {}
}
```

**2. Register events with app:**

```typescript
app.addEvent(ButtonClickEvent);
```

**3. Add event components to entities:**

```typescript
commands.spawn(new UiNode())
  .insert(new OnClick(ButtonClickEvent, 'submit-btn'));
```

**4. Handle events in systems:**

```typescript
sys(({ events }) => {
  const reader = events.reader(ButtonClickEvent);
  for (const event of reader.read()) {
    console.log('Button clicked:', event.buttonId);
  }
});
```

### Dynamic Styling

**React to hover state:**

```typescript
sys(({ commands }) => {
  for (const [entity, button, hovered] of commands.all(Button, Hovered)) {
    const background = commands.getComponent(entity, Background);
    background.color = '#45a049';  // Hover color
  }

  // Reset non-hovered buttons
  for (const [entity, button] of commands.all(Button).without(Hovered)) {
    const background = commands.getComponent(entity, Background);
    background.color = '#4CAF50';  // Normal color
  }
});
```

**Animate properties:**

```typescript
sys(({ commands }) => {
  for (const [entity, loading] of commands.all(LoadingSpinner)) {
    const style = commands.getComponent(entity, UiStyle);
    const rotation = (Date.now() / 10) % 360;
    style.set('transform', `rotate(${rotation}deg)`);
  }
});
```

### Spacing Configuration

The `Spacing` component accepts flexible input formats:

```typescript
// Single value for all sides
{ all: 16 }             // "16px"
{ all: '1rem' }         // "1rem"

// Vertical and horizontal
{ vertical: 16, horizontal: 24 }  // "16px 24px"

// Individual sides
{ top: 16, right: 24, bottom: 16, left: 24 }  // "16px 24px 16px 24px"

// Mixed
{ top: '2rem', horizontal: 16, bottom: 8 }  // "2rem 16px 8px 16px"
```

## Complete Example

See [apps/web/src/games/ui-demo/ui-demo.ts](../../apps/web/src/games/ui-demo/ui-demo.ts) for a full example demonstrating:

- Menu layout with flexbox
- Interactive buttons with hover effects
- Custom event handling
- Visual state updates based on events
- Complex component composition

```typescript
import { App, UiPlugin, ButtonBundle, OnClick, OnHoverEnter } from "@atlas/ui";

class ButtonClickEvent {
  constructor(public entity: Entity) {}
}

class HoverEvent {
  constructor(public entity: Entity, public buttonType: string) {}
}

await App.create()
  .addPlugins(new UiPlugin())
  .addEvent(ButtonClickEvent)
  .addEvent(HoverEvent)
  .addStartupSystems(({ commands }) => {
    // Create menu container
    const menu = commands.spawnBundle(BoxBundle, {
      flexLayout: [{ direction: 'column', gap: 20 }],
      size: [{ width: '400px', height: '100vh' }],
      background: [{ color: 'rgba(20, 20, 30, 0.95)' }],
      spacing: [{ padding: { all: 40 } }]
    })
    .insert(new UiRoot())
    .id();

    // Add title
    commands.spawn(
      new UiNode(),
      new UiElement('h1'),
      new Text('GAME MENU'),
      new TextStyle({ fontSize: 36, fontWeight: 'bold' }),
      new TextColor({ color: '#ffffff' })
    )
    .withParent(menu);

    // Add button
    commands.spawnBundle(ButtonBundle, {
      text: ['START GAME'],
      background: [{ color: '#4CAF50' }],
      spacing: [{ padding: { vertical: 15, horizontal: 40 } }]
    })
    .insert(new OnClick(ButtonClickEvent))
    .insert(new OnHoverEnter(HoverEvent, 'start'))
    .withParent(menu);
  })
  .addUpdateSystems(({ events, commands }) => {
    // Handle clicks
    const clickReader = events.reader(ButtonClickEvent);
    for (const event of clickReader.read()) {
      console.log('Start game clicked!');
    }

    // Handle hover
    const hoverReader = events.reader(HoverEvent);
    for (const event of hoverReader.read()) {
      const bg = commands.getComponent(event.entity, Background);
      bg.color = '#45a049';  // Darken on hover
    }
  })
  .run();
```

## Technical Details

### Global UI Root

The system creates a global `#atlas-ui-root` wrapper div with:
- `position: absolute` (covers entire viewport)
- `z-index: 999` (renders above canvas)
- `pointer-events: none` (allows click-through to canvas)
- Child elements have `pointer-events: auto` to enable interaction

### Event Listener Management

The interaction system tracks attached listeners via `InteractionState` resource to ensure:
- Listeners are only attached once per entity
- Listeners are automatically cleaned up when entities are destroyed
- No memory leaks from orphaned event handlers

### Performance Considerations

- **DOM sync runs first** to ensure elements exist before styling
- **Component loops are separated** for better cache locality
- **DOM updates are minimized** by checking current values before setting
- **Event listeners are attached once** and reused across frames

## Current Limitations

- No animation/transition support (use `@atlas/animator` package)
- No form validation helpers
- No accessibility features (ARIA attributes, semantic HTML helpers)
- No responsive breakpoints/media queries
- No virtualization for large lists
- No built-in modal/dialog abstractions
- No tooltip/popover components

## Best Practices

1. **Use bundles for common patterns** - `BoxBundle`, `ButtonBundle`, `TextBundle`
2. **Define custom events** - Create event classes for each interaction type
3. **Query runtime markers** - Use `Hovered`, `Focused` to apply visual effects
4. **Leverage ECS hierarchy** - Use `Parent`/`Children` for UI structure
5. **Keep systems focused** - Separate layout, interaction, and business logic
6. **Prefer components over inline styles** - Use `Background`, `Border`, etc. instead of `UiStyle`
7. **Register events before use** - Call `app.addEvent(EventClass)` before spawning entities

## Integration with Other Packages

- **@atlas/core** - Uses ECS entities, components, systems, events
- **@atlas/animator** - Can animate UI component properties
- **@atlas/webgpu-renderer** - UI renders on top of WebGPU canvas

## License

MIT
