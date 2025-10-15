import {
  App,
  EcsPlugin,
  FlexContainer,
  SystemFnArguments,
  Time,
  UiContainer,
} from "../..";

export class FpsDisplay {}
export class RootContainer {}

function updateFps({ commands }: SystemFnArguments) {
  const fps = commands.getResource(Time).fps;

  const [[, fpsText]] = commands.all(UiContainer);

  if (fpsText && fpsText.textContent !== `FPS: ${Math.ceil(fps).toFixed(0)}`) {
    fpsText.setTextContent(`FPS: ${Math.ceil(fps).toFixed(0)}`);
  }
}

export class DebugPlugin implements EcsPlugin {
  build(app: App) {
    app
      .addStartupSystems(({ commands }) => {
        const root = new FlexContainer();

        root
          .setPosition("absolute")
          .setRight(0)
          .setTop(0)
          .setPadding(12)
          .setGap(12)
          .setDirection("column");

        const fps = new UiContainer(root);

        fps.setBackgroundColor("black");
        fps.setColor("white");

        fps.setTextContent("FPS: 0").setColor("white");

        commands.spawn(FpsDisplay, fps);
        commands.spawn(RootContainer, root);
      })
      .addUpdateSystems(updateFps);
  }
}
