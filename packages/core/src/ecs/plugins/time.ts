export class Time {
  _last = 0;
  deltaTime = 0;
  fixedDelta = 1 / 60;
  elapsed = 0;

  public get fps() {
    return 1 / this.deltaTime;
  }
}

import type { EcsPlugin } from "../../plugin";
import { createSet, type App } from "../../index";
import { SystemType } from "../types";

export const TimeSet = Symbol("TimeSet");

export class TimePlugin implements EcsPlugin {
  name() {
    return "TimePlugin";
  }

  build(app: App) {
    app.setResource(new Time());

    // Update dynamic times in phases
    app.addSystems(
      SystemType.PreUpdate,
      ...createSet(TimeSet, ({ commands }) => {
        const time = commands.getResource(Time);
        // We don't have direct dt here; estimate using performance.now() inside loop if needed
        // The App loop currently doesn't pass dt; we can approximate by elapsed difference
        const now = performance.now() / 1000;
        const last = time._last ?? now;
        time.deltaTime = Math.max(0, now - last);
        time._last = now;
        time.elapsed += time.deltaTime;
      })
    );
  }
}
