import { TextAction } from "@/components/chrome/house";
import { DashboardHomePanel } from "@/components/dashboard/dashboard-home";
import {
  FINANCE_CLIENT,
  FINANCE_CLIENT_HREF,
  FINANCE_HREF,
  FINANCE_PAGE,
} from "@/lib/finance";
import type { ClientFinanceGlance } from "@/lib/finance-glance";

// Staff stub stays the Slice 1 rail pointer. Client glance is a house card:
// rate, balance/threshold, latest closed statement, Sporty Blue Finance CTA.

export function DashboardFinanceGlance() {
  return (
    <div data-finance-glance-stub="" className="flex flex-col gap-[var(--space-2)]">
      <p className="t-body-sm text-ink-3">{FINANCE_PAGE.glance}</p>
      <TextAction href={FINANCE_HREF}>{FINANCE_PAGE.glanceCta}</TextAction>
    </div>
  );
}

export function DashboardClientFinanceGlance({ glance }: { glance: ClientFinanceGlance }) {
  const metrics = [
    { key: "rate", label: FINANCE_CLIENT.glanceRate, value: glance.rateLabel },
    { key: "balance", label: FINANCE_CLIENT.glanceBalance, value: glance.balanceLabel },
    { key: "threshold", label: FINANCE_CLIENT.glanceThreshold, value: glance.thresholdLabel },
    { key: "latest", label: FINANCE_CLIENT.glanceLatest, value: glance.latestLabel },
  ] as const;

  return (
    <DashboardHomePanel data-finance-glance="" aria-label={FINANCE_CLIENT.title}>
      <div className="flex items-center justify-between gap-[var(--space-4)] px-[var(--space-6)] py-[var(--space-4)]">
        <p className="t-label text-ink-3">{FINANCE_CLIENT.title}</p>
        <TextAction href={FINANCE_CLIENT_HREF}>{FINANCE_CLIENT.glanceCta}</TextAction>
      </div>
      <dl className="grid grid-cols-2 gap-px overflow-hidden border-t border-hairline bg-hairline sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            data-finance-glance-metric={metric.key}
            data-finance-glance-rate={metric.key === "rate" ? "" : undefined}
            data-finance-glance-balance={metric.key === "balance" ? "" : undefined}
            data-finance-glance-threshold={metric.key === "threshold" ? "" : undefined}
            data-finance-glance-latest={metric.key === "latest" ? "" : undefined}
            className="flex flex-col gap-[var(--space-2)] bg-surface px-[var(--space-6)] py-[var(--space-4)]"
          >
            <dt className="t-label text-ink-3">{metric.label}</dt>
            <dd className="t-data t-body text-ink">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </DashboardHomePanel>
  );
}
