import type { App, EcsPlugin } from "@atlas/core";
import { domSyncSystem, layoutSystem, interactionSystem } from "./systems";

/**
 * System set for UI-related systems
 */
export const UiSet = Symbol("UiSet");

/**
 * UI Plugin for the Atlas ECS engine.
 *
 * This plugin provides a modern, ECS-first UI system that renders to HTML/DOM.
 *
 * Features:
 * - Component-based UI construction
 * - Automatic DOM synchronization
 * - Layout system with flexbox support
 * - Custom event system integration
 * - Parent-child hierarchy support
 *
 * Usage:
 * ```ts
 * const app = App.create()
 *   .addPlugins(new UiPlugin())
 *   .addStartupSystems(({ commands }) => {
 *     // Define custom events
 *     class ButtonClickEvent {
 *       constructor(public entity: Entity) {}
 *     }
 *
 *     app.addEvent(ButtonClickEvent);
 *
 *     // Create UI
 *     commands.spawnBundle(ButtonBundle, {
 *       text: ['Click Me'],
 *       background: [{ color: '#4CAF50' }]
 *     })
 *     .insert(new OnClick(ButtonClickEvent));
 *   })
 *   .addUpdateSystems(({ commands }) => {
 *     const events = commands.getResource(Events);
 *     const reader = events.reader(ButtonClickEvent, this);
 *
 *     for (const event of reader.read()) {
 *       console.log('Button clicked!', event.entity);
 *     }
 *   });
 * ```
 */
export class UiPlugin implements EcsPlugin {
  constructor() {}

  public async build(app: App): Promise<void> {
    // Register UI update systems
    app.addUpdateSystems(
      // DOM sync runs first to create/update elements
      domSyncSystem,
      // Then layout system applies CSS properties
      layoutSystem,
      // Finally, interaction system handles events
      interactionSystem
    );
  }

  public name(): string {
    return "UiPlugin";
  }

  public isUnique(): boolean {
    return true;
  }
}
