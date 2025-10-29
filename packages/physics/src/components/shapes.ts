/**
 * Collision shape definitions for physics bodies
 */

export interface Shape {
  /**
   * Calculate the area of this shape
   */
  area(): number;

  /**
   * Calculate the moment of inertia for this shape with unit density
   */
  momentOfInertia(): number;
}

/**
 * Circle collision shape
 */
export class CircleShape implements Shape {
  constructor(public radius: number) {}

  area(): number {
    return Math.PI * this.radius * this.radius;
  }

  momentOfInertia(): number {
    // I = (1/2) * m * r^2 for a circle (with unit mass)
    return 0.5 * this.radius * this.radius;
  }
}

/**
 * Rectangle collision shape (axis-aligned in local space)
 */
export class RectShape implements Shape {
  constructor(
    public width: number,
    public height: number
  ) {}

  get halfWidth(): number {
    return this.width / 2;
  }

  get halfHeight(): number {
    return this.height / 2;
  }

  area(): number {
    return this.width * this.height;
  }

  momentOfInertia(): number {
    // I = (1/12) * m * (w^2 + h^2) for a rectangle (with unit mass)
    return (1 / 12) * (this.width * this.width + this.height * this.height);
  }
}

/**
 * Capsule collision shape (rectangle with rounded ends)
 */
export class CapsuleShape implements Shape {
  constructor(
    public radius: number,
    public halfHeight: number
  ) {}

  area(): number {
    // Area of rectangle + two half circles
    const rectArea = this.radius * 2 * this.halfHeight * 2;
    const circleArea = Math.PI * this.radius * this.radius;
    return rectArea + circleArea;
  }

  momentOfInertia(): number {
    // Approximate as cylinder
    const height = this.halfHeight * 2;
    return (1 / 12) * (3 * this.radius * this.radius + height * height);
  }
}

/**
 * Polygon collision shape (convex only)
 * Maximum 8 vertices supported by GPU
 */
export class PolygonShape implements Shape {
  public readonly vertices: Array<{ x: number; y: number }>;

  constructor(vertices: Array<{ x: number; y: number }>) {
    if (vertices.length < 3) {
      throw new Error("Polygon must have at least 3 vertices");
    }
    if (vertices.length > 8) {
      throw new Error("Polygon cannot have more than 8 vertices (GPU limit)");
    }
    this.vertices = vertices;
  }

  area(): number {
    // Shoelace formula
    let area = 0;
    const n = this.vertices.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += this.vertices[i].x * this.vertices[j].y;
      area -= this.vertices[j].x * this.vertices[i].y;
    }
    return Math.abs(area) / 2;
  }

  momentOfInertia(): number {
    // Approximate as sum of triangles from centroid
    const centroid = this.getCentroid();
    let inertia = 0;
    const n = this.vertices.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const v1 = this.vertices[i];
      const v2 = this.vertices[j];

      // Triangle area
      const dx1 = v1.x - centroid.x;
      const dy1 = v1.y - centroid.y;
      const dx2 = v2.x - centroid.x;
      const dy2 = v2.y - centroid.y;

      const triangleArea = Math.abs(dx1 * dy2 - dx2 * dy1) / 2;

      // Distance from centroid
      const d1Sq = dx1 * dx1 + dy1 * dy1;
      const d2Sq = dx2 * dx2 + dy2 * dy2;
      const avgDistSq = (d1Sq + d2Sq) / 2;

      inertia += triangleArea * avgDistSq;
    }

    return inertia;
  }

  private getCentroid(): { x: number; y: number } {
    let cx = 0;
    let cy = 0;
    for (const v of this.vertices) {
      cx += v.x;
      cy += v.y;
    }
    return { x: cx / this.vertices.length, y: cy / this.vertices.length };
  }
}
