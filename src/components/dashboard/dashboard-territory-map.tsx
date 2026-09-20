"use client";

import { useMemo, useState } from "react";
import { feature } from "topojson-client";
import { geoMercator, geoPath } from "d3-geo";
import type { GeometryCollection, Topology } from "topojson-specification";
import countries110m from "world-atlas/countries-110m.json";

import { DASHBOARD_HOME } from "@/lib/dashboard-home";
import {
  DASHBOARD_CHOROPLETH_SCALE,
  DASHBOARD_MAP_CENTER,
  DASHBOARD_MAP_HEIGHT,
  DASHBOARD_MAP_SCALE,
  DASHBOARD_MAP_WIDTH,
  dashboardChoroplethFill,
  dashboardChoroplethHoverFill,
  dashboardRowForTopologyId,
  dashboardRowsByAlpha2,
  dashboardShareLabel,
  dashboardTerritoryCountLabel,
  rankedTotal,
  type DashboardRankedRow,
} from "@/lib/dashboard-register";
import { isoAlpha2FromNumeric } from "@/lib/iso3166-numeric";
import {
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_CHOROPLETH_LEGEND_BAR_CLASS,
  DASHBOARD_CHOROPLETH_SWATCH_CLASS,
  DASHBOARD_LEGEND_CLASS,
  DASHBOARD_MAP_FRAME_CLASS,
  DASHBOARD_MAP_PAD_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
} from "@/lib/dashboard-craft";
import { cn } from "@/lib/cn";

// RL Overview SoT: Carpenter-Create/royalogic
// `src/components/overview/TerritoryMap.tsx`. Map/list/bars + choropleth +
// legend + view alts. This file is the map plot. Ported: NUMERIC_TO_ALPHA2
// join, Mercator 700x340 / scale 120 / center [0, 30], legend gap-0.5
// rounded-sm swatches, hairline strokes. House rematch only: Geist ·
// Sporty Blue discrete scale. No RL brand fill. d3-geo path, not a map kit.
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
  code: string;
  d: string;
  row: DashboardRankedRow | null;
  fill: string;
};

const ANTARCTICA = 10;

const topology = countries110m as Topology<{ countries: GeometryCollection }>;
const world = feature(topology, topology.objects.countries) as unknown as CountryCollection;

const projection = geoMercator()
  .scale(DASHBOARD_MAP_SCALE)
  .center(DASHBOARD_MAP_CENTER)
  .translate([DASHBOARD_MAP_WIDTH / 2, DASHBOARD_MAP_HEIGHT / 2]);
const path = geoPath(projection);

export function DashboardTerritoryMap({
  rows,
}: {
  rows: readonly DashboardRankedRow[];
}) {
  const [tooltip, setTooltip] = useState<{
    name: string;
    amount: number;
    share: string;
    x: number;
    y: number;
    key: string;
  } | null>(null);
  const total = rankedTotal(rows);
  const byCode = useMemo(() => dashboardRowsByAlpha2(rows), [rows]);
  const max = Math.max(0, ...rows.map((row) => row.count));

  const countries = useMemo(() => {
    return world.features.flatMap((entry: CountryFeature): TerritoryPath[] => {
      const numeric = Number(entry.id);
      if (numeric === ANTARCTICA) return [];
      const d = path(entry as never);
      if (!d) return [];
      const row = dashboardRowForTopologyId(byCode, entry.id, entry.properties?.name);
      const amount = row?.count ?? 0;
      const code = row?.code ?? isoAlpha2FromNumeric(entry.id) ?? String(entry.id ?? "");
      return [
        {
          id: String(entry.id ?? entry.properties?.name ?? d.slice(0, 12)),
          code,
          d,
          row,
          fill: dashboardChoroplethFill(amount, max),
        },
      ];
    });
  }, [byCode, max]);

  return (
    <div
      data-dashboard-territory-map=""
      data-dashboard-territory-scale="overview"
      className="border-t border-hairline"
    >
      <div className={cn(DASHBOARD_MAP_FRAME_CLASS, DASHBOARD_MAP_PAD_CLASS)}>
        <div className="relative">
          <svg
            viewBox={`0 0 ${DASHBOARD_MAP_WIDTH} ${DASHBOARD_MAP_HEIGHT}`}
            width="100%"
            height="auto"
            className="block"
            role="img"
            aria-label={DASHBOARD_HOME.territories}
          >
            {countries.map((item: TerritoryPath) => {
              const amount = item.row?.count ?? 0;
              const hovering = tooltip?.key === item.row?.key;
              const fill =
                hovering && amount > 0
                  ? dashboardChoroplethHoverFill(amount, max)
                  : item.fill;
              return (
                <path
                  key={item.id}
                  d={item.d}
                  data-dashboard-territory-country={item.code}
                  data-dashboard-territory-filled={amount > 0 ? "" : undefined}
                  fill={fill}
                  stroke="var(--border)"
                  strokeWidth={0.5}
                  style={{ cursor: amount > 0 ? "pointer" : "default" }}
                  onPointerEnter={(event) => {
                    if (!item.row || amount <= 0) return;
                    const rect = (event.target as SVGElement)
                      .closest("svg")
                      ?.getBoundingClientRect();
                    setTooltip({
                      name: item.row.label,
                      amount,
                      share: dashboardShareLabel(amount, total),
                      x: event.clientX - (rect?.left ?? 0),
                      y: event.clientY - (rect?.top ?? 0),
                      key: item.row.key,
                    });
                  }}
                  onPointerMove={(event) => {
                    if (!item.row || amount <= 0) return;
                    const rect = (event.target as SVGElement)
                      .closest("svg")
                      ?.getBoundingClientRect();
                    setTooltip({
                      name: item.row.label,
                      amount,
                      share: dashboardShareLabel(amount, total),
                      x: event.clientX - (rect?.left ?? 0),
                      y: event.clientY - (rect?.top ?? 0),
                      key: item.row.key,
                    });
                  }}
                  onPointerLeave={() => setTooltip(null)}
                />
              );
            })}
          </svg>
          {tooltip ? (
            <div
              data-dashboard-territory-hover=""
              className="pointer-events-none absolute z-20 border border-hairline bg-surface px-[var(--space-4)] py-[var(--space-2)] shadow-none"
              style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
            >
              <p className="t-body-sm font-medium text-ink">{tooltip.name}</p>
              <p className="t-data t-body-sm text-ink-2">
                {tooltip.amount} · {tooltip.share}
              </p>
            </div>
          ) : null}
        </div>
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
            data-dashboard-territory-legend-bar=""
            className={DASHBOARD_CHOROPLETH_LEGEND_BAR_CLASS}
          >
            {DASHBOARD_CHOROPLETH_SCALE.slice(1).map((color) => (
              <span
                key={color}
                data-dashboard-territory-swatch=""
                className={DASHBOARD_CHOROPLETH_SWATCH_CLASS}
                style={{ background: color }}
              />
            ))}
          </span>
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
