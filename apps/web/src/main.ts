import "./style.css";

import {
  App,
  Commands,
  EventsApi,
  PerspectiveCamera,
  BoxGeometry,
  MeshNormalMaterial,
  Mesh,
  ThreeViewport,
  DefaultPlugin,
  sys,
  createSet,
  MeshBasicMaterial,
  Color,
  AssetServer,
  MouseMotionEvent,
  Time,
  Assets,
  AudioSink,
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
  const assetServer = commands.getResource(AssetServer);

  const [, charcterMesh] = assetServer.loadGLTF(
    "/character/scene.gltf#character"
  );

  commands.spawn(charcterMesh, new Transform(0, 0, 0));

  const viewPort = commands.getResource(ThreeViewport);

  const pc = new PerspectiveCamera(70, viewPort.aspect, 0.01, 10);

  pc.position.z = 1;
  pc.position.y = 0.25;

  commands.spawn(pc);

  const geometry = new BoxGeometry(0.2, 0.2, 0.2);
  const material = new MeshNormalMaterial();

  const mesh = new Mesh(geometry, material);

  commands.spawn(mesh, new Transform(0, 0, 0), new ThePlayer());

  const random = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  for (let i = 0; i < 100; i++) {
    const mat = new MeshBasicMaterial({
      color: new Color(random(0, 1), random(0, 1), random(0, 1)),
    });

    const ett = commands.spawn(
      new Mesh(geometry, mat),
      new Transform(random(-1, 1), random(-1, 1), random(-1, 1))
    );

    const msh = commands.getComponent(ett, Mesh);
    const trn = commands.getComponent(ett, Transform);
    msh.position.x = trn.x;
    msh.position.y = trn.y;
    msh.position.z = trn.z;
  }
}

function playerSystem({
  commands,
  events,
}: {
  commands: Commands;
  events: EventsApi;
}) {
  const reader = events.reader(MouseMotionEvent);
  const time = commands.getResource(Time);

  const [mesh, transform] = commands.find(Mesh, Transform, ThePlayer);
  mesh.position.x = transform.x;
  mesh.position.y = transform.y;
  mesh.position.z = transform.z;

  const [res] = reader.read();

  if (res) {
    transform.x += 1 * time.deltaTime;
  }

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

function spawnSound({ commands }: { commands: Commands }) {
  const assetServer = commands.getResource(AssetServer);
  const assets = commands.getResource(Assets);
  // const audioServer = commands.getResource(AudioServer);
  const [handle] = assetServer.loadSound("/level-up.mp3");

  commands.spawn(new AudioSink(assets.get<Howl>(handle)));
}

function playSound({ commands }: { commands: Commands }) {
  const [audioSink] = commands.find(AudioSink);

  if (audioSink.isReady() && audioSink.getPlayCount() === 0) {
    audioSink.play();
  }
}

async function main() {
  await App.create()
    .addPlugins(new DefaultPlugin())
    .addEvent(LevelUpEvent)
    .addStartupSystems(spawnPlayer, spawnSound)
    .addUpdateSystems(
      createSet(
        "Gameplay",
        sys(playerSystem).label("move-player"),
        sys(debugLevelups).afterLabel("move-player"),
        sys(playSound).afterLabel("move-player")
      )
    )
    .run();

  console.log("App finished");
}

void main();
