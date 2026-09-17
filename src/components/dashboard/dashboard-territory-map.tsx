"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { feature } from "topojson-client";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { GeometryCollection, Topology } from "topojson-specification";
import countries110m from "world-atlas/countries-110m.json";

import { DASHBOARD_HOME } from "@/lib/dashboard-home";
import {
  dashboardChoroplethFill,
  dashboardRowForNumeric,
  dashboardShareLabel,
  dashboardShareRatio,
  dashboardTerritoryCountLabel,
  rankedTotal,
  type DashboardRankedRow,
} from "@/lib/dashboard-register";
import {
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_LEGEND_CLASS,
  DASHBOARD_MAP_FRAME_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
} from "@/lib/dashboard-craft";
import { cn } from "@/lib/cn";

// Local topology types — no `geojson` module. topojson-client's `feature`
// is cast once; path drawing uses d3-geo against that collection.
type CountryFeature = {
  type: "Feature";
  id?: string | number;
  properties?: { name?: string } | null;
  geometry: object | null;
};

type CountryCollection = {
  type: "FeatureCollection";
  features: CountryFeature[];
};

type TerritoryPath = {
  id: string;
  d: string;
  row: DashboardRankedRow | null;
  fill: string;
};

const ANTARCTICA = 10;

const topology = countries110m as Topology<{ countries: GeometryCollection }>;
const world = feature(topology, topology.objects.countries) as unknown as CountryCollection;

export function DashboardTerritoryMap({
  rows,
}: {
  rows: readonly DashboardRankedRow[];
}) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const total = rankedTotal(rows);
  const byNumeric = useMemo(() => {
    const map = new Map<number, DashboardRankedRow>();
    for (const row of rows) {
      if (row.numeric == null) continue;
      map.set(row.numeric, row);
    }
    return map;
  }, [rows]);
  const max = Math.max(0, ...rows.map((row) => row.count));

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

  const paths = useMemo(() => {
    if (!size) return [] as TerritoryPath[];
    const projection = geoNaturalEarth1().fitExtent(
      [
        [8, 8],
        [size.w - 8, size.h - 8],
      ],
      world as never,
    );
    const path = geoPath(projection);
    return world.features.flatMap((entry: CountryFeature): TerritoryPath[] => {
      const numeric = Number(entry.id);
      if (numeric === ANTARCTICA) return [];
      const d = path(entry as never);
      if (!d) return [];
      const row = dashboardRowForNumeric(byNumeric, entry.id);
      const ratio = row ? dashboardShareRatio(row.count, max) : 0;
      return [
        {
          id: String(entry.id ?? entry.properties?.name ?? d.slice(0, 12)),
          d,
          row,
          fill: row ? dashboardChoroplethFill(ratio) : "var(--surface-muted)",
        },
      ];
    });
  }, [byNumeric, max, size]);

  const hover = hoverKey ? rows.find((row) => row.key === hoverKey) ?? null : null;

  return (
    <div data-dashboard-territory-map="" className="border-t border-hairline">
      <div ref={plotRef} className={DASHBOARD_MAP_FRAME_CLASS}>
        {size ? (
          <svg
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            className="block"
            role="img"
            aria-label={DASHBOARD_HOME.territories}
          >
            {paths.map((item: TerritoryPath) => (
              <path
                key={item.id}
                d={item.d}
                data-dashboard-territory-country={item.row?.code ?? item.id}
                fill={item.fill}
                stroke="var(--border)"
                strokeWidth={0.6}
                onPointerEnter={() => {
                  if (item.row) setHoverKey(item.row.key);
                }}
                onPointerLeave={() => setHoverKey(null)}
              />
            ))}
          </svg>
        ) : (
          <div className="h-full" aria-hidden />
        )}
        {hover ? (
          <div
            data-dashboard-territory-hover=""
            className="pointer-events-none absolute left-[var(--space-4)] top-[var(--space-2)] border border-hairline bg-surface px-[var(--space-4)] py-[var(--space-2)] shadow-none"
          >
            <p className="t-body-sm text-ink">
              {hover.label}
              {hover.code ? ` · ${hover.code}` : ""}
            </p>
            <p className="t-data t-body-sm text-ink-2">
              {hover.count} · {dashboardShareLabel(hover.count, total)}
            </p>
          </div>
        ) : null}
      </div>
      <div
        className={cn(
          "flex items-center justify-between border-t border-hairline",
          DASHBOARD_CARD_PAD_LIST,
        )}
      >
        <p data-dashboard-territory-legend="" className={DASHBOARD_LEGEND_CLASS}>
          <span>{DASHBOARD_HOME.legendLow}</span>
          <span
            aria-hidden
            className="h-px w-16"
            style={{
              background:
                "linear-gradient(to right, var(--surface-muted), color-mix(in srgb, var(--accent) 56%, var(--surface-muted)))",
            }}
          />
          <span>{DASHBOARD_HOME.legendHigh}</span>
        </p>
        <p
          data-dashboard-territory-count=""
          className={cn("t-body-sm text-ink-3", DASHBOARD_RELATED_GAP_CLASS)}
        >
          {dashboardTerritoryCountLabel(rows.length)}
        </p>
      </div>
      <table className="sr-only">
        <caption>{DASHBOARD_HOME.territories}</caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>
                {row.label}
                {row.code ? ` · ${row.code}` : ""}
              </td>
              <td>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
