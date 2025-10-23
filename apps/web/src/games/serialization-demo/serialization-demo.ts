import {
  App,
  DefaultPlugin,
  EcsPlugin,
  Transform,
  Parent,
  Children,
  SceneGraph,
  Sprite,
  Color,
  OrthographicCamera,
  MainCamera,
  Input,
  KeyCode,
  TextureFilter,
  AssetServer,
  ImageAsset,
  Serializable,
  SerializeProperty,
  SceneSerializer,
  type Handle,
} from "@atlas/engine";

import { TauriFileSystemAdapter } from "../../plugins/file-system";

// Custom serializable component for the demo
@Serializable()
class Health {
  @SerializeProperty()
  public current: number;

  @SerializeProperty()
  public max: number;

  constructor(current: number = 100, max: number = 100) {
    this.current = current;
    this.max = max;
  }

  public takeDamage(amount: number): void {
    this.current = Math.max(0, this.current - amount);
  }

  public heal(amount: number): void {
    this.current = Math.min(this.max, this.current + amount);
  }

  public get percentage(): number {
    return (this.current / this.max) * 100;
  }
}

@Serializable()
class PlayerData {
  @SerializeProperty()
  public name: string;

  @SerializeProperty()
  public level: number;

  @SerializeProperty()
  public score: number;

  constructor(name: string = "Player", level: number = 1, score: number = 0) {
    this.name = name;
    this.level = level;
    this.score = score;
  }

  public levelUp(): void {
    this.level++;
    this.score += 100;
  }
}

@Serializable()
class SpriteData {
  @SerializeProperty({ serializer: "handle", optional: true })
  public texture: Handle<ImageAsset> | null;

  @SerializeProperty()
  public tint: Color;

  constructor(
    texture: Handle<ImageAsset> | null = null,
    tint: Color = Color.white()
  ) {
    this.texture = texture;
    this.tint = tint;
  }
}

const json = JSON.stringify({
  metadata: {},
  entities: [
    {
      id: 0,
      components: [
        {
          type: "Health",
          data: {
            __type: "Health",
            current: 80,
            max: 100,
          },
        },
        {
          type: "PlayerData",
          data: {
            __type: "PlayerData",
            name: "Hero",
            level: 5,
            score: 500,
          },
        },
        {
          type: "Transform",
          data: {
            position: {
              x: 100,
              y: 200,
            },
            rotation: 0,
            scale: {
              x: 1,
              y: 1,
            },
          },
        },
      ],
    },
  ],
  rootEntities: [0],
});

class RandomClass {
  name = "name";
}

export class SerializationDemoPlugin implements EcsPlugin {
  build(app: App) {
    // Serializers are now auto-registered by App constructor
    // World now has saveScene/spawnScene methods built-in
    app
      .addPlugins(
        new DefaultPlugin({
          fileSystemAdapter: new TauriFileSystemAdapter(),
          canvas: document.querySelector<HTMLCanvasElement>("canvas"),
        })
      )
      .addStartupSystems(({ commands }) => {
        const newScene = SceneSerializer.fromJSON(json);
        const newPlayer = commands.spawnScene(newScene);
        commands.spawnScene(newScene);

        console.log(newScene);
        console.log(newPlayer);

        commands.debugWorld();
        console.log(commands.find(PlayerData, Health, Transform));

        const newPlayer2 = commands.spawn(
          new PlayerData("Player 2"),
          new Health(100, 100),
          new Transform({ x: 200, y: 200 }),
          new RandomClass()
        );

        const savedScene = commands.saveScene([newPlayer2.id()]);
        const savedSceneJson = SceneSerializer.toJSON(savedScene, true);

        console.log(savedSceneJson);

        console.log(commands.find(PlayerData, Health, Transform));

        commands.debugWorld();
      });
  }
}
