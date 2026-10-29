import { describe, expect, it } from "vitest";
import {
  CATEGORICAL_HUE_COUNT,
  cssHueRotate,
  oklabMix,
  oklabToRgb,
  ordinalRamp,
  RAMP_MAX_STEPS,
  parseRgbString,
  rgbToHexNumber,
  rgbToOklab,
  seriesHueRotation,
} from "./chartColor";

describe("cssHueRotate", () => {
  // These matter because the SVG charts get the BROWSER's hue-rotate and the
  // WebGL chart gets this function. If the two disagree, the legend beside the
  // 3D chart keys a band to a colour the band does not have.
  it("is the identity at 0 degrees", () => {
    const c = { r: 8, g: 145, b: 178 };
    const out = cssHueRotate(c, 0);
    expect(out.r).toBeCloseTo(c.r, 6);
    expect(out.g).toBeCloseTo(c.g, 6);
    expect(out.b).toBeCloseTo(c.b, 6);
  });

  it("is the identity at a full turn", () => {
    const c = { r: 8, g: 145, b: 178 };
    const out = cssHueRotate(c, 360);
    expect(out.r).toBeCloseTo(c.r, 4);
    expect(out.g).toBeCloseTo(c.g, 4);
    expect(out.b).toBeCloseTo(c.b, 4);
  });

  it("leaves a neutral grey almost unmoved, as the spec matrix does", () => {
    // Every row of the matrix sums to 1, so an equal-channel input is a fixed
    // point at any angle. A good check that the coefficients are not transposed.
    for (const deg of [45, 90, 180, 270]) {
      const out = cssHueRotate({ r: 128, g: 128, b: 128 }, deg);
      expect(out.r).toBeCloseTo(128, 4);
      expect(out.g).toBeCloseTo(128, 4);
      expect(out.b).toBeCloseTo(128, 4);
    }
  });

  it("actually moves a saturated colour", () => {
    const out = cssHueRotate({ r: 8, g: 145, b: 178 }, 90);
    expect(Math.abs(out.r - 8) + Math.abs(out.g - 145) + Math.abs(out.b - 178)).toBeGreaterThan(30);
  });

  it("is NOT an HSL rotation — saturated input changes lightness", () => {
    // Documents the thing most likely to be 'simplified' later. The CSS matrix
    // does not preserve lightness; swapping in an HSL rotation would land
    // somewhere else and silently desynchronise the 3D chart from its legend.
    const input = { r: 255, g: 0, b: 0 };
    const out = cssHueRotate(input, 120);
    const lum = (c: { r: number; g: number; b: number }) => 0.213 * c.r + 0.715 * c.g + 0.072 * c.b;
    // An HSL rotation of pure red by 120deg gives pure green, whose luminance is
    // far higher. The CSS matrix roughly preserves luminance instead.
    expect(lum(out)).toBeLessThan(lum({ r: 0, g: 255, b: 0 }) * 0.75);
  });

  it("clamps back into the sRGB cube, as the browser does", () => {
    for (const deg of [45, 135, 225, 315]) {
      const out = cssHueRotate({ r: 255, g: 0, b: 0 }, deg);
      for (const channel of [out.r, out.g, out.b]) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
    }
  });
});

describe("seriesHueRotation", () => {
  it("gives slot 0 no rotation, so the first series is the accent itself", () => {
    expect(seriesHueRotation(0)).toBe(0);
  });

  it("gives every slot in the budget a distinct rotation", () => {
    const rotations = Array.from({ length: CATEGORICAL_HUE_COUNT }, (_, i) => seriesHueRotation(i));
    expect(new Set(rotations).size).toBe(CATEGORICAL_HUE_COUNT);
  });
});

describe("parseRgbString", () => {
  it("reads the form a browser normalizes a computed colour to", () => {
    expect(parseRgbString("rgb(8, 145, 178)")).toEqual({ r: 8, g: 145, b: 178 });
    expect(parseRgbString("rgba(8, 145, 178, 0.5)")).toEqual({ r: 8, g: 145, b: 178 });
    expect(parseRgbString("rgb(8 145 178 / 50%)")).toEqual({ r: 8, g: 145, b: 178 });
  });

  it("returns null for a shape it does not know, rather than guessing", () => {
    // A guess here would draw the chart in black; null lets the caller fall back
    // to a neutral it chose on purpose.
    expect(parseRgbString("#0891b2")).toBeNull();
    expect(parseRgbString("oklch(0.6 0.1 200)")).toBeNull();
    expect(parseRgbString("")).toBeNull();
  });
});

describe("rgbToHexNumber", () => {
  it("packs channels into the integer three.js takes", () => {
    expect(rgbToHexNumber({ r: 8, g: 145, b: 178 })).toBe(0x0891b2);
    expect(rgbToHexNumber({ r: 255, g: 255, b: 255 })).toBe(0xffffff);
    expect(rgbToHexNumber({ r: 0, g: 0, b: 0 })).toBe(0x000000);
  });

  it("rounds and clamps a fractional channel from the matrix", () => {
    expect(rgbToHexNumber({ r: 7.6, g: 144.5, b: 300 })).toBe(0x0891ff);
    expect(rgbToHexNumber({ r: -20, g: 0, b: 0 })).toBe(0x000000);
  });
});

