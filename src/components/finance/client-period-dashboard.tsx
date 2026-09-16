import { Card, CardBody } from "@/components/ui/card";
import {
  FINANCE_CLIENT,
  FINANCE_PAGE,
  formatClientRateBp,
  formatUsdCents,
} from "@/lib/finance";
import {
  FINANCE_CARD_PAD_CLASS,
  FINANCE_HERO_CLASS,
  FINANCE_RELATED_CLASS,
  FINANCE_SECTION_CLASS,
  FINANCE_SOURCE_MONEY_CLASS,
  FINANCE_STACK_CLASS,
  FINANCE_STRIP_CELL_CLASS,
  FINANCE_STRIP_CLASS,
} from "@/lib/finance-craft";
import {
  invoiceAmountLabel,
  selfBillingInvoice,
  thresholdMeter,
  titleContributionShares,
} from "@/lib/finance-dashboard";
import type { PeriodStatement, StatementPostedItem } from "@/lib/finance-statement";
import { FinanceStatusPill, ThresholdMeterBar, TitleContributionBars } from "./finance-meters";

export function ClientPeriodDashboard({
  statement,
  orgName,
  periodLabel,
  status,
}: {
  statement: PeriodStatement;
  orgName: string;
  periodLabel: string;
  status: "open" | "closed";
}) {
  const org = statement.org;
  const invoice = selfBillingInvoice(org);
  const contributions = titleContributionShares(statement.titles);
  const closeKind = org?.close.kind ?? null;

  return (
    <div data-finance-dashboard="" data-finance-statement-doc="" className={FINANCE_STACK_CLASS}>
      <header data-finance-statement-header="" className={FINANCE_HERO_CLASS}>
        <p className="t-label text-ink-3">{orgName}</p>
        <p className="mt-[var(--space-2)] t-statement text-ink">{periodLabel}</p>
        <div className="mt-[var(--space-4)] flex flex-wrap items-center gap-[var(--space-4)]">
          <FinanceStatusPill status={status} />
          <span className="t-data t-body-sm text-ink-2">{formatClientRateBp(org?.clientRateBp ?? null)}</span>
        </div>
        {org ? (
          <>
            <p className="mt-[var(--space-6)] t-display t-data text-ink">
              {formatUsdCents(org.netCents)}
            </p>
            <p
              data-finance-close-outcome=""
              className="mt-[var(--space-2)] t-body-sm text-ink-2"
            >
              {invoiceAmountLabel(invoice)}
            </p>
          </>
        ) : (
          <p className="mt-[var(--space-6)] t-body-sm text-ink-3">{FINANCE_PAGE.noTerm}</p>
        )}
      </header>

      {org ? (
        <section className={FINANCE_SECTION_CLASS}>
          <h2 className="t-body font-medium text-ink">{FINANCE_CLIENT.overview}</h2>
          <div data-finance-contract-strip="" className={FINANCE_STRIP_CLASS}>
            <Metric label={FINANCE_CLIENT.glanceRate} value={formatClientRateBp(org.clientRateBp)} />
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
              <ThresholdMeterBar
                meter={thresholdMeter(org.netCents, org.thresholdCents, org.thresholdMet)}
              />
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

      <section className={FINANCE_SECTION_CLASS}>
        <h2 className="t-body font-medium text-ink">{FINANCE_CLIENT.contribution}</h2>
        {contributions.length === 0 ? (
          <p className="t-body-sm text-ink-3">{FINANCE_PAGE.unmapped}</p>
        ) : (
          <TitleContributionBars contributions={contributions} />
        )}
      </section>

      <section className={FINANCE_SECTION_CLASS}>
        <h2 className="t-body font-medium text-ink">{FINANCE_PAGE.source}</h2>
        <p className="t-body-sm text-ink-3">{FINANCE_PAGE.sourceHint}</p>
        {statement.sourceLines.length === 0 ? (
          <p className="t-body-sm text-ink-3">{FINANCE_PAGE.sourceEmpty}</p>
        ) : (
          <Card className="shadow-none">
            <CardBody className={`overflow-x-auto ${FINANCE_CARD_PAD_CLASS}`} data-finance-source="">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="t-label py-[var(--space-2)] font-normal text-ink-3">
                      {FINANCE_PAGE.endpoint}
                    </th>
                    <th className="t-label py-[var(--space-2)] font-normal text-ink-3">
                      {FINANCE_PAGE.externalId}
                    </th>
                    <th className="t-label py-[var(--space-2)] font-normal text-ink-3">
                      {FINANCE_PAGE.mappedTitle}
                    </th>
                    <th className="t-label py-[var(--space-2)] text-right font-normal text-ink-3">
                      {FINANCE_PAGE.reported}
                    </th>
                    <th className="t-label py-[var(--space-2)] text-right font-normal text-ink-3">
                      {FINANCE_PAGE.bankReceipt}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statement.sourceLines.map((line) => (
                    <tr key={line.id} className="border-t border-hairline">
                      <td className="t-body-sm py-[var(--space-2)] text-ink">{line.endpoint}</td>
                      <td className="t-body-sm py-[var(--space-2)] text-ink-3">{line.externalId}</td>
                      <td className="t-body-sm py-[var(--space-2)] text-ink-3">
                        {line.titleName ?? FINANCE_PAGE.unmapped}
                      </td>
                      <td className="t-body-sm py-[var(--space-2)] text-right text-ink-3">
                        <span className="t-data">
                          {line.reportedCents === null ? "—" : formatUsdCents(line.reportedCents)}
                        </span>
                      </td>
                      <td className={`t-body-sm py-[var(--space-2)] ${FINANCE_SOURCE_MONEY_CLASS}`}>
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
        <section className={FINANCE_SECTION_CLASS}>
          <h2 className="t-body font-medium text-ink">{FINANCE_PAGE.orgRollup}</h2>
          <Card className="shadow-none">
            <CardBody className={`${FINANCE_RELATED_CLASS} ${FINANCE_CARD_PAD_CLASS}`} data-finance-rollup="">
              <MetricRow label={FINANCE_PAGE.periodNet} value={formatUsdCents(org.netCents)} />
              <MetricRow
                label={FINANCE_PAGE.clientShare}
                value={formatUsdCents(org.clientShareCents)}
              />
              <MetricRow
                label={FINANCE_PAGE.aggregatorKeep}
                value={formatUsdCents(org.aggregatorKeepCents)}
              />
              <p data-finance-close-kind="" className="flex justify-between gap-[var(--space-4)] t-body-sm text-ink">
                <span>{closeKind === "payable" ? FINANCE_PAGE.payable : FINANCE_PAGE.carryForward}</span>
                <span className="t-data">
                  {formatUsdCents(
                    closeKind === "payable" ? org.netCents : org.close.closingBalanceCents,
                  )}
                </span>
              </p>
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
    <section className={FINANCE_SECTION_CLASS} data-finance-posted={title}>
      <div className="flex items-baseline justify-between gap-[var(--space-4)]">
        <h2 className="t-body font-medium text-ink">{title}</h2>
        <span className="t-data text-ink">{formatUsdCents(total)}</span>
      </div>
      {items.length === 0 ? (
        <p className="t-body-sm text-ink-3">{FINANCE_CLIENT.nonePosted}</p>
      ) : (
        <ul className={FINANCE_RELATED_CLASS}>
          {items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between gap-[var(--space-4)] t-body-sm text-ink-2"
            >
              <span>
                {item.titleName ?? FINANCE_PAGE.orgRollup}
                {item.note ? ` · ${item.note}` : ""}
              </span>
              <span className="t-data text-ink">{formatUsdCents(item.amountCents)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
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

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-[var(--space-4)] t-body-sm text-ink-2">
      <span>{label}</span>
      <span className="t-data text-ink">{value}</span>
    </p>
  );
}
