"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cumulativeCatalogSeries } from "@/lib/catalog-activity";
import { REPORTS_PAGE } from "@/lib/reports";
import type { ReportsCountRow } from "@/lib/reports";

const H = 160;
const PAD = { top: 16, right: 16, bottom: 24, left: 16 };

export function ReportsCatalogChart({ createdAt, nowMs }: { createdAt: number[]; nowMs: number }) {
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
    const xy = series.points.map((p) => ({ x: px(p.t), y: py(p.c) }));
    const line = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
    const baseY = PAD.top + innerH;
    const area = `${line} L${xy[xy.length - 1].x.toFixed(2)},${baseY} L${xy[0].x.toFixed(2)},${baseY} Z`;
    return { line, area, baseY, last: xy[xy.length - 1], w: width };
  }, [series, width, nowMs]);

  return (
    <section
      data-reports-series=""
      aria-label={REPORTS_PAGE.series}
      className="overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface"
    >
      <p className="px-[var(--space-6)] py-[var(--space-4)] t-label text-ink-3">{REPORTS_PAGE.series}</p>
      <div ref={plotRef} className="relative border-t border-hairline" style={{ height: H }}>
        {!series ? (
          <div className="flex h-full items-center px-[var(--space-6)]">
            <p className="t-body text-ink-2">{REPORTS_PAGE.seriesEmpty}</p>
          </div>
        ) : geom ? (
          <svg
            width={geom.w}
            height={H}
            viewBox={`0 0 ${geom.w} ${H}`}
            className="block text-accent"
            role="img"
            aria-label={`${REPORTS_PAGE.series}: ${series.total} titles.`}
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
            <path d={geom.line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
            <circle cx={geom.last.x} cy={geom.last.y} r={4} fill="currentColor" />
          </svg>
        ) : (
          <div className="h-full" aria-hidden />
        )}
      </div>
    </section>
  );
}

export function ReportsBreakdown({
  label,
  empty,
  rows,
  testId,
}: {
  label: string;
  empty: string;
  rows: readonly ReportsCountRow[];
  testId: string;
}) {
  const max = rows[0]?.count ?? 0;
  return (
    <section
      data-reports-breakdown={testId}
      className="overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface"
    >
      <p className="px-[var(--space-6)] py-[var(--space-4)] t-label text-ink-3">{label}</p>
      {rows.length === 0 ? (
        <p className="border-t border-hairline px-[var(--space-6)] py-[var(--space-6)] t-body text-ink-2">
          {empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-[var(--space-4)] border-t border-hairline px-[var(--space-6)] py-[var(--space-6)]">
          {rows.map((row) => (
            <li key={row.name} className="flex flex-col gap-[var(--space-2)]">
              <div className="flex items-center justify-between gap-[var(--space-4)]">
                <span className="t-body text-ink">{row.name}</span>
                <span className="t-data t-body text-ink">{row.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${max === 0 ? 0 : Math.round((row.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
