export class GridIndicator {}

export class Character {}

export class Conveyor {
  constructor(
    public direction: "up" | "down" | "left" | "right",
    public speed: number
  ) {}
}
