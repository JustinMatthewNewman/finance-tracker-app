// Shared color helpers for every chart in the app — one source of
// truth so no widget hardcodes a hex palette that could clash with the
// active ColorScheme (Ocean/Forest/Sunset/Grape) × light/dark, both applied
// at runtime via CSS custom properties by components/Utilities/DbThemeApplier.tsx.

// Categorical identity color, derived from the single --accent token via
// hue-rotation rather than a hardcoded hex palette, so it always matches
// whichever color scheme is active. Shared rather than per-widget so every
// chart draws from one rotation table instead of each keeping its own copy.
const SLICE_HUE_ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315];

// Fixed budget, never cycled — callers with more categories than this must
// fold the overflow into an "Other" bucket (see the dataviz color formula's
// non-negotiable: a 9th series is never a generated/repeated hue).
export const CATEGORICAL_HUE_COUNT = SLICE_HUE_ROTATIONS.length;

export interface SeriesColor {
  color: string;
  filter?: string;
}

// `index` must be < CATEGORICAL_HUE_COUNT — callers with more categories
// than that must bucket the overflow themselves (never cycle: see above).
export function getSeriesColor(index: number): SeriesColor {
  const rotation = SLICE_HUE_ROTATIONS[index % SLICE_HUE_ROTATIONS.length];
  return { color: "var(--accent)", filter: rotation === 0 ? undefined : `hue-rotate(${rotation}deg)` };
}

// Neutral slot for an "unassigned"/empty category — never takes a rotation
// slot, always reads as neutral regardless of scheme.
export const NEUTRAL_SERIES_COLOR: SeriesColor = { color: "var(--muted)" };

// Status colors (up/down/flat) are intentionally NOT derived from --accent —
// their meaning (good/bad) must stay constant no matter which color scheme
// is active, so they use HeroUI's own fixed --success/--danger tokens
// instead (see dataconnect/schema/schema.gql's comment on Theme: status
// colors are deliberately left out of the custom scheme system for this
// exact reason).
export type DeltaDirection = "up" | "down" | "flat";

export function deltaColorClass(direction: DeltaDirection): string {
  if (direction === "up") return "text-success";
  if (direction === "down") return "text-danger";
  return "text-foreground/50";
}

// Sequential (magnitude) ramp for the calendar heatmap: one hue (--accent),
// monotone lightness steps mixed toward --surface in OKLCH space (not sRGB)
// so the ramp is genuinely perceptually monotone, not just approximately so.
// --surface already differs between light/dark mode, so the "flip anchor in
// dark mode" rule from the dataviz color formula is satisfied automatically.
const SEQUENTIAL_STEPS = [20, 40, 60, 80, 100];

export function sequentialStepColor(step: number): string {
  const t = SEQUENTIAL_STEPS[Math.max(0, Math.min(step, SEQUENTIAL_STEPS.length - 1))];
  return `color-mix(in oklch, var(--accent) ${t}%, var(--surface))`;
}

export const SEQUENTIAL_STEP_COUNT = SEQUENTIAL_STEPS.length;

// ─── Resolving a series colour to real numbers, for WebGL ───────────────────
//
// WHY THIS EXISTS. Everything above hands a chart a CSS value — `var(--accent)`
// plus a `hue-rotate` filter — which is exactly right for SVG and HTML, where the
// browser resolves the token and applies the filter. WebGL can do neither: a
// three.js material needs three floats, and there is no CSS filter pipeline
// inside a canvas.
//
// So the 3D chart has to compute what the 2D charts merely declare. The whole
// point of the code below is that it computes the SAME answer: a legend swatch
// rendered as SVG and a bar rendered in WebGL have to be the same colour, or the
// legend is lying about which band is which.

/** The rotation, in degrees, applied to categorical slot `index`. */
export function seriesHueRotation(index: number): number {
  return SLICE_HUE_ROTATIONS[index % SLICE_HUE_ROTATIONS.length];
}

export type Rgb = { r: number; g: number; b: number };

