import { Card, CardBody } from "@/components/ui/card";
import { Stat, StatGrid } from "@/components/layout/stat";
import {
  FINANCE_CLIENT,
  FINANCE_PAGE,
  formatClientRateBp,
  formatUsdCents,
} from "@/lib/finance";
import {
  invoiceAmountLabel,
  selfBillingInvoice,
  thresholdMeter,
  titleContributionShares,
} from "@/lib/finance-dashboard";
import type { PeriodStatement, StatementPostedItem } from "@/lib/finance-statement";
import { ThresholdMeterBar, TitleContributionBars } from "./finance-meters";

export function ClientPeriodDashboard({ statement }: { statement: PeriodStatement }) {
  const org = statement.org;
  const invoice = selfBillingInvoice(org);
  const contributions = titleContributionShares(statement.titles);

  return (
    <div data-finance-dashboard="" className="flex flex-col gap-[var(--space-8)]">
      {org ? (
        <section className="rounded-[var(--radius-lg)] bg-band px-[var(--space-8)] py-[var(--space-8)] text-band-ink">
          <p className="t-label text-band-ink/50">{FINANCE_CLIENT.overview}</p>
          <p className="mt-[var(--space-2)] t-display t-data text-band-ink">
            {formatUsdCents(org.netCents)}
          </p>
          <p className="mt-[var(--space-2)] t-body-sm text-band-ink/60">
            {invoiceAmountLabel(invoice)}
          </p>
          <StatGrid surface="band" className="mt-[var(--space-8)]">
            <Stat
              surface="band"
              label={FINANCE_CLIENT.glanceRate}
              value={formatClientRateBp(org.clientRateBp)}
            />
            <Stat surface="band" label={FINANCE_PAGE.opening} value={formatUsdCents(org.openingCents)} />
            <Stat
              surface="band"
              label={FINANCE_PAGE.closing}
              value={formatUsdCents(org.close.closingBalanceCents)}
            />
            <Stat
              surface="band"
              label={FINANCE_PAGE.threshold}
              value={
                org.thresholdCents === null
                  ? FINANCE_CLIENT.glanceNoThreshold
                  : formatUsdCents(org.thresholdCents)
              }
            />
          </StatGrid>
        </section>
      ) : (
        <p className="t-body-sm text-ink-3">{FINANCE_PAGE.noTerm}</p>
      )}

      {org ? (
        <section className="flex flex-col gap-3">
          <h2 className="t-body font-medium text-ink">{FINANCE_CLIENT.overview}</h2>
          <Card>
            <CardBody className="flex flex-col gap-4">
              <ThresholdMeterBar
                meter={thresholdMeter(org.netCents, org.thresholdCents, org.thresholdMet)}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label={FINANCE_PAGE.bankReceipt} value={formatUsdCents(org.bankReceiptCents)} />
                <Metric label={FINANCE_PAGE.clientShare} value={formatUsdCents(org.clientShareCents)} />
                <Metric
                  label={FINANCE_PAGE.aggregatorKeep}
                  value={formatUsdCents(org.aggregatorKeepCents)}
                />
                <Metric
                  label={org.close.kind === "payable" ? FINANCE_PAGE.payable : FINANCE_PAGE.carryForward}
                  value={formatUsdCents(
                    org.close.kind === "payable" ? org.netCents : org.close.closingBalanceCents,
                  )}
                />
              </div>
            </CardBody>
          </Card>
        </section>
      ) : null}

      <PostedSection
        title={FINANCE_CLIENT.recoupVisible}
        items={statement.recoupItems}
        total={org?.recoupCents ?? 0}
      />
      <PostedSection
        title={FINANCE_CLIENT.adjustmentVisible}
        items={statement.adjustmentItems}
        total={org?.adjustmentCents ?? 0}
      />

      <section className="flex flex-col gap-3">
        <h2 className="t-body font-medium text-ink">{FINANCE_CLIENT.contribution}</h2>
        {contributions.length === 0 ? (
          <p className="t-body-sm text-ink-3">{FINANCE_PAGE.unmapped}</p>
        ) : (
          <TitleContributionBars contributions={contributions} />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="t-body font-medium text-ink">{FINANCE_PAGE.source}</h2>
        <p className="t-body-sm text-ink-3">{FINANCE_PAGE.sourceHint}</p>
        {statement.sourceLines.length === 0 ? (
          <p className="t-body-sm text-ink-3">{FINANCE_PAGE.sourceEmpty}</p>
        ) : (
          <Card>
            <CardBody className="overflow-x-auto" data-finance-source="">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="t-label py-2 font-normal text-ink-3">{FINANCE_PAGE.endpoint}</th>
                    <th className="t-label py-2 font-normal text-ink-3">{FINANCE_PAGE.externalId}</th>
                    <th className="t-label py-2 font-normal text-ink-3">{FINANCE_PAGE.mappedTitle}</th>
                    <th className="t-label py-2 text-right font-normal text-ink-3">
                      {FINANCE_PAGE.reported}
                    </th>
                    <th className="t-label py-2 text-right font-normal text-ink-3">
                      {FINANCE_PAGE.bankReceipt}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statement.sourceLines.map((line) => (
                    <tr key={line.id} className="border-t border-hairline">
                      <td className="t-body-sm py-2 text-ink">{line.endpoint}</td>
                      <td className="t-body-sm py-2 text-ink-3">{line.externalId}</td>
                      <td className="t-body-sm py-2 text-ink-3">
                        {line.titleName ?? FINANCE_PAGE.unmapped}
                      </td>
                      <td className="t-body-sm py-2 text-right text-ink-3">
                        {line.reportedCents === null ? "—" : formatUsdCents(line.reportedCents)}
                      </td>
                      <td className="t-body-sm py-2 text-right text-ink">
                        {formatUsdCents(line.bankReceiptCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        )}
      </section>

      {org ? (
        <section className="flex flex-col gap-3">
          <h2 className="t-body font-medium text-ink">{FINANCE_PAGE.orgRollup}</h2>
          <Card>
            <CardBody className="flex flex-col gap-2" data-finance-rollup="">
              <MetricRow label={FINANCE_PAGE.periodNet} value={formatUsdCents(org.netCents)} />
              <MetricRow
                label={FINANCE_PAGE.clientShare}
                value={formatUsdCents(org.clientShareCents)}
              />
              <MetricRow
                label={FINANCE_PAGE.aggregatorKeep}
                value={formatUsdCents(org.aggregatorKeepCents)}
              />
            </CardBody>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function PostedSection({
  title,
  items,
  total,
}: {
  title: string;
  items: readonly StatementPostedItem[];
  total: number;
}) {
  return (
    <section className="flex flex-col gap-3" data-finance-posted={title}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="t-body font-medium text-ink">{title}</h2>
        <span className="t-data text-ink">{formatUsdCents(total)}</span>
      </div>
      {items.length === 0 ? (
        <p className="t-body-sm text-ink-3">{FINANCE_CLIENT.nonePosted}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 t-body-sm text-ink-2">
              <span>
                {item.titleName ?? FINANCE_PAGE.orgRollup}
                {item.note ? ` · ${item.note}` : ""}
              </span>
              <span className="text-ink">{formatUsdCents(item.amountCents)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
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

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-4 t-body-sm text-ink-2">
      <span>{label}</span>
      <span className="text-ink">{value}</span>
    </p>
  );
}