describe("OKLab round trip", () => {
  it("returns the colour it was given", () => {
    for (const c of [
      { r: 8, g: 145, b: 178 },
      { r: 255, g: 255, b: 255 },
      { r: 0, g: 0, b: 0 },
      { r: 147, g: 51, b: 234 },
      { r: 234, g: 88, b: 12 },
    ]) {
      const back = oklabToRgb(rgbToOklab(c));
      expect(back.r).toBeCloseTo(c.r, 1);
      expect(back.g).toBeCloseTo(c.g, 1);
      expect(back.b).toBeCloseTo(c.b, 1);
    }
  });
});

describe("oklabMix", () => {
  it("returns the endpoints at 0 and 1", () => {
    const a = { r: 8, g: 145, b: 178 };
    const b = { r: 255, g: 255, b: 255 };
    expect(oklabMix(a, b, 0).r).toBeCloseTo(a.r, 1);
    expect(oklabMix(a, b, 1).g).toBeCloseTo(b.g, 1);
  });

  it("clamps a t outside 0-1 rather than extrapolating out of gamut", () => {
    const a = { r: 8, g: 145, b: 178 };
    const b = { r: 255, g: 255, b: 255 };
    expect(oklabMix(a, b, -1).r).toBeCloseTo(a.r, 1);
    expect(oklabMix(a, b, 2).r).toBeCloseTo(b.r, 1);
  });

  it("stays inside the sRGB cube", () => {
    for (let t = 0; t <= 1; t += 0.1) {
      const c = oklabMix({ r: 234, g: 88, b: 12 }, { r: 11, g: 37, b: 41 }, t);
      for (const ch of [c.r, c.g, c.b]) {
        expect(ch).toBeGreaterThanOrEqual(0);
        expect(ch).toBeLessThanOrEqual(255);
      }
    }
  });
});

describe("ordinalRamp", () => {
  // The gate a one-hue ramp is judged on: lightness has to move in one direction
  // across the steps, the steps have to be far enough apart to tell apart, and
  // the faint end has to stay visible against the surface. That is the test the
  // categorical hues could not pass at any slot count — see the note on
  // RAMP_MAX_STEPS.
  const LIGHT = { surface: { r: 255, g: 255, b: 255 }, foreground: { r: 15, g: 42, b: 46 } };
  const DARK = { surface: { r: 11, g: 37, b: 41 }, foreground: { r: 224, g: 247, b: 250 } };
  const ACCENTS = [
    { r: 8, g: 145, b: 178 },   // Ocean
    { r: 22, g: 163, b: 74 },   // Forest
    { r: 234, g: 88, b: 12 },   // Sunset
    { r: 147, g: 51, b: 234 },  // Grape
  ];

  const lightnesses = (ramp: { r: number; g: number; b: number }[]) =>
    ramp.map((c) => rgbToOklab(c).L);

  it("is monotone in lightness in both modes", () => {
    for (const accent of ACCENTS) {
      for (const mode of [LIGHT, DARK]) {
        const L = lightnesses(ordinalRamp(accent, mode.surface, mode.foreground, RAMP_MAX_STEPS));
        const descending = L.every((v, i) => i === 0 || v < L[i - 1]);
        const ascending = L.every((v, i) => i === 0 || v > L[i - 1]);
        expect(descending || ascending).toBe(true);
      }
    }
  });

  it("puts the most prominent step first, so the biggest band reads strongest", () => {
    for (const accent of ACCENTS) {
      for (const mode of [LIGHT, DARK]) {
        const ramp = ordinalRamp(accent, mode.surface, mode.foreground, RAMP_MAX_STEPS);
        const surfaceL = rgbToOklab(mode.surface).L;
        const first = Math.abs(rgbToOklab(ramp[0]).L - surfaceL);
        const last = Math.abs(rgbToOklab(ramp[ramp.length - 1]).L - surfaceL);
        expect(first).toBeGreaterThan(last);
      }
    }
  });

  it("keeps adjacent steps far enough apart to be separable", () => {
    // The failure this guards: a narrow span put adjacent steps about 0.03 apart
    // in OKLab lightness, which the validator rejects outright.
    for (const accent of ACCENTS) {
      for (const mode of [LIGHT, DARK]) {
        const L = lightnesses(ordinalRamp(accent, mode.surface, mode.foreground, RAMP_MAX_STEPS));
        for (let i = 1; i < L.length; i++) {
          expect(Math.abs(L[i] - L[i - 1])).toBeGreaterThan(0.05);
        }
      }
    }
  });

  it("never reaches the surface, so the faintest band stays visible on it", () => {
    for (const accent of ACCENTS) {
      for (const mode of [LIGHT, DARK]) {
        const last = ordinalRamp(accent, mode.surface, mode.foreground, RAMP_MAX_STEPS).at(-1)!;
        const gap =
          Math.abs(last.r - mode.surface.r) +
          Math.abs(last.g - mode.surface.g) +
          Math.abs(last.b - mode.surface.b);
        expect(gap).toBeGreaterThan(60);
      }
    }
  });

  it("gives a single band the undiluted accent", () => {
    expect(ordinalRamp(ACCENTS[1], LIGHT.surface, LIGHT.foreground, 1)).toEqual([ACCENTS[1]]);
  });

  it("is empty for no bands", () => {
    expect(ordinalRamp(ACCENTS[0], LIGHT.surface, LIGHT.foreground, 0)).toEqual([]);
  });

  it("produces as many distinct steps as asked for", () => {
    const ramp = ordinalRamp(ACCENTS[2], LIGHT.surface, LIGHT.foreground, RAMP_MAX_STEPS);
    const seen = new Set(ramp.map((c) => `${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)}`));
    expect(seen.size).toBe(RAMP_MAX_STEPS);
  });
});
