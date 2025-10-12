import { Input, KeyCode, QueryBuilder, sys, Velocity } from "@atlas/core";
import { Character } from "../components/flags";

const characterQuery = new QueryBuilder(Velocity, Character);

export const movePlayer = sys(({ commands }) => {
  const input = commands.getResource(Input);

  commands.query(characterQuery).forEach((_, velocity) => {
    const linvel: { x: number; y: number } = { x: 0, y: 0 };

    if (input.pressed(KeyCode.ArrowDown)) {
      linvel.y = 1;
    }
    if (input.pressed(KeyCode.ArrowUp)) {
      linvel.y = -1;
    }
    if (input.pressed(KeyCode.ArrowLeft)) {
      linvel.x = -1;
    }
    if (input.pressed(KeyCode.ArrowRight)) {
      linvel.x = 1;
    }

    velocity.linvel = {
      x: linvel.x * 100,
      y: linvel.y * 100,
    };
  });
});
