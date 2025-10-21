import type { EasingFunction } from "../types";

/**
 * Collection of easing functions for animations
 * Each function takes a value t in [0, 1] and returns an eased value
 */

// Linear
export const linear: EasingFunction = (t: number) => t;

// Quadratic
export const easeInQuad: EasingFunction = (t: number) => t * t;

export const easeOutQuad: EasingFunction = (t: number) => t * (2 - t);

export const easeInOutQuad: EasingFunction = (t: number) =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// Cubic
export const easeInCubic: EasingFunction = (t: number) => t * t * t;

export const easeOutCubic: EasingFunction = (t: number) =>
  --t * t * t + 1;

export const easeInOutCubic: EasingFunction = (t: number) =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

// Quartic
export const easeInQuart: EasingFunction = (t: number) => t * t * t * t;

export const easeOutQuart: EasingFunction = (t: number) =>
  1 - --t * t * t * t;

export const easeInOutQuart: EasingFunction = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;

// Quintic
export const easeInQuint: EasingFunction = (t: number) => t * t * t * t * t;

export const easeOutQuint: EasingFunction = (t: number) =>
  1 + --t * t * t * t * t;

export const easeInOutQuint: EasingFunction = (t: number) =>
  t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;

// Sine
export const easeInSine: EasingFunction = (t: number) =>
  1 - Math.cos((t * Math.PI) / 2);

export const easeOutSine: EasingFunction = (t: number) =>
  Math.sin((t * Math.PI) / 2);

export const easeInOutSine: EasingFunction = (t: number) =>
  -(Math.cos(Math.PI * t) - 1) / 2;

// Exponential
export const easeInExpo: EasingFunction = (t: number) =>
  t === 0 ? 0 : Math.pow(2, 10 * (t - 1));

export const easeOutExpo: EasingFunction = (t: number) =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

export const easeInOutExpo: EasingFunction = (t: number) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
  return (2 - Math.pow(2, -20 * t + 10)) / 2;
};

// Circular
export const easeInCirc: EasingFunction = (t: number) =>
  1 - Math.sqrt(1 - t * t);

export const easeOutCirc: EasingFunction = (t: number) =>
  Math.sqrt(1 - --t * t);

export const easeInOutCirc: EasingFunction = (t: number) =>
  t < 0.5
    ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
    : (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2;

// Back
export const easeInBack: EasingFunction = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
};

export const easeOutBack: EasingFunction = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const easeInOutBack: EasingFunction = (t: number) => {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
};

// Elastic
export const easeInElastic: EasingFunction = (t: number) => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
      ? 1
      : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
};

export const easeOutElastic: EasingFunction = (t: number) => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

export const easeInOutElastic: EasingFunction = (t: number) => {
  const c5 = (2 * Math.PI) / 4.5;
  return t === 0
    ? 0
    : t === 1
      ? 1
      : t < 0.5
        ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
        : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
};

// Bounce
export const easeInBounce: EasingFunction = (t: number) => {
  return 1 - easeOutBounce(1 - t);
};

export const easeOutBounce: EasingFunction = (t: number) => {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

export const easeInOutBounce: EasingFunction = (t: number) =>
  t < 0.5
    ? (1 - easeOutBounce(1 - 2 * t)) / 2
    : (1 + easeOutBounce(2 * t - 1)) / 2;

/**
 * Easing namespace containing all easing functions
 */
export const Easing = {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,
} as const;
