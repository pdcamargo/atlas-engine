import {
  App,
  EcsPlugin,
  Entity,
  Events,
  Commands,
  UiPlugin,
  UiNode,
  UiElement,
  UiRoot,
  Interactive,
  OnClick,
  OnHoverEnter,
  OnHoverExit,
  Text,
  TextStyle,
  TextColor,
  TextAlign,
  FlexLayout,
  Spacing,
  Size,
  Background,
  Border,
  Shadow,
  Cursor,
  BoxBundle,
  ButtonBundle,
  EventsApi,
} from "@atlas/engine";

/**
 * Custom events for menu interactions
 */
class ResumeClickedEvent {
  constructor(public entity: Entity) {}
}

class SettingsClickedEvent {
  constructor(public entity: Entity) {}
}

class QuitClickedEvent {
  constructor(public entity: Entity) {}
}

class ButtonHoverEnterEvent {
  constructor(
    public entity: Entity,
    public buttonType?: string
  ) {}
}

class ButtonHoverExitEvent {
  constructor(
    public entity: Entity,
    public buttonType?: string
  ) {}
}

/**
 * UI Demo Plugin - Demonstrates the Atlas UI system with a game menu
 */
export class UiDemoPlugin implements EcsPlugin {
  build(app: App) {
    // Register custom events
    app
      .addEvent(ResumeClickedEvent)
      .addEvent(SettingsClickedEvent)
      .addEvent(QuitClickedEvent)
      .addEvent(ButtonHoverEnterEvent)
      .addEvent(ButtonHoverExitEvent);

    // Add UI plugin
    app.addPlugins(new UiPlugin());

    // Build the menu UI in startup
    app.addStartupSystems(({ commands }) => {
      this.buildMenuUI(commands);
    });

    // Handle events in update
    app.addUpdateSystems(({ commands, events }) => {
      this.handleMenuEvents(commands, events);
    });
  }

  private buildMenuUI(commands: Commands) {
    // Create root container
    const menuContainer = commands
      .spawnBundle(BoxBundle, {
        flexLayout: [
          {
            direction: "column",
            gap: 20,
            alignItems: "center",
            justifyContent: "center",
          },
        ],
        size: [
          {
            width: "400px",
            height: "100vh",
          },
        ],
        background: [
          {
            color: "rgba(20, 20, 30, 0.95)",
          },
        ],
        spacing: [
          {
            padding: { all: 40 },
          },
        ],
        border: [
          {
            rightWidth: 1,
            rightStyle: "solid",
            rightColor: "rgba(255, 255, 255, 0.1)",
          },
        ],
      })
      .insert(new UiRoot());

    // Create title
    commands
      .spawn(
        new UiNode(),
        new UiElement("h1"),
        new Text("GAME MENU"),
        new TextStyle({
          fontSize: 36,
          fontWeight: "bold",
          fontFamily: "Arial, sans-serif",
          letterSpacing: "2px",
        }),
        new TextColor({ color: "#ffffff" }),
        new TextAlign({ textAlign: "center" }),
        new Spacing({
          margin: { bottom: 40 },
        })
      )
      .withParent(menuContainer.id());

    // Resume button
    const resumeButton = this.createButton(
      commands,
      "RESUME",
      ResumeClickedEvent,
      "#4CAF50",
      "#45a049",
      "resume"
    );
    commands.entity(resumeButton).setParent(menuContainer.id());

    // Settings button
    const settingsButton = this.createButton(
      commands,
      "SETTINGS",
      SettingsClickedEvent,
      "#2196F3",
      "#0b7dda",
      "settings"
    );
    commands.entity(settingsButton).setParent(menuContainer.id());

    // Quit button
    const quitButton = this.createButton(
      commands,
      "QUIT",
      QuitClickedEvent,
      "#f44336",
      "#da190b",
      "quit"
    );
    commands.entity(quitButton).setParent(menuContainer.id());

    // Create footer text
    commands
      .spawn(
        new UiNode(),
        new UiElement("p"),
        new Text("Built with Atlas ECS UI System"),
        new TextStyle({
          fontSize: 12,
          fontFamily: "Arial, sans-serif",
        }),
        new TextColor({ color: "rgba(255, 255, 255, 0.5)" }),
        new TextAlign({ textAlign: "center" }),
        new Spacing({
          margin: { top: "auto" },
        })
      )
      .withParent(menuContainer.id());
  }

