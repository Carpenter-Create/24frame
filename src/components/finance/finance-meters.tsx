import { FINANCE_CLIENT, FINANCE_PAGE, formatUsdCents } from "@/lib/finance";
import {
  FINANCE_CHART_CLASS,
  FINANCE_CHART_VIEW_HEIGHT,
  FINANCE_CHART_VIEW_WIDTH,
  FINANCE_METER_FILL_CLASS,
  FINANCE_METER_PAD_CLASS,
  FINANCE_METER_TRACK_CLASS,
  FINANCE_STATUS_PILL_CLASS,
} from "@/lib/finance-craft";
import { meterWidthPercent, type ThresholdMeter, type TitleContribution } from "@/lib/finance-dashboard";

export function FinanceStatusPill({ status }: { status: "open" | "closed" }) {
  return (
    <span data-finance-status-pill="" className={FINANCE_STATUS_PILL_CLASS}>
      {status === "closed" ? FINANCE_PAGE.statusClosed : FINANCE_PAGE.statusOpen}
    </span>
  );
}

export function ThresholdMeterBar({ meter }: { meter: ThresholdMeter }) {
  const width = meterWidthPercent(meter.ratioBp);
  const complete = meter.met === true || width >= 100;
  return (
    <div
      data-finance-threshold-meter=""
      data-threshold-complete={complete ? "" : undefined}
      className={FINANCE_METER_PAD_CLASS}
    >
      <div className="flex justify-between gap-[var(--space-4)] t-body-sm text-ink-2">
        <span>{FINANCE_CLIENT.thresholdVsNet}</span>
        <span className="t-data text-ink">
          {formatUsdCents(meter.netCents)}
          {meter.thresholdCents === null ? "" : ` / ${formatUsdCents(meter.thresholdCents)}`}
        </span>
      </div>
      <div className={FINANCE_METER_TRACK_CLASS}>
        <div className={FINANCE_METER_FILL_CLASS} style={{ width: `${width}%` }} />
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
    <ul data-finance-contribution="" className="flex flex-col gap-[var(--space-4)]">
      {contributions.map((title) => (
        <li key={title.titleId} className="flex flex-col gap-[var(--space-2)]">
          <div className="flex justify-between gap-[var(--space-4)] t-body-sm text-ink-2">
            <span>{title.titleName}</span>
            <span className="t-data text-ink">{formatUsdCents(title.clientShareCents)}</span>
          </div>
          <div className={FINANCE_METER_TRACK_CLASS}>
            <div
              className={FINANCE_METER_FILL_CLASS}
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
  const w = FINANCE_CHART_VIEW_WIDTH;
  const h = FINANCE_CHART_VIEW_HEIGHT;
  const padX = 16;
  const padTop = 12;
  const padBottom = 28;
  const innerW = w - padX * 2;
  const innerH = h - padTop - padBottom;
  const step = points.length === 1 ? 0 : innerW / (points.length - 1);
  const base = padTop + innerH;
  const xy = points.map((point, i) => {
    const x = padX + i * step;
    const y = padTop + innerH - (Math.abs(point.netCents) / max) * innerH;
    return { ...point, x, y };
  });
  const line = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${xy[xy.length - 1].x.toFixed(1)},${base} L${xy[0].x.toFixed(1)},${base} Z`;

  return (
    <svg
      data-finance-history-chart=""
      viewBox={`0 0 ${w} ${h}`}
      className={FINANCE_CHART_CLASS}
      role="img"
      aria-label={FINANCE_CLIENT.history}
    >
      <path d={`M${padX},${base} H${w - padX}`} className="stroke-hairline" fill="none" strokeWidth="1" />
      <path d={area} fill="currentColor" opacity="0.18" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2" />
      {xy.map((point) => (
        <circle key={`${point.id}-dot`} cx={point.x} cy={point.y} r="3" fill="currentColor" />
      ))}
      {xy.map((point) => (
        <text
          key={point.id}
          x={point.x}
          y={h - 8}
          textAnchor="middle"
          className="fill-ink-3"
          fontSize="11"
        >
          {point.label}
        </text>
      ))}
    </svg>
  );
}
