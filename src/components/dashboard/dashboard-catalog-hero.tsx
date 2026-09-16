"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { DASHBOARD_HOME, dashboardCatalogValue } from "@/lib/dashboard-home";
import { cumulativeCatalogSeries } from "@/lib/catalog-activity";

const H = 200;
const PAD = { top: 16, right: 16, bottom: 24, left: 16 };

export function DashboardCatalogHero({
  createdAt,
  nowMs,
  catalog,
  catalogIsPartial,
  live,
  liveIsPartial,
}: {
  createdAt: number[];
  nowMs: number;
  catalog: number;
  catalogIsPartial: boolean;
  live: number;
  liveIsPartial: boolean;
}) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const series = useMemo(
    () => cumulativeCatalogSeries([...createdAt].sort((a, b) => a - b), nowMs, Infinity),
    [createdAt, nowMs],
  );

  const geom = useMemo(() => {
    if (!series || width == null) return null;
    const innerW = Math.max(width - PAD.left - PAD.right, 1);
    const innerH = H - PAD.top - PAD.bottom;
    const span = Math.max(nowMs - series.start, 1);
    const yTop = series.yMax * 1.12 || 1;
    const px = (t: number) => PAD.left + ((t - series.start) / span) * innerW;
    const py = (c: number) => PAD.top + innerH - (c / yTop) * innerH;
    const xy = series.points.map((p) => ({ x: px(p.t), y: py(p.c), ...p }));
    const line = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
    const baseY = PAD.top + innerH;
    const area = `${line} L${xy[xy.length - 1].x.toFixed(2)},${baseY} L${xy[0].x.toFixed(2)},${baseY} Z`;
    return { xy, line, area, baseY, innerH, w: width };
  }, [series, width, nowMs]);

  return (
    <section
      data-dashboard-hero=""
      aria-label={DASHBOARD_HOME.hero}
      className="h-full overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface"
    >
      <div className="flex flex-col gap-[var(--space-2)] px-[var(--space-6)] py-[var(--space-6)]">
        <p className="t-label text-ink-3">{DASHBOARD_HOME.hero}</p>
        <p data-dashboard-stat="catalog" className="t-display t-data leading-none text-ink">
          {dashboardCatalogValue(catalog, catalogIsPartial)}
        </p>
        <p className="t-body-sm text-ink-3">
          <span data-dashboard-stat="live">{dashboardCatalogValue(live, liveIsPartial)}</span>
          {` ${DASHBOARD_HOME.live}`}
        </p>
      </div>
      <div ref={plotRef} className="relative border-t border-hairline" style={{ height: H }}>
        {!series ? (
          <div className="flex h-full items-center px-[var(--space-6)]">
            <p className="t-body text-ink-2">{DASHBOARD_HOME.heroEmpty}</p>
          </div>
        ) : geom ? (
          <svg
            width={geom.w}
            height={H}
            viewBox={`0 0 ${geom.w} ${H}`}
            className="block text-accent"
            role="img"
            aria-label={`${DASHBOARD_HOME.hero}: ${series.total} titles.`}
          >
            <line
              x1={PAD.left}
              x2={geom.w - PAD.right}
              y1={geom.baseY}
              y2={geom.baseY}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <path d={geom.area} fill="currentColor" fillOpacity={0.08} />
            <path
              d={geom.line}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {(() => {
              const last = geom.xy[geom.xy.length - 1];
              return <circle cx={last.x} cy={last.y} r={4} fill="currentColor" />;
            })()}
          </svg>
        ) : (
          <div className="h-full" aria-hidden />
        )}
      </div>
    </section>
  );
}
