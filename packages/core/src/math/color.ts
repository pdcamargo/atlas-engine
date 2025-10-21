export interface ColorLike {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export class Color {
  private _data: Float32Array;
  private _onChange?: () => void;

  constructor(r: number = 1, g: number = 1, b: number = 1, a: number = 1) {
    this._data = new Float32Array(4);
    this._data[0] = Math.max(0, Math.min(1, r));
    this._data[1] = Math.max(0, Math.min(1, g));
    this._data[2] = Math.max(0, Math.min(1, b));
    this._data[3] = Math.max(0, Math.min(1, a));
  }

  /**
   * Set a callback that will be called whenever this color changes
   */
  public setOnChange(callback: (() => void) | undefined): void {
    this._onChange = callback;
  }

  get r(): number {
    return this._data[0];
  }

  set r(value: number) {
    this._data[0] = Math.max(0, Math.min(1, value));
    this._onChange?.();
  }

  get g(): number {
    return this._data[1];
  }

  set g(value: number) {
    this._data[1] = Math.max(0, Math.min(1, value));
    this._onChange?.();
  }

  get b(): number {
    return this._data[2];
  }

  set b(value: number) {
    this._data[2] = Math.max(0, Math.min(1, value));
    this._onChange?.();
  }

  get a(): number {
    return this._data[3];
  }

  set a(value: number) {
    this._data[3] = Math.max(0, Math.min(1, value));
    this._onChange?.();
  }

  get data(): Float32Array {
    return this._data;
  }

  // Instance methods
  copyFrom(other: Color | ColorLike): Color {
    if (other instanceof Color) {
      this._data.set(other._data);
    } else {
      this._data[0] = Math.max(0, Math.min(1, other.r));
      this._data[1] = Math.max(0, Math.min(1, other.g));
      this._data[2] = Math.max(0, Math.min(1, other.b));
      this._data[3] = Math.max(0, Math.min(1, other.a ?? 1));
    }
    return this;
  }

  clone(): Color {
    return new Color(this.r, this.g, this.b, this.a);
  }

  set(r: number, g: number, b: number, a: number = 1): Color {
    this._data[0] = Math.max(0, Math.min(1, r));
    this._data[1] = Math.max(0, Math.min(1, g));
    this._data[2] = Math.max(0, Math.min(1, b));
    this._data[3] = Math.max(0, Math.min(1, a));
    this._onChange?.();
    return this;
  }

  add(other: Color | ColorLike): Color {
    if (other instanceof Color) {
      this._data[0] = Math.max(0, Math.min(1, this._data[0] + other._data[0]));
      this._data[1] = Math.max(0, Math.min(1, this._data[1] + other._data[1]));
      this._data[2] = Math.max(0, Math.min(1, this._data[2] + other._data[2]));
      this._data[3] = Math.max(0, Math.min(1, this._data[3] + other._data[3]));
    } else {
      this._data[0] = Math.max(0, Math.min(1, this._data[0] + other.r));
      this._data[1] = Math.max(0, Math.min(1, this._data[1] + other.g));
      this._data[2] = Math.max(0, Math.min(1, this._data[2] + other.b));
      this._data[3] = Math.max(0, Math.min(1, this._data[3] + (other.a ?? 1)));
    }
    return this;
  }

  subtract(other: Color | ColorLike): Color {
    if (other instanceof Color) {
      this._data[0] = Math.max(0, Math.min(1, this._data[0] - other._data[0]));
      this._data[1] = Math.max(0, Math.min(1, this._data[1] - other._data[1]));
      this._data[2] = Math.max(0, Math.min(1, this._data[2] - other._data[2]));
      this._data[3] = Math.max(0, Math.min(1, this._data[3] - other._data[3]));
    } else {
      this._data[0] = Math.max(0, Math.min(1, this._data[0] - other.r));
      this._data[1] = Math.max(0, Math.min(1, this._data[1] - other.g));
      this._data[2] = Math.max(0, Math.min(1, this._data[2] - other.b));
      this._data[3] = Math.max(0, Math.min(1, this._data[3] - (other.a ?? 1)));
    }
    return this;
  }

  multiply(scalar: number): Color {
    this._data[0] = Math.max(0, Math.min(1, this._data[0] * scalar));
    this._data[1] = Math.max(0, Math.min(1, this._data[1] * scalar));
    this._data[2] = Math.max(0, Math.min(1, this._data[2] * scalar));
    this._data[3] = Math.max(0, Math.min(1, this._data[3] * scalar));
    return this;
  }

  multiplyColor(other: Color | ColorLike): Color {
    if (other instanceof Color) {
      this._data[0] = Math.max(0, Math.min(1, this._data[0] * other._data[0]));
      this._data[1] = Math.max(0, Math.min(1, this._data[1] * other._data[1]));
      this._data[2] = Math.max(0, Math.min(1, this._data[2] * other._data[2]));
      this._data[3] = Math.max(0, Math.min(1, this._data[3] * other._data[3]));
    } else {
      this._data[0] = Math.max(0, Math.min(1, this._data[0] * other.r));
      this._data[1] = Math.max(0, Math.min(1, this._data[1] * other.g));
      this._data[2] = Math.max(0, Math.min(1, this._data[2] * other.b));
      this._data[3] = Math.max(0, Math.min(1, this._data[3] * (other.a ?? 1)));
    }
    return this;
  }

  lerp(other: Color | ColorLike, t: number): Color {
    const clampedT = Math.max(0, Math.min(1, t));
    if (other instanceof Color) {
      this._data[0] =
        this._data[0] + (other._data[0] - this._data[0]) * clampedT;
      this._data[1] =
        this._data[1] + (other._data[1] - this._data[1]) * clampedT;
      this._data[2] =
        this._data[2] + (other._data[2] - this._data[2]) * clampedT;
      this._data[3] =
        this._data[3] + (other._data[3] - this._data[3]) * clampedT;
    } else {
      this._data[0] = this._data[0] + (other.r - this._data[0]) * clampedT;
      this._data[1] = this._data[1] + (other.g - this._data[1]) * clampedT;
      this._data[2] = this._data[2] + (other.b - this._data[2]) * clampedT;
      this._data[3] =
        this._data[3] + ((other.a ?? 1) - this._data[3]) * clampedT;
    }
    return this;
  }

  equals(other: Color | ColorLike, epsilon: number = 0.0001): boolean {
    if (other instanceof Color) {
      return (
        Math.abs(this._data[0] - other._data[0]) < epsilon &&
        Math.abs(this._data[1] - other._data[1]) < epsilon &&
        Math.abs(this._data[2] - other._data[2]) < epsilon &&
        Math.abs(this._data[3] - other._data[3]) < epsilon
      );
    }
    return (
      Math.abs(this.r - other.r) < epsilon &&
      Math.abs(this.g - other.g) < epsilon &&
      Math.abs(this.b - other.b) < epsilon &&
      Math.abs(this.a - (other.a ?? 1)) < epsilon
    );
  }

  toString(): string {
    return `Color(${this.r.toFixed(3)}, ${this.g.toFixed(3)}, ${this.b.toFixed(3)}, ${this.a.toFixed(3)})`;
  }

  toArray(): [number, number, number, number] {
    return [this.r, this.g, this.b, this.a];
  }

  toObject(): ColorLike {
    return { r: this.r, g: this.g, b: this.b, a: this.a };
  }

  toHex(): string {
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

  toRgb(): string {
    const r = Math.round(this.r * 255);
    const g = Math.round(this.g * 255);
    const b = Math.round(this.b * 255);
    return `rgb(${r}, ${g}, ${b})`;
  }

  toRgba(): string {
    const r = Math.round(this.r * 255);
    const g = Math.round(this.g * 255);
    const b = Math.round(this.b * 255);
    const a = this.a.toFixed(3);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // Static methods
  static white(): Color {
    return new Color(1, 1, 1, 1);
  }

  static black(): Color {
    return new Color(0, 0, 0, 1);
  }

  static red(): Color {
    return new Color(1, 0, 0, 1);
  }

  static green(): Color {
    return new Color(0, 1, 0, 1);
  }

  static blue(): Color {
    return new Color(0, 0, 1, 1);
  }

  static yellow(): Color {
    return new Color(1, 1, 0, 1);
  }

  static cyan(): Color {
    return new Color(0, 1, 1, 1);
  }

  static magenta(): Color {
    return new Color(1, 0, 1, 1);
  }

  static transparent(): Color {
    return new Color(0, 0, 0, 0);
  }

  static fromArray(array: number[]): Color {
    return new Color(
      array[0] || 0,
      array[1] || 0,
      array[2] || 0,
      array[3] ?? 1
    );
  }

  static fromObject(obj: ColorLike): Color {
    return new Color(obj.r, obj.g, obj.b, obj.a ?? 1);
  }

  static fromHex(hex: string): Color {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
    const b = parseInt(cleanHex.substr(4, 2), 16) / 255;
    const a =
      cleanHex.length >= 8 ? parseInt(cleanHex.substr(6, 2), 16) / 255 : 1;
    return new Color(r, g, b, a);
  }

  static fromRgb(rgb: string): Color {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) throw new Error("Invalid RGB format");
    const r = parseInt(match[1]) / 255;
    const g = parseInt(match[2]) / 255;
    const b = parseInt(match[3]) / 255;
    return new Color(r, g, b, 1);
  }

  static fromRgba(rgba: string): Color {
    const match = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (!match) throw new Error("Invalid RGBA format");
    const r = parseInt(match[1]) / 255;
    const g = parseInt(match[2]) / 255;
    const b = parseInt(match[3]) / 255;
    const a = parseFloat(match[4]);
    return new Color(r, g, b, a);
  }

  static add(a: Color | ColorLike, b: Color | ColorLike): Color {
    const result = new Color();
    if (a instanceof Color && b instanceof Color) {
      result._data[0] = Math.max(0, Math.min(1, a._data[0] + b._data[0]));
      result._data[1] = Math.max(0, Math.min(1, a._data[1] + b._data[1]));
      result._data[2] = Math.max(0, Math.min(1, a._data[2] + b._data[2]));
      result._data[3] = Math.max(0, Math.min(1, a._data[3] + b._data[3]));
    } else {
      const ar = a instanceof Color ? a.r : a.r;
      const ag = a instanceof Color ? a.g : a.g;
      const ab = a instanceof Color ? a.b : a.b;
      const aa = a instanceof Color ? a.a : a.a ?? 1;
      const br = b instanceof Color ? b.r : b.r;
      const bg = b instanceof Color ? b.g : b.g;
      const bb = b instanceof Color ? b.b : b.b;
      const ba = b instanceof Color ? b.a : b.a ?? 1;
      result.set(
        Math.max(0, Math.min(1, ar + br)),
        Math.max(0, Math.min(1, ag + bg)),
        Math.max(0, Math.min(1, ab + bb)),
        Math.max(0, Math.min(1, aa + ba))
      );
    }
    return result;
  }

  static subtract(a: Color | ColorLike, b: Color | ColorLike): Color {
    const result = new Color();
    if (a instanceof Color && b instanceof Color) {
      result._data[0] = Math.max(0, Math.min(1, a._data[0] - b._data[0]));
      result._data[1] = Math.max(0, Math.min(1, a._data[1] - b._data[1]));
      result._data[2] = Math.max(0, Math.min(1, a._data[2] - b._data[2]));
      result._data[3] = Math.max(0, Math.min(1, a._data[3] - b._data[3]));
    } else {
      const ar = a instanceof Color ? a.r : a.r;
      const ag = a instanceof Color ? a.g : a.g;
      const ab = a instanceof Color ? a.b : a.b;
      const aa = a instanceof Color ? a.a : a.a ?? 1;
      const br = b instanceof Color ? b.r : b.r;
      const bg = b instanceof Color ? b.g : b.g;
      const bb = b instanceof Color ? b.b : b.b;
      const ba = b instanceof Color ? b.a : b.a ?? 1;
      result.set(
        Math.max(0, Math.min(1, ar - br)),
        Math.max(0, Math.min(1, ag - bg)),
        Math.max(0, Math.min(1, ab - bb)),
        Math.max(0, Math.min(1, aa - ba))
      );
    }
    return result;
  }

  static multiply(a: Color | ColorLike, scalar: number): Color {
    const result = new Color();
    if (a instanceof Color) {
      result._data[0] = Math.max(0, Math.min(1, a._data[0] * scalar));
      result._data[1] = Math.max(0, Math.min(1, a._data[1] * scalar));
      result._data[2] = Math.max(0, Math.min(1, a._data[2] * scalar));
      result._data[3] = Math.max(0, Math.min(1, a._data[3] * scalar));
    } else {
      result.set(
        Math.max(0, Math.min(1, a.r * scalar)),
        Math.max(0, Math.min(1, a.g * scalar)),
        Math.max(0, Math.min(1, a.b * scalar)),
        Math.max(0, Math.min(1, (a.a ?? 1) * scalar))
      );
    }
    return result;
  }

  static multiplyColor(a: Color | ColorLike, b: Color | ColorLike): Color {
    const result = new Color();
    if (a instanceof Color && b instanceof Color) {
      result._data[0] = Math.max(0, Math.min(1, a._data[0] * b._data[0]));
      result._data[1] = Math.max(0, Math.min(1, a._data[1] * b._data[1]));
      result._data[2] = Math.max(0, Math.min(1, a._data[2] * b._data[2]));
      result._data[3] = Math.max(0, Math.min(1, a._data[3] * b._data[3]));
    } else {
      const ar = a instanceof Color ? a.r : a.r;
      const ag = a instanceof Color ? a.g : a.g;
      const ab = a instanceof Color ? a.b : a.b;
      const aa = a instanceof Color ? a.a : a.a ?? 1;
      const br = b instanceof Color ? b.r : b.r;
      const bg = b instanceof Color ? b.g : b.g;
      const bb = b instanceof Color ? b.b : b.b;
      const ba = b instanceof Color ? b.a : b.a ?? 1;
      result.set(
        Math.max(0, Math.min(1, ar * br)),
        Math.max(0, Math.min(1, ag * bg)),
        Math.max(0, Math.min(1, ab * bb)),
        Math.max(0, Math.min(1, aa * ba))
      );
    }
    return result;
  }

  static lerp(a: Color | ColorLike, b: Color | ColorLike, t: number): Color {
    const result = new Color();
    const clampedT = Math.max(0, Math.min(1, t));
    if (a instanceof Color && b instanceof Color) {
      result._data[0] = a._data[0] + (b._data[0] - a._data[0]) * clampedT;
      result._data[1] = a._data[1] + (b._data[1] - a._data[1]) * clampedT;
      result._data[2] = a._data[2] + (b._data[2] - a._data[2]) * clampedT;
      result._data[3] = a._data[3] + (b._data[3] - a._data[3]) * clampedT;
    } else {
      const ar = a instanceof Color ? a.r : a.r;
      const ag = a instanceof Color ? a.g : a.g;
      const ab = a instanceof Color ? a.b : a.b;
      const aa = a instanceof Color ? a.a : a.a ?? 1;
      const br = b instanceof Color ? b.r : b.r;
      const bg = b instanceof Color ? b.g : b.g;
      const bb = b instanceof Color ? b.b : b.b;
      const ba = b instanceof Color ? b.a : b.a ?? 1;
      result.set(
        ar + (br - ar) * clampedT,
        ag + (bg - ag) * clampedT,
        ab + (bb - ab) * clampedT,
        aa + (ba - aa) * clampedT
      );
    }
    return result;
  }

  static equals(
    a: Color | ColorLike,
    b: Color | ColorLike,
    epsilon: number = 0.0001
  ): boolean {
    if (a instanceof Color && b instanceof Color) {
      return (
        Math.abs(a._data[0] - b._data[0]) < epsilon &&
        Math.abs(a._data[1] - b._data[1]) < epsilon &&
        Math.abs(a._data[2] - b._data[2]) < epsilon &&
        Math.abs(a._data[3] - b._data[3]) < epsilon
      );
    }
    const ar = a instanceof Color ? a.r : a.r;
    const ag = a instanceof Color ? a.g : a.g;
    const ab = a instanceof Color ? a.b : a.b;
    const aa = a instanceof Color ? a.a : a.a ?? 1;
    const br = b instanceof Color ? b.r : b.r;
    const bg = b instanceof Color ? b.g : b.g;
    const bb = b instanceof Color ? b.b : b.b;
    const ba = b instanceof Color ? b.a : b.a ?? 1;
    return (
      Math.abs(ar - br) < epsilon &&
      Math.abs(ag - bg) < epsilon &&
      Math.abs(ab - bb) < epsilon &&
      Math.abs(aa - ba) < epsilon
    );
  }
}
