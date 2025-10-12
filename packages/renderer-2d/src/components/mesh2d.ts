import type { Handle } from "@atlas/core";

/**
 * Reference to a GPU mesh for 2D rendering
 */
export class Mesh2D {
  constructor(public mesh: Handle<any>) {}

  public static withHandle(mesh: Handle<any>): Mesh2D {
    return new Mesh2D(mesh);
  }
}

/**
 * Predefined mesh shapes
 */
export enum Mesh2DShape {
  Quad = "Quad",
  Circle = "Circle",
  // Add more shapes as needed
}
