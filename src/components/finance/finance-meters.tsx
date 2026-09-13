import { FINANCE_CLIENT, formatUsdCents } from "@/lib/finance";
import { meterWidthPercent, type ThresholdMeter, type TitleContribution } from "@/lib/finance-dashboard";

export function ThresholdMeterBar({ meter }: { meter: ThresholdMeter }) {
  const width = meterWidthPercent(meter.ratioBp);
  return (
    <div data-finance-threshold-meter="" className="flex flex-col gap-2">
      <div className="flex justify-between gap-4 t-body-sm text-ink-2">
        <span>{FINANCE_CLIENT.thresholdVsNet}</span>
        <span className="text-ink">
          {formatUsdCents(meter.netCents)}
          {meter.thresholdCents === null ? "" : ` / ${formatUsdCents(meter.thresholdCents)}`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-accent" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function TitleContributionBars({
  contributions,
}: {
  contributions: readonly TitleContribution[];
}) {
  if (contributions.length === 0) return null;
  return (
    <ul data-finance-contribution="" className="flex flex-col gap-3">
      {contributions.map((title) => (
        <li key={title.titleId} className="flex flex-col gap-1">
          <div className="flex justify-between gap-4 t-body-sm text-ink-2">
            <span>{title.titleName}</span>
            <span className="t-data text-ink">{formatUsdCents(title.clientShareCents)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${meterWidthPercent(title.shareBp)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function NetHistoryChart({
  points,
}: {
  points: readonly { id: string; label: string; netCents: number }[];
}) {
  if (points.length === 0) {
    return <p className="t-body-sm text-ink-3">{FINANCE_CLIENT.glanceNone}</p>;
  }
  const max = Math.max(...points.map((point) => Math.abs(point.netCents)), 1);
  const w = 320;
  const h = 88;
  const pad = 8;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const step = points.length === 1 ? 0 : innerW / (points.length - 1);
  const xy = points.map((point, i) => {
    const x = pad + i * step;
    const y = pad + innerH - (Math.abs(point.netCents) / max) * innerH;
    return { ...point, x, y };
  });
  const line = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const base = pad + innerH;
  const area = `${line} L${xy[xy.length - 1].x.toFixed(1)},${base} L${xy[0].x.toFixed(1)},${base} Z`;

  return (
    <svg
      data-finance-history-chart=""
      viewBox={`0 0 ${w} ${h}`}
      className="block w-full text-accent"
      role="img"
      aria-label={FINANCE_CLIENT.history}
    >
      <path d={area} fill="currentColor" opacity="0.18" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
