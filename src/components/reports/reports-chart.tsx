"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { formatUsdCents } from "@/lib/finance";
import {
  dashboardChartGeometry,
  dashboardDeltaLine,
  nearestChartPoint,
  pointDelta,
  type DashboardRevenuePoint,
} from "@/lib/dashboard-admin";
import { REPORTS_PAGE } from "@/lib/reports";
import { REPORTS_CHART_EMPTY_CLASS, REPORTS_CHART_FRAME_CLASS } from "@/lib/reports-craft";
import { REPORTS_FIXTURE } from "@/lib/reports-fixture";

const PAD = { top: 16, right: 48, bottom: 24, left: 16 };

export function ReportsRevenueChart({
  points,
  comparePoints = [],
  playheadKey,
  fixture = false,
}: {
  points: readonly DashboardRevenuePoint[];
  comparePoints?: readonly DashboardRevenuePoint[];
  playheadKey: string | null;
  fixture?: boolean;
}) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box && box.width && box.height) setSize({ w: box.width, h: box.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geom = useMemo(
    () => (size == null ? null : dashboardChartGeometry(points, size.w, size.h, PAD)),
    [points, size],
  );
  const compareGeom = useMemo(
    () => (size == null ? null : dashboardChartGeometry(comparePoints, size.w, size.h, PAD)),
    [comparePoints, size],
  );

  const hover = useMemo(() => {
    if (!geom || hoverX == null) return null;
    return nearestChartPoint(geom.xy, hoverX);
  }, [geom, hoverX]);

  const hoverIndex = hover ? points.findIndex((point) => point.key === hover.key) : -1;
  const hoverDelta = hoverIndex >= 0 ? pointDelta(points, hoverIndex) : null;
  const playhead = geom?.xy.find((point) => point.key === playheadKey) ?? geom?.xy[geom.xy.length - 1];
  const money = (cents: number) =>
    fixture ? `${formatUsdCents(cents)} ${REPORTS_FIXTURE.sampleMark}` : formatUsdCents(cents);

  const empty = points.length === 0;

  return (
    <div
      ref={plotRef}
      data-reports-series=""
      data-reports-revenue-chart=""
      data-reports-chart-empty={empty ? "" : undefined}
      className={empty ? REPORTS_CHART_EMPTY_CLASS : REPORTS_CHART_FRAME_CLASS}
    >
      {empty ? (
        <div data-reports-chart-empty-slot="" className="h-px w-full bg-hairline" aria-hidden />
      ) : geom ? (
        <>
          <svg
            width={geom.w}
            height={size?.h ?? geom.innerH}
            viewBox={`0 0 ${geom.w} ${size?.h ?? 0}`}
            className="block text-accent"
            role="img"
            aria-label={`${REPORTS_PAGE.series}: ${points.length} closed periods.`}
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setHoverX(event.clientX - rect.left);
            }}
            onPointerLeave={() => setHoverX(null)}
          >
            <defs>
              <linearGradient id="gc-reports-revenue-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((step) => {
              const y = PAD.top + geom.innerH * step;
              return (
                <line
                  key={step}
                  x1={PAD.left}
                  x2={geom.w - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
              );
            })}
            <line
              x1={PAD.left}
              x2={geom.w - PAD.right}
              y1={geom.baseY}
              y2={geom.baseY}
              stroke="var(--border)"
              strokeWidth={1}
            />
            {compareGeom ? (
              <path
                d={compareGeom.line}
                fill="none"
                stroke="var(--text-tertiary)"
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                data-reports-series-compare=""
              />
            ) : null}
            <path d={geom.area} fill="url(#gc-reports-revenue-fill)" />
            <path
              d={geom.line}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {hover ? (
              <line
                x1={hover.x}
                x2={hover.x}
                y1={PAD.top}
                y2={geom.baseY}
                stroke="var(--text-secondary)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ) : null}
            {playhead ? (
              <circle
                cx={playhead.x}
                cy={playhead.y}
                r={4}
                fill="currentColor"
                stroke="var(--surface)"
                strokeWidth={2}
              />
            ) : null}
            {hover ? (
              <circle
                cx={hover.x}
                cy={hover.y}
                r={5}
                fill="currentColor"
                stroke="var(--surface)"
                strokeWidth={2}
              />
            ) : null}
            {geom.ticks.map((tick) => (
              <text
                key={`${tick.x}-${tick.label}`}
                x={tick.x}
                y={(size?.h ?? 0) - 8}
                textAnchor="middle"
                className="t-label t-data"
                fill="var(--text-tertiary)"
              >
                {tick.label}
              </text>
            ))}
          </svg>
          {hover ? (
            <div
              data-reports-revenue-tooltip=""
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-[var(--radius)] border border-hairline bg-surface px-[var(--space-4)] py-[var(--space-2)] shadow-none"
              style={{ left: Math.min(Math.max(hover.x, 72), geom.w - 72), top: hover.y - 8 }}
            >
              <p className="t-label text-ink-3">{hover.label}</p>
              <p className="t-data t-heading text-ink">{money(hover.netCents)}</p>
              {hoverDelta ? (
                <p className="t-body-sm text-ink-3">{dashboardDeltaLine(hoverDelta)}</p>
              ) : null}
            </div>
          ) : null}
          <table className="sr-only">
            <caption>{REPORTS_PAGE.series}</caption>
            <thead>
              <tr>
                <th>Period</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.key}>
                  <td>{point.label}</td>
                  <td>{money(point.netCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="h-full" aria-hidden />
      )}
    </div>
  );
}
