"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Bucket } from "@/lib/dateRange";
import { bucketFullLabel, bucketLabel } from "@/lib/dateRange";
import { type CurrencyCode } from "@/lib/money";
import type { StackedSeries } from "@/lib/analytics";
import { readCssColor, rgbToHexNumber } from "@/lib/chartColor";
import { useChartRamp } from "@/hooks/useChartRamp";
import { usePrivacyMode } from "@/context/PrivacyModeContext";
import { usePerformanceMode } from "@/context/PerformanceModeContext";

interface StackedBars3DProps {
  stacked: StackedSeries;
  bucket: Bucket;
  currency: CurrencyCode;
  height?: number;
  /** Rendered instead of the canvas in performance mode or without WebGL. */
  fallback: React.ReactNode;
}

/**
 * Stacked bars with real depth, drawn in WebGL.
 *
 * AN ORTHOGRAPHIC CAMERA, NOT A PERSPECTIVE ONE, AND THAT IS THE WHOLE
 * ARGUMENT FOR THIS BEING ALLOWED TO EXIST. The standard objection to a 3D bar
 * chart is sound: under perspective, a bar's drawn height depends on how far
 * from the camera it sits, so two equal values render at different sizes and the
 * reader cannot compare them — the chart lies, decoratively. An orthographic
 * projection has no foreshortening at all. A unit of money is the same number of
 * pixels tall in the front row and the back row, so the bars stay honestly
 * comparable and the depth is presentation rather than distortion.
 *
 * The remaining real cost of depth is OCCLUSION — a tall bar can hide a shorter
 * one behind it. Two things answer that: there is only ONE row of bars (depth
 * gives each bar a body, not a second axis), and the table view in the card
 * header is always one click away.
 *
 * NEVER MOUNTS IN PERFORMANCE MODE. Same convention as AmbientBackground and
 * ParticleBlob: a WebGL context plus a render loop is far heavier than anything
 * else on the page, and somebody who turned that setting on said so. The 2D
 * fallback is a real chart, not a placeholder.
 */
