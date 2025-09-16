import "./style.css";

import {
  App,
  Commands,
  SystemType,
  EventsApi,
  PerspectiveCamera,
  BoxGeometry,
  MeshNormalMaterial,
  Mesh,
  ThreeViewport,
  DefaultPlugin,
  sys,
  createSet,
} from "@repo/engine";

export class Comp1 {
  constructor(public x = 0) {}
}
export class Comp2 {
  constructor(public y = 0) {}
}
export class Comp3 {
  constructor(public z = 0) {}
}

class Transform {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0
  ) {}
}

class ThePlayer {}

class LevelUpEvent {
  constructor(public entityId: number) {}
}

function spawnPlayer({ commands }: { commands: Commands }) {
  const viewPort = commands.getResource(ThreeViewport);

  const pc = new PerspectiveCamera(70, viewPort.aspect, 0.01, 10);

  pc.position.z = 1;
  pc.position.y = 0.25;

  commands.spawn(pc);

  const geometry = new BoxGeometry(0.2, 0.2, 0.2);
  const material = new MeshNormalMaterial();

  const mesh = new Mesh(geometry, material);

  commands.spawn(mesh, new Transform(0, 0, 0), new ThePlayer());
}

function playerSystem({
  commands,
  events,
}: {
  commands: Commands;
  events: EventsApi;
}) {
  const [mesh, transform] = commands.find(Mesh, Transform, ThePlayer);
  mesh.position.x = transform.x;
  mesh.position.y = transform.y;
  mesh.position.z = transform.z;

  transform.x += 0.01;

  if (transform.x > 1) {
    transform.x = 0;
  }

  if (transform.x === 0.9900000000000007) {
    const w = events.writer(LevelUpEvent);
    w.send(new LevelUpEvent(123));
  }
}

function debugLevelups({ events }: { events: EventsApi }) {
  const r = events.reader(LevelUpEvent);
  for (const ev of r.read()) {
    console.log("Entity leveled up!", ev.entityId);
  }
}
async function main() {
  await App.create()
    .addPlugins(new DefaultPlugin())
    .addEvent(LevelUpEvent)
    .addSystems(SystemType.StartUp, spawnPlayer)
    .addSystems(
      SystemType.Update,
      createSet(
        "Gameplay",
        sys(playerSystem).label("move-player"),
        sys(debugLevelups).afterLabel("move-player")
      )
    )
    .run();

  console.log("App finished");
}

void main();
