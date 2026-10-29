"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ordinalRamp, readCssColor, type Rgb } from "@/lib/chartColor";

const FALLBACK_ACCENT: Rgb = { r: 59, g: 130, b: 246 };
const FALLBACK_SURFACE: Rgb = { r: 255, g: 255, b: 255 };
const FALLBACK_FOREGROUND: Rgb = { r: 17, g: 17, b: 17 };

/**
 * The stacked chart's colour ramp, resolved from the live theme tokens.
 *
 * WHY A HOOK AND NOT A CONSTANT. The ramp's two ends are `--accent` and
 * `--surface`, which this app rewrites at RUNTIME: DbThemeApplier sets them as
 * inline custom properties on `document.documentElement` from the account's
 * chosen ColorScheme, and next-themes toggles the light/dark variant on top. So
 * the only way to know the colours is to ask the browser, and the only way to
 * stay right is to ask again when they change.
 *
 * It watches `documentElement`'s `style` and `class` attributes, which is where
 * both of those land — the scheme as inline properties, the mode as a class.
 *
 * Returns CONCRETE channels rather than CSS strings so the WebGL chart and the
 * SVG chart can be handed the same numbers. That is the point: a
 * `color-mix()` in one and a JS mix in the other would drift, and the legend
 * would key a band to a shade the band does not have.
 */
export function useChartRamp(count: number) {
  const probeRef = useRef<HTMLSpanElement | null>(null);
  const [tokens, setTokens] = useState<{ accent: Rgb; surface: Rgb; foreground: Rgb }>({
    accent: FALLBACK_ACCENT,
    surface: FALLBACK_SURFACE,
    foreground: FALLBACK_FOREGROUND,
  });

  const read = useCallback(() => {
    const host = probeRef.current ?? document.body;
    if (!host) return;
    const accent = readCssColor(host, "var(--accent)") ?? FALLBACK_ACCENT;
    const surface = readCssColor(host, "var(--surface)") ?? FALLBACK_SURFACE;
    const foreground = readCssColor(host, "var(--foreground)") ?? FALLBACK_FOREGROUND;
    const same = (a: Rgb, b: Rgb) => a.r === b.r && a.g === b.g && a.b === b.b;
    setTokens((prev) =>
      same(prev.accent, accent) && same(prev.surface, surface) && same(prev.foreground, foreground)
        ? // Same colours — returning the previous object keeps the ramp's
          // identity stable, so the 3D scene is not torn down and rebuilt on
          // every unrelated attribute change.
          prev
        : { accent, surface, foreground }
    );
  }, []);

  useEffect(() => {
    // Read after mount, never during render: getComputedStyle does not exist on
    // the server, and a first client render that disagreed with the server's
    // would be a hydration mismatch.
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class", "data-theme"],
    });
    return () => observer.disconnect();
  }, [read]);

  const ramp = useMemo(
    () => ordinalRamp(tokens.accent, tokens.surface, tokens.foreground, count),
    [tokens, count]
  );

  return { ramp, tokens, probeRef };
}
