import Link from "next/link";

import { Card, CardBody } from "@/components/ui/card";
import { Stat, StatGrid } from "@/components/layout/stat";
import { HouseEmpty } from "@/components/chrome/house";
import {
  FINANCE_CLIENT,
  FINANCE_PAGE,
  formatUsdCents,
} from "@/lib/finance";
import {
  invoiceAmountLabel,
  type ClientFinanceDashboard,
} from "@/lib/finance-dashboard";
import { NetHistoryChart, ThresholdMeterBar, TitleContributionBars } from "./finance-meters";

export function ClientFinanceDashboardView({ dashboard }: { dashboard: ClientFinanceDashboard }) {
  const latest = dashboard.latest;
  const org = latest?.statement.org ?? null;

  if (dashboard.history.length === 0) {
    return <HouseEmpty>{FINANCE_CLIENT.empty}</HouseEmpty>;
  }

  return (
    <div data-finance-dashboard="" className="flex flex-col gap-[var(--space-8)]">
      <section className="rounded-[var(--radius-lg)] bg-band px-[var(--space-8)] py-[var(--space-8)] text-band-ink">
        <p className="t-label text-band-ink/50">{FINANCE_CLIENT.glanceLatest}</p>
        {latest && org ? (
          <>
            <p className="mt-[var(--space-2)] t-display t-data text-band-ink">
              {formatUsdCents(org.netCents)}
            </p>
            <p className="mt-[var(--space-2)] t-body-sm text-band-ink/60">
              {latest.label} · {invoiceAmountLabel(latest.invoice)}
            </p>
          </>
        ) : (
          <p className="mt-[var(--space-2)] t-title text-band-ink">{FINANCE_CLIENT.glanceNone}</p>
        )}
        <StatGrid surface="band" className="mt-[var(--space-8)]">
          <Stat surface="band" label={FINANCE_CLIENT.glanceRate} value={dashboard.rateLabel} />
          <Stat
            surface="band"
            label={FINANCE_PAGE.periodNet}
            value={org ? formatUsdCents(org.netCents) : "—"}
          />
          <Stat
            surface="band"
            label={FINANCE_CLIENT.glanceThreshold}
            value={
              latest?.threshold.thresholdCents == null
                ? FINANCE_CLIENT.glanceNoThreshold
                : formatUsdCents(latest.threshold.thresholdCents)
            }
          />
          <Stat
            surface="band"
            label={FINANCE_CLIENT.closedCount}
            value={String(dashboard.closedCount)}
            meta={`${dashboard.openCount} ${FINANCE_CLIENT.openCount.toLowerCase()}`}
          />
        </StatGrid>
      </section>

      {latest && org ? (
        <section className="flex flex-col gap-3">
          <h2 className="t-body font-medium text-ink">{FINANCE_CLIENT.overview}</h2>
          <Card>
            <CardBody className="flex flex-col gap-4">
              <ThresholdMeterBar meter={latest.threshold} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label={FINANCE_PAGE.opening} value={formatUsdCents(org.openingCents)} />
                <Metric
                  label={FINANCE_PAGE.closing}
                  value={formatUsdCents(org.close.closingBalanceCents)}
                />
                <Metric label={FINANCE_PAGE.clientShare} value={formatUsdCents(org.clientShareCents)} />
                <Metric
                  label={FINANCE_PAGE.aggregatorKeep}
                  value={formatUsdCents(org.aggregatorKeepCents)}
                />
                <Metric label={FINANCE_CLIENT.recoupVisible} value={formatUsdCents(org.recoupCents)} />
                <Metric
                  label={FINANCE_CLIENT.adjustmentVisible}
                  value={formatUsdCents(org.adjustmentCents)}
                />
              </div>
            </CardBody>
          </Card>
          {latest.contributions.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h3 className="t-body-sm text-ink-2">{FINANCE_CLIENT.contribution}</h3>
              <TitleContributionBars contributions={latest.contributions} />
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="t-body font-medium text-ink">{FINANCE_CLIENT.history}</h2>
        <NetHistoryChart points={dashboard.chart} />
        <div className="flex flex-col gap-3">
          {dashboard.history.map((period) => (
            <Link key={period.id} href={period.href} className="block">
              <Card className="transition-colors hover:border-accent">
                <CardBody className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="t-body font-medium text-ink">{period.label}</span>
                    <span className="t-body-sm text-ink-3">
                      {FINANCE_PAGE.opening} {formatUsdCents(period.openingCents)}
                      {period.netCents === null
                        ? ""
                        : ` · ${FINANCE_PAGE.periodNet} ${formatUsdCents(period.netCents)}`}
                    </span>
                  </div>
                  <span className="t-label text-ink-2">
                    {period.status === "closed" ? FINANCE_PAGE.statusClosed : FINANCE_PAGE.statusOpen}
                  </span>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="t-label text-ink-3">{label}</span>
      <span className="t-data text-ink">{value}</span>
    </div>
  );
}
