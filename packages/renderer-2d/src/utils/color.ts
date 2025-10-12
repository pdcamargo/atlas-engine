/**
 * RGBA color representation
 */
export class Color {
  constructor(
    public r: number,
    public g: number,
    public b: number,
    public a: number = 1.0
  ) {}

  /**
   * Create color from RGB values (0-255)
   */
  public static rgb(r: number, g: number, b: number): Color {
    return new Color(r / 255, g / 255, b / 255, 1.0);
  }

  /**
   * Create color from RGBA values (0-255)
   */
  public static rgba(r: number, g: number, b: number, a: number): Color {
    return new Color(r / 255, g / 255, b / 255, a);
  }

  /**
   * Create color from normalized values (0-1)
   */
  public static rgbaNormalized(
    r: number,
    g: number,
    b: number,
    a: number
  ): Color {
    return new Color(r, g, b, a);
  }

  /**
   * Create color from hex string (#RRGGBB or #RRGGBBAA)
   */
  public static fromHex(hex: string): Color {
    const cleaned = hex.replace("#", "");
    const hasAlpha = cleaned.length === 8;

    const r = parseInt(cleaned.slice(0, 2), 16) / 255;
    const g = parseInt(cleaned.slice(2, 4), 16) / 255;
    const b = parseInt(cleaned.slice(4, 6), 16) / 255;
    const a = hasAlpha ? parseInt(cleaned.slice(6, 8), 16) / 255 : 1.0;

    return new Color(r, g, b, a);
  }

  /**
   * Predefined colors
   */
  public static readonly WHITE = new Color(1.0, 1.0, 1.0, 1.0);
  public static readonly BLACK = new Color(0.0, 0.0, 0.0, 1.0);
  public static readonly RED = new Color(1.0, 0.0, 0.0, 1.0);
  public static readonly GREEN = new Color(0.0, 1.0, 0.0, 1.0);
  public static readonly BLUE = new Color(0.0, 0.0, 1.0, 1.0);
  public static readonly YELLOW = new Color(1.0, 1.0, 0.0, 1.0);
  public static readonly CYAN = new Color(0.0, 1.0, 1.0, 1.0);
  public static readonly MAGENTA = new Color(1.0, 0.0, 1.0, 1.0);
  public static readonly TRANSPARENT = new Color(0.0, 0.0, 0.0, 0.0);

  /**
   * Convert to array [r, g, b, a]
   */
  public toArray(): [number, number, number, number] {
    return [this.r, this.g, this.b, this.a];
  }

  /**
   * Convert to Float32Array for GPU
   */
  public toFloat32Array(): Float32Array {
    return new Float32Array([this.r, this.g, this.b, this.a]);
  }

  /**
   * Convert to hex string
   */
  public toHex(): string {
    const r = Math.round(this.r * 255)
      .toString(16)
      .padStart(2, "0");
    const g = Math.round(this.g * 255)
      .toString(16)
      .padStart(2, "0");
    const b = Math.round(this.b * 255)
      .toString(16)
      .padStart(2, "0");
    const a = Math.round(this.a * 255)
      .toString(16)
      .padStart(2, "0");
    return `#${r}${g}${b}${a}`;
  }

  /**
   * Clone the color
   */
  public clone(): Color {
    return new Color(this.r, this.g, this.b, this.a);
  }

  /**
   * Linear interpolation between two colors
   */
  public static lerp(a: Color, b: Color, t: number): Color {
    return new Color(
      a.r + (b.r - a.r) * t,
      a.g + (b.g - a.g) * t,
      a.b + (b.b - a.b) * t,
      a.a + (b.a - a.a) * t
    );
  }
}
