import { SceneGraph } from "../resources";
import { Viewport } from "../../viewport";
import { Transform } from "../../../components";
export class Camera2D {
  zoom = 1;

  target?: Transform;

  #transform: Transform = new Transform();
  #followLerp = 0.2;

  constructor(public readonly viewport: Viewport) {}

  public get transform() {
    return this.#transform;
  }

  public set followLerp(value: number) {
    this.#followLerp = Math.max(0, Math.min(1, value));
  }

  public get followLerp() {
    return this.#followLerp;
  }

  public render(sceneGraph: SceneGraph) {
    // Follow target with simple exponential smoothing (lerp)
    if (this.target) {
      const currentX = this.#transform.position.x;
      const currentY = this.#transform.position.y;
      const targetX = this.target.position.x;
      const targetY = this.target.position.y;

      const t = this.#followLerp;
      const nextX = currentX + (targetX - currentX) * t;
      const nextY = currentY + (targetY - currentY) * t;
      this.#transform.position.set(nextX, nextY);
    }

    const zoom = Math.max(0.0001, this.zoom);

    // Apply camera to scene graph: center camera position in viewport
    const cx = this.#transform.position.x;
    const cy = this.#transform.position.y;

    const stage = sceneGraph.stage;
    const root = sceneGraph.root;

    // Reset stage to identity (stage is the ROOT root)
    stage.position.set(0, 0);
    stage.scale.set(1, 1);

    // Move and scale the world root where content is added
    root.scale.set(zoom, zoom);
    root.position.set(
      this.viewport.width / 2 - cx * zoom,
      this.viewport.height / 2 - cy * zoom
    );
  }
}
