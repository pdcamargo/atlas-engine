import { type App, type EcsPlugin } from "../..";

export class Viewport {
  constructor(
    public readonly container: HTMLElement,
    public readonly canvas: HTMLCanvasElement
  ) {}

  public get width(): number {
    return this.container.clientWidth;
  }

  public get height(): number {
    return this.container.clientHeight;
  }
}

export type ViewportOptions = {
  container?: HTMLElement | null;
  canvas?: HTMLCanvasElement | null;
};

export class ViewportPlugin implements EcsPlugin {
  constructor(public readonly options?: ViewportOptions) {}

  build(app: App) {
    const canvas = this.options?.canvas ?? document.createElement("canvas");
    const container = this.options?.container ?? document.body;

    if (!container.contains(canvas)) {
      container.appendChild(canvas);

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    app.setResource(new Viewport(container, canvas));
  }
}
