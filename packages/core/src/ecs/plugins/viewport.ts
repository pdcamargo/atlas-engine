import { type App, type EcsPlugin } from "../..";

export class Viewport {
  constructor(
    public readonly container: HTMLElement,
    public readonly canvas: HTMLCanvasElement
  ) {}

  public get width(): number {
    return this.container.clientWidth * this.dpr;
  }

  public get height(): number {
    return this.container.clientHeight * this.dpr;
  }

  public get aspectRatio(): number {
    return this.width / this.height;
  }

  public get dpr(): number {
    return window.devicePixelRatio || 1;
  }
}

export type ViewportOptions = {
  container?: HTMLElement | null;
  canvas?: HTMLCanvasElement | null;
};

export class ViewportResizeEvent {
  constructor(
    public readonly width: number,
    public readonly height: number
  ) {}
}

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

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        app.events
          .writer(ViewportResizeEvent)
          .send(
            new ViewportResizeEvent(
              entry.contentRect.width,
              entry.contentRect.height
            )
          );
      }
    });
    resizeObserver.observe(container);

    app.setResource(new Viewport(container, canvas));
    app.addEvent(ViewportResizeEvent);
  }
}