/**
 * CSS's own hue-rotate matrix, not an HSL rotation.
 *
 * These two are NOT the same transform and substituting one for the other is
 * visibly wrong. `filter: hue-rotate()` is defined in the Filter Effects spec as
 * a fixed 3×3 matrix on linear-ish sRGB built from the luminance coefficients
 * (0.213, 0.715, 0.072) — it is an approximation that does not preserve
 * saturation or lightness. Rotating hue in HSL instead preserves both, and lands
 * somewhere else entirely for a saturated input.
 *
 * Since the SVG charts get the browser's version and the WebGL chart gets this
 * one, this has to BE the browser's version or the two disagree — the legend
 * beside the 3D chart would key a band to a colour the band does not have.
 *
 * Channels are 0-255 and clamped on the way out: the matrix is free to leave the
 * sRGB cube for a saturated input, and the browser clamps at exactly this point
 * too.
 */
export function cssHueRotate({ r, g, b }: Rgb, degrees: number): Rgb {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const m = [
    0.213 + cos * 0.787 - sin * 0.213,
    0.715 - cos * 0.715 - sin * 0.715,
    0.072 - cos * 0.072 + sin * 0.928,
    0.213 - cos * 0.213 + sin * 0.143,
    0.715 + cos * 0.285 + sin * 0.14,
    0.072 - cos * 0.072 - sin * 0.283,
    0.213 - cos * 0.213 - sin * 0.787,
    0.715 - cos * 0.715 + sin * 0.715,
    0.072 + cos * 0.928 + sin * 0.072,
  ];

  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return {
    r: clamp(r * m[0] + g * m[1] + b * m[2]),
    g: clamp(r * m[3] + g * m[4] + b * m[5]),
    b: clamp(r * m[6] + g * m[7] + b * m[8]),
  };
}

/**
 * Parses the `rgb()` / `rgba()` form a browser normalizes a computed colour to.
 *
 * Deliberately only that form, because the only caller feeds it
 * `getComputedStyle(el).color` — reading the custom property directly would
 * hand back whatever text the theme happens to store (a hex today, an `oklch()`
 * tomorrow), while bouncing it through a real element's `color` always
 * normalizes. Returns null rather than a guess when the shape is unfamiliar, so
 * a caller falls back to a neutral instead of drawing in black.
 */
export function parseRgbString(value: string): Rgb | null {
  const match = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(value);
  if (!match) return null;
  const [r, g, b] = [match[1], match[2], match[3]].map(Number);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b };
}

/** `Rgb` as the 0xRRGGBB integer three.js's Color takes. */
export function rgbToHexNumber({ r, g, b }: Rgb): number {
  const round = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (round(r) << 16) | (round(g) << 8) | round(b);
}

/**
 * Reads a CSS value as concrete channels, by asking the browser.
 *
 * The element is a real one in the tree, so the custom properties it inherits
 * are the ones actually in force — which is what makes this follow the active
 * ColorScheme and light/dark mode without knowing anything about either.
 */
export function readCssColor(el: Element, cssValue: string): Rgb | null {
  const probe = document.createElement("span");
  probe.style.color = cssValue;
  probe.style.display = "none";
  el.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  el.removeChild(probe);
  return parseRgbString(resolved);
}

// ─── A one-hue ordinal ramp, computed in OKLab ──────────────────────────────
//
// WHY THE STACKED CHART DOES NOT USE THE CATEGORICAL HUES ABOVE. It cannot. The
// rotations are a hue wheel around whichever accent the active ColorScheme
// supplies, and those accents were chosen to look right as a UI accent, not to
// be told apart from each other. Measured with the dataviz validator against all
// four seeded schemes in both modes, no slot count from two to eight clears the
// gates: adjacent colour-vision-deficiency separation lands around ΔE 2-3
// against a target of 8, and the normal-vision floor drops as low as 4.8 against
// a floor of 15 — so full-colour readers cannot reliably separate the pair
// either. The dark variants additionally sit above the lightness band (L ≈ 0.78)
// because the dark accents are light by design.
//
// Six touching bands in a stack is the worst case for that, so the stack uses a
// SEQUENTIAL RAMP instead: one hue, light to dark. A ramp is gated on lightness
// monotonicity rather than on pairwise hue separation, which is a test it passes
// by construction — and it is semantically right here, because the bands are
// ordered (ranked largest to smallest) and the ramp encodes that order.
//
// COMPUTED IN JS RATHER THAN DECLARED AS color-mix(), because the 3D chart needs
// real numbers for a WebGL material and the 2D chart has to match it exactly. A
// CSS `color-mix(in oklch, ...)` in one and a JS mix in the other would drift,
// and the legend would key a band to a shade the band does not have. Both call
// this.