  private createButton(
    commands: Commands,
    label: string,
    eventClass: new (entity: Entity) => any,
    baseColor: string,
    hoverColor: string,
    buttonType: string
  ): Entity {
    return commands
      .spawn(
        new UiNode(),
        new UiElement("button"),
        new Interactive(),
        new OnClick(eventClass),
        new OnHoverEnter(ButtonHoverEnterEvent, buttonType),
        new OnHoverExit(ButtonHoverExitEvent, buttonType),
        new Text(label),
        new TextStyle({
          fontSize: 18,
          fontWeight: "600",
          fontFamily: "Arial, sans-serif",
          letterSpacing: "1px",
        }),
        new TextColor({ color: "#ffffff" }),
        new TextAlign({ textAlign: "center" }),
        new FlexLayout({
          justifyContent: "center",
          alignItems: "center",
        }),
        new Spacing({
          padding: {
            vertical: 15,
            horizontal: 40,
          },
        }),
        new Size({
          width: "100%",
          minHeight: 50,
        }),
        new Background({
          color: baseColor,
        }),
        new Border({
          width: 0,
          radius: 8,
        }),
        new Shadow({
          boxShadow: `0 4px 6px rgba(0, 0, 0, 0.3)`,
        }),
        new Cursor("pointer")
      )
      .id();
  }

  private handleMenuEvents(commands: Commands, events: EventsApi) {
    // Handle Resume click
    const resumeReader = events.reader(ResumeClickedEvent);
    for (const event of resumeReader.read()) {
      console.log("✅ Resume clicked!");
      console.log("   Entity:", event.entity);
      console.log("   Action: Resume the game");
    }

    // Handle Settings click
    const settingsReader = events.reader(SettingsClickedEvent);
    for (const event of settingsReader.read()) {
      console.log("⚙️ Settings clicked!");
      console.log("   Entity:", event.entity);
      console.log("   Action: Open settings menu");
    }

    // Handle Quit click
    const quitReader = events.reader(QuitClickedEvent);
    for (const event of quitReader.read()) {
      console.log("❌ Quit clicked!");
      console.log("   Entity:", event.entity);
      console.log("   Action: Exit the game");
    }

    // Handle hover enter
    const hoverEnterReader = events.reader(ButtonHoverEnterEvent);
    for (const event of hoverEnterReader.read()) {
      console.log(`🎯 Mouse entered ${event.buttonType} button`);

      // Update button appearance on hover
      const background = commands.tryGetComponent(event.entity, Background);
      if (background) {
        if (event.buttonType === "resume") {
          background.color = "#45a049";
        } else if (event.buttonType === "settings") {
          background.color = "#0b7dda";
        } else if (event.buttonType === "quit") {
          background.color = "#da190b";
        }
      }

      const shadow = commands.tryGetComponent(event.entity, Shadow);
      if (shadow) {
        shadow.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.4)";
      }
    }

    // Handle hover exit
    const hoverExitReader = events.reader(ButtonHoverExitEvent);
    for (const event of hoverExitReader.read()) {
      console.log(`👋 Mouse left ${event.buttonType} button`);

      // Restore button appearance
      const background = commands.tryGetComponent(event.entity, Background);
      if (background) {
        if (event.buttonType === "resume") {
          background.color = "#4CAF50";
        } else if (event.buttonType === "settings") {
          background.color = "#2196F3";
        } else if (event.buttonType === "quit") {
          background.color = "#f44336";
        }
      }

      const shadow = commands.tryGetComponent(event.entity, Shadow);
      if (shadow) {
        shadow.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.3)";
      }
    }
  }
}
