import Link from "next/link";

import { Card, CardBody } from "@/components/ui/card";
import { HouseEmpty } from "@/components/chrome/house";
import {
  FINANCE_CLIENT,
  FINANCE_PAGE,
  formatUsdCents,
} from "@/lib/finance";
import {
  FINANCE_CARD_HOVER_CLASS,
  FINANCE_CARD_PAD_CLASS,
  FINANCE_HERO_CLASS,
  FINANCE_RELATED_CLASS,
  FINANCE_SECTION_CLASS,
  FINANCE_STACK_CLASS,
  FINANCE_STRIP_CELL_CLASS,
  FINANCE_STRIP_CLASS,
} from "@/lib/finance-craft";
import {
  invoiceAmountLabel,
  type ClientFinanceDashboard,
} from "@/lib/finance-dashboard";
import {
  FinanceStatusPill,
  NetHistoryChart,
  ThresholdMeterBar,
  TitleContributionBars,
} from "./finance-meters";

export function ClientFinanceDashboardView({ dashboard }: { dashboard: ClientFinanceDashboard }) {
  const latest = dashboard.latest;
  const org = latest?.statement.org ?? null;

  if (dashboard.history.length === 0) {
    return <HouseEmpty>{FINANCE_CLIENT.empty}</HouseEmpty>;
  }

  return (
    <div data-finance-dashboard="" className={FINANCE_STACK_CLASS}>
      <section data-finance-hero="" className={FINANCE_HERO_CLASS}>
        <p className="t-label text-ink-3">{FINANCE_CLIENT.glanceLatest}</p>
        {latest && org ? (
          <>
            <p className="mt-[var(--space-2)] t-display t-data text-ink">
              {formatUsdCents(org.netCents)}
            </p>
            <p className="mt-[var(--space-2)] t-body-sm text-ink-2">
              {latest.label} · {invoiceAmountLabel(latest.invoice)}
            </p>
          </>
        ) : (
          <p className="mt-[var(--space-2)] t-title text-ink">{FINANCE_CLIENT.glanceNone}</p>
        )}
      </section>

      {latest && org ? (
        <section className={FINANCE_SECTION_CLASS}>
          <h2 className="t-body font-medium text-ink">{FINANCE_CLIENT.overview}</h2>
          <div data-finance-contract-strip="" className={FINANCE_STRIP_CLASS}>
            <Metric label={FINANCE_CLIENT.glanceRate} value={dashboard.rateLabel} />
            <Metric
              label={FINANCE_PAGE.aggregatorKeep}
              value={formatUsdCents(org.aggregatorKeepCents)}
            />
            <Metric label={FINANCE_CLIENT.recoupVisible} value={formatUsdCents(org.recoupCents)} />
            <Metric
              label={FINANCE_CLIENT.adjustmentVisible}
              value={formatUsdCents(org.adjustmentCents)}
            />
            <Metric label={FINANCE_PAGE.opening} value={formatUsdCents(org.openingCents)} />
            <Metric
              label={FINANCE_PAGE.closing}
              value={formatUsdCents(org.close.closingBalanceCents)}
            />
          </div>
          <Card className="shadow-none">
            <CardBody className={FINANCE_CARD_PAD_CLASS}>
              <ThresholdMeterBar meter={latest.threshold} />
            </CardBody>
          </Card>
          {latest.contributions.length > 0 ? (
            <div className={FINANCE_RELATED_CLASS}>
              <h3 className="t-body-sm text-ink-2">{FINANCE_CLIENT.contribution}</h3>
              <TitleContributionBars contributions={latest.contributions} />
            </div>
          ) : null}
        </section>
      ) : null}

      <section className={FINANCE_SECTION_CLASS}>
        <h2 className="t-body font-medium text-ink">{FINANCE_CLIENT.history}</h2>
        <NetHistoryChart points={dashboard.chart} />
        <div className={FINANCE_SECTION_CLASS}>
          {dashboard.history.map((period) => (
            <Link
              key={period.id}
              href={period.href}
              data-finance-history-card={period.id}
              className="block"
            >
              <Card className={FINANCE_CARD_HOVER_CLASS}>
                <CardBody
                  className={`flex items-center justify-between gap-[var(--space-4)] ${FINANCE_CARD_PAD_CLASS}`}
                >
                  <div className={FINANCE_RELATED_CLASS}>
                    <span className="t-body font-medium text-ink">{period.label}</span>
                    <span className="t-data text-ink">
                      {period.netCents === null ? "—" : formatUsdCents(period.netCents)}
                    </span>
                  </div>
                  <span className="flex items-center gap-[var(--space-4)]">
                    <FinanceStatusPill status={period.status} />
                    <HistoryChevron />
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
    <div className={FINANCE_STRIP_CELL_CLASS}>
      <span className="t-label text-ink-3">{label}</span>
      <span className="t-data text-ink">{value}</span>
    </div>
  );
}

function HistoryChevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-4 shrink-0 text-ink-3"
      data-finance-history-chevron=""
    >
      <path
        d="M6 3.5 11 8l-5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
