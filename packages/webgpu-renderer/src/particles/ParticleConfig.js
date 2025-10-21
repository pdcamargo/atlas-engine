/**
 * Blend mode for particle rendering
 */
export var ParticleBlendMode;
(function (ParticleBlendMode) {
    ParticleBlendMode["Normal"] = "normal";
    ParticleBlendMode["Additive"] = "additive";
    ParticleBlendMode["Multiply"] = "multiply";
})(ParticleBlendMode || (ParticleBlendMode = {}));
/**
 * Emission shape types
 */
export var EmissionShape;
(function (EmissionShape) {
    EmissionShape["Point"] = "point";
    EmissionShape["Circle"] = "circle";
    EmissionShape["Rectangle"] = "rectangle";
    EmissionShape["Cone"] = "cone";
})(EmissionShape || (EmissionShape = {}));
/**
 * Normalize range config to always have min/max
 */
export function normalizeRange(value) {
    if (typeof value === "number") {
        return { min: value, max: value };
    }
    return value;
}
/**
 * Normalize vector3 range config
 */
export function normalizeVector3Range(value) {
    if ("min" in value && "max" in value) {
        return value;
    }
    const v = value;
    return { min: v, max: v };
}
/**
 * Normalize color range config
 */
export function normalizeColorRange(value) {
    if (Array.isArray(value)) {
        return { min: value, max: value };
    }
    return value;
}
