import { Card, CardBody } from "@/components/ui/card";
import { FINANCE_PAGE, formatUsdCents } from "@/lib/finance";
import type { PeriodStatement, StatementPostedItem } from "@/lib/finance-statement";

function MoneyRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-4 t-body-sm text-ink-2">
      <span>{label}</span>
      <span className="text-ink">{value}</span>
    </p>
  );
}

function ItemizedList({ items }: { items: readonly StatementPostedItem[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.id} className="flex justify-between gap-4 t-body-sm text-ink-3">
          <span>
            {item.titleName ?? FINANCE_PAGE.orgRollup}
            {item.note ? ` · ${item.note}` : ""}
          </span>
          <span>{formatUsdCents(item.amountCents)}</span>
        </li>
      ))}
    </ul>
  );
}

export function PeriodStatementView({ statement }: { statement: PeriodStatement }) {
  const org = statement.org;
  const closeLabel = org?.close.kind === "payable" ? FINANCE_PAGE.payable : FINANCE_PAGE.carryForward;
  const closeAmount =
    org?.close.kind === "payable" ? org.netCents : (org?.close.closingBalanceCents ?? 0);

  return (
    <div data-finance-statement="" className="flex flex-col gap-[var(--space-8)]">
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
        <>
          <section className="flex flex-col gap-3">
            <h2 className="t-body font-medium text-ink">{FINANCE_PAGE.byTitle}</h2>
            {statement.titles.length === 0 ? (
              <p className="t-body-sm text-ink-3">{FINANCE_PAGE.unmapped}</p>
            ) : (
              statement.titles.map((title) => (
                <Card key={title.titleId}>
                  <CardBody className="flex flex-col gap-2" data-finance-title={title.titleId}>
                    <p className="t-body-sm font-medium text-ink">{title.titleName}</p>
                    <MoneyRow
                      label={FINANCE_PAGE.bankReceipt}
                      value={formatUsdCents(title.bankReceiptCents)}
                    />
                    <MoneyRow
                      label={`${FINANCE_PAGE.clientRate} ${org.clientRateBp / 100}%`}
                      value={`${FINANCE_PAGE.clientShare} ${formatUsdCents(title.clientShareCents)}`}
                    />
                    <MoneyRow
                      label={FINANCE_PAGE.aggregatorKeep}
                      value={formatUsdCents(title.aggregatorKeepCents)}
                    />
                    <ItemizedList items={[...title.recoupItems, ...title.adjustmentItems]} />
                  </CardBody>
                </Card>
              ))
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="t-body font-medium text-ink">{FINANCE_PAGE.orgRollup}</h2>
            <Card>
              <CardBody className="flex flex-col gap-2" data-finance-rollup="">
                <MoneyRow
                  label={FINANCE_PAGE.bankReceipt}
                  value={formatUsdCents(org.bankReceiptCents)}
                />
                <MoneyRow
                  label={`${FINANCE_PAGE.clientRate} ${org.clientRateBp / 100}%`}
                  value={`${FINANCE_PAGE.clientShare} ${formatUsdCents(org.clientShareCents)}`}
                />
                <MoneyRow
                  label={FINANCE_PAGE.aggregatorKeep}
                  value={formatUsdCents(org.aggregatorKeepCents)}
                />
                <MoneyRow
                  label={FINANCE_PAGE.opening}
                  value={formatUsdCents(org.openingCents)}
                />
                <MoneyRow label={FINANCE_PAGE.recoup} value={formatUsdCents(org.recoupCents)} />
                <ItemizedList items={statement.recoupItems} />
                <MoneyRow
                  label={FINANCE_PAGE.adjustments}
                  value={formatUsdCents(org.adjustmentCents)}
                />
                <ItemizedList items={statement.adjustmentItems} />
                {statement.staffSaleItems.length > 0 ? (
                  <>
                    <MoneyRow
                      label={FINANCE_PAGE.staffSale}
                      value={formatUsdCents(org.staffSaleCents)}
                    />
                    <ItemizedList items={statement.staffSaleItems} />
                  </>
                ) : null}
                <MoneyRow
                  label={FINANCE_PAGE.periodNet}
                  value={formatUsdCents(org.netCents)}
                />
                <MoneyRow
                  label={FINANCE_PAGE.thresholdCheck}
                  value={
                    org.thresholdCents === null ? "—" : formatUsdCents(org.thresholdCents)
                  }
                />
                <MoneyRow label={closeLabel} value={formatUsdCents(closeAmount)} />
              </CardBody>
            </Card>
          </section>
        </>
      ) : (
        <p className="t-body-sm text-ink-3">{FINANCE_PAGE.noTerm}</p>
      )}
    </div>
  );
}