type Oklab = { L: number; a: number; b: number };

const linearize = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const delinearize = (v: number) => {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, c * 255));
};

export function rgbToOklab({ r, g, b }: Rgb): Oklab {
  const lr = linearize(r);
  const lg = linearize(g);
  const lb = linearize(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

export function oklabToRgb({ L, a, b }: Oklab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    r: delinearize(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: delinearize(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: delinearize(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

/** Mixes two colours in OKLab. `t` of 0 is all `from`, 1 is all `to`. */
export function oklabMix(from: Rgb, to: Rgb, t: number): Rgb {
  const A = rgbToOklab(from);
  const B = rgbToOklab(to);
  const k = Math.max(0, Math.min(1, t));
  return oklabToRgb({
    L: A.L + (B.L - A.L) * k,
    a: A.a + (B.a - A.a) * k,
    b: A.b + (B.b - A.b) * k,
  });
}

/**
 * How far the ramp reaches past the accent at each end.
 *
 * TWO-ENDED, and that is what makes it pass. A ramp that only mixed the accent
 * toward the surface had nowhere to go: eight steps inside that span land about
 * ΔL 0.03 apart, which the validator rejects as indistinguishable steps, and its
 * lightest step came out at 1.6-1.9:1 against a light surface, under the 2:1
 * floor an ordinal ramp's faintest mark has to clear. Reaching toward the
 * FOREGROUND as well roughly doubles the usable lightness span, which fixes both.
 *
 * The two numbers are not symmetric on purpose: the foreground end can be pushed
 * further because it moves away from the surface (so contrast only improves),
 * while the surface end is the one that has to stay visible.
 *
 * These exact values were searched rather than chosen — 80 combinations of step
 * count and the two spans, validated against all four seeded ColorSchemes in
 * both modes. See RAMP_MAX_STEPS for what the search concluded.
 */
const RAMP_DARK_SPAN = 0.5;
const RAMP_LIGHT_SPAN = 0.3;

/**
 * The most bands a stacked chart may draw.
 *
 * FOUR, measured. It is the largest step count for which the ramp clears every
 * ordinal gate — monotone lightness, visible gaps between adjacent steps, and a
 * faint end that still reads against the surface — in all eight
 * ColorScheme × mode combinations this app ships. At five the adjacent steps
 * collapse below the ΔL floor in light mode.
 *
 * So the stacked chart shows three real categories and folds the rest into
 * "Other". The detail lives in the ranked lists beside it, which carry a text
 * label on every row and therefore need no colour separation at all.
 */
export const RAMP_MAX_STEPS = 4;

/**
 * `count` ordered steps of one hue, spanning foreground-ward to surface-ward.
 *
 * MOST PROMINENT FIRST: step 0 is whichever end has more contrast against the
 * surface, so the largest band in a stack is the one that reads strongest. That
 * is the direction, not the gate — the validator only asks that lightness move
 * monotonically, which it does either way.
 */
export function ordinalRamp(
  accent: Rgb,
  surface: Rgb,
  foreground: Rgb,
  count: number
): Rgb[] {
  if (count <= 0) return [];
  if (count === 1) return [accent];

  const towardForeground = rgbToOklab(oklabMix(accent, foreground, RAMP_DARK_SPAN));
  const towardSurface = rgbToOklab(oklabMix(accent, surface, RAMP_LIGHT_SPAN));
  const surfaceL = rgbToOklab(surface).L;
  // Whichever end is further from the surface in lightness is the prominent one.
  const [from, to] =
    Math.abs(towardForeground.L - surfaceL) >= Math.abs(towardSurface.L - surfaceL)
      ? [towardForeground, towardSurface]
      : [towardSurface, towardForeground];

  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    return oklabToRgb({
      L: from.L + (to.L - from.L) * t,
      a: from.a + (to.a - from.a) * t,
      b: from.b + (to.b - from.b) * t,
    });
  });
}

/** `Rgb` as a CSS string, for an SVG fill or an inline style. */
export function rgbToCss({ r, g, b }: Rgb): string {
  const round = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `rgb(${round(r)} ${round(g)} ${round(b)})`;
}