export function StackedBars3D({
  stacked,
  bucket,
  currency,
  height = 280,
  fallback,
}: StackedBars3DProps) {
  const { performanceMode } = usePerformanceMode();
  const { formatAmount } = usePrivacyMode();
  const mountRef = useRef<HTMLDivElement>(null);
  // THE SAME ramp the 2D chart uses, from the same function — which is the only
  // reason a band here is the shade the legend beside it shows.
  const { ramp } = useChartRamp(stacked.slices.length);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState<{ bucketIndex: number; sliceId: string } | null>(null);

  const { bucketKeys, slices, cells, maxBucketMinor } = stacked;

  // Rebuilds the scene when the data OR the resolved colours change, so the bars
  // follow the active ColorScheme and light/dark without knowing about either.
  const sceneKey = useMemo(
    () =>
      `${bucketKeys.join(",")}|${slices.map((s) => s.id).join(",")}|${maxBucketMinor}|` +
      ramp.map((c) => `${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)}`).join(";"),
    [bucketKeys, slices, maxBucketMinor, ramp]
  );

  useEffect(() => {
    if (performanceMode || failed) return;
    const mount = mountRef.current;
    if (!mount || bucketKeys.length === 0 || maxBucketMinor <= 0) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      // No WebGL (old browser, blocklisted driver, headless). The 2D chart is
      // the answer, not an error.
      //
      // Set from inside the effect because the only way to learn this is to try
      // to construct the context, which cannot happen during render — and it
      // settles once per mount rather than cascading, since the next run returns
      // early on `failed`.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailed(true);
      return;
    }

    const width = mount.clientWidth || 600;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Only the chrome is read here; the bands come from the shared ramp.
    const gridRgb = readCssColor(mount, "var(--border)") ?? { r: 200, g: 200, b: 200 };

    // ── Layout, in world units ──
    const columnCount = bucketKeys.length;
    const spanX = 100;
    const slotWidth = spanX / columnCount;
    // Capped so a short range does not produce slabs: the bar is a mark, and the
    // leftover slot is air. Mirrors the <=24px rule the 2D marks follow.
    const barWidth = Math.min(slotWidth * 0.62, 4.2);
    const barDepth = barWidth;
    const maxHeight = 46;
    const unit = maxHeight / maxBucketMinor;

    const group = new THREE.Group();
    // One geometry shared by every bar; each gets its own material because each
    // carries its own colour. Disposed together below.
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials: THREE.Material[] = [];
    const pickables: { mesh: THREE.Mesh; bucketIndex: number; sliceId: string }[] = [];

    bucketKeys.forEach((bucketKey, bucketIndex) => {
      let cursorY = 0;
      const x = -spanX / 2 + slotWidth * (bucketIndex + 0.5);
      slices.forEach((slice, sliceIndex) => {
        const value = cells.get(`${bucketKey}|${slice.id}`) ?? 0;
        if (value <= 0) return;
        const segmentHeight = value * unit;
        const rgb = ramp[sliceIndex] ?? ramp[ramp.length - 1] ?? { r: 128, g: 128, b: 128 };
        const material = new THREE.MeshLambertMaterial({ color: rgbToHexNumber(rgb) });
        materials.push(material);
        const mesh = new THREE.Mesh(geometry, material);
        // A 2px-equivalent gap in world units between touching segments, which
        // is how the 2D stacks separate their fills too — a drawn border around
        // each would be heavier ink doing the same job.
        const gap = Math.min(0.22, segmentHeight * 0.12);
        mesh.scale.set(barWidth, Math.max(segmentHeight - gap, segmentHeight * 0.3), barDepth);
        mesh.position.set(x, cursorY + mesh.scale.y / 2, 0);
        cursorY += segmentHeight;
        group.add(mesh);
        pickables.push({ mesh, bucketIndex, sliceId: slice.id });
      });
    });

    // A hairline baseline, one step off the surface, matching the 2D charts'
    // recessive grid.
    const baseline = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-spanX / 2 - 1, 0, 0),
        new THREE.Vector3(spanX / 2 + 1, 0, 0),
      ]),
      new THREE.LineBasicMaterial({ color: rgbToHexNumber(gridRgb) })
    );
    group.add(baseline);
    scene.add(group);

    // ── An isometric orthographic camera ──
    //
    // The frustum is sized to the content rather than the viewport, so the bars
    // fill the card at any width and the scale stays the same across a resize.
    const aspect = width / height;
    const frustum = 62;
    const camera = new THREE.OrthographicCamera(
      -frustum * aspect * 0.5,
      frustum * aspect * 0.5,
      frustum * 0.5,
      -frustum * 0.5,
      -400,
      400
    );
    // A shallow angle: enough to read the bars as solid, little enough that the
    // tops stay readable and nothing hides behind anything.
    camera.position.set(34, 30, 56);
    camera.lookAt(0, maxHeight * 0.34, 0);

    // Lambert rather than a flat material, because the shading is what makes the
    // depth legible at all — an unlit box reads as a flat rectangle. A hemisphere
    // fill plus one directional key keeps every face distinct without any of
    // them going dark enough to lose its hue.
    scene.add(new THREE.HemisphereLight(0xffffff, 0x404040, 1.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.75);
    key.position.set(-40, 70, 60);
    scene.add(key);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let frame = 0;

    const render = () => renderer.render(scene, camera);

    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pickables.map((p) => p.mesh), false)[0];
      const found = hit ? pickables.find((p) => p.mesh === hit.object) : undefined;
      setHover(found ? { bucketIndex: found.bucketIndex, sliceId: found.sliceId } : null);
    };
    const onPointerLeave = () => setHover(null);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);

    const onResize = () => {
      const w = mount.clientWidth || width;
      renderer.setSize(w, height);
      const a = w / height;
      camera.left = -frustum * a * 0.5;
      camera.right = frustum * a * 0.5;
      camera.updateProjectionMatrix();
      render();
    };
    const observer = new ResizeObserver(onResize);
    observer.observe(mount);

    // ── One entry animation, then STILL ──
    //
    // No idle loop. A chart that keeps moving is harder to read and burns a
    // battery for nothing; the one growth pass exists because it makes the
    // stacking order legible as it builds. Skipped entirely for a viewer who
    // asked for reduced motion, who gets the final frame immediately.
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const targets = pickables.map((p) => ({
      mesh: p.mesh,
      scaleY: p.mesh.scale.y,
      positionY: p.mesh.position.y,
    }));

    if (reduceMotion) {
      render();
    } else {
      const start = performance.now();
      const duration = 520;
      const tick = () => {
        const t = Math.min(1, (performance.now() - start) / duration);
        // easeOutCubic — settles rather than stopping dead.
        const eased = 1 - (1 - t) ** 3;
        for (const target of targets) {
          target.mesh.scale.y = Math.max(target.scaleY * eased, 0.0001);
          target.mesh.position.y = target.positionY * eased;
        }
        render();
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      // Every GPU resource explicitly released. A WebGL context leaked per
      // range change would end in a lost context after a dozen of them, and the
      // chart would simply stop drawing with nothing in the console to say why.
      geometry.dispose();
      for (const material of materials) material.dispose();
      baseline.geometry.dispose();
      (baseline.material as THREE.Material).dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [sceneKey, bucketKeys, slices, cells, maxBucketMinor, height, performanceMode, failed, ramp]);

  if (performanceMode || failed) return <>{fallback}</>;

  if (maxBucketMinor <= 0) {
    return (
      <p className="py-10 text-center text-sm text-foreground/50">
        Nothing to chart in this period.
      </p>
    );
  }

  const hoveredSlice = hover ? slices.find((s) => s.id === hover.sliceId) : null;
  const hoveredValue =
    hover && hoveredSlice ? cells.get(`${bucketKeys[hover.bucketIndex]}|${hoveredSlice.id}`) ?? 0 : 0;

  return (
    <div className="relative">
      <div ref={mountRef} style={{ height }} className="w-full" />

      {/* The x-axis as HTML under the canvas rather than as 3D text: a sprite
          would scale and rotate with the scene and stop being a label. */}
      <div className="flex justify-between px-1 pt-1">
        {bucketKeys.map((key, i) =>
          i === 0 || i === bucketKeys.length - 1 || i === Math.floor(bucketKeys.length / 2) ? (
            <span key={key} className="text-[10px] tabular-nums text-foreground/45">
              {bucketLabel(key, bucket)}
            </span>
          ) : null
        )}
      </div>

      {hover && hoveredSlice && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-border bg-overlay p-2 shadow-lg">
          <p className="text-[11px] font-medium text-foreground/60">
            {bucketFullLabel(bucketKeys[hover.bucketIndex], bucket)}
          </p>
          <p className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatAmount(hoveredValue, currency)}
            </span>
            <span className="text-[11px] text-foreground/60">{hoveredSlice.label}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default StackedBars3D;
