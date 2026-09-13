import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { DETAIL_LIST, rangeFor } from "@/lib/list-bounds";
import {
  FINANCE_HREF,
  FINANCE_PAGE,
  financePeriodLabel,
  formatUsdCents,
  staffCanWriteFinance,
} from "@/lib/finance";
import { PeriodStatementView } from "@/components/finance/period-statement";
import { assemblePeriodStatement } from "@/lib/finance-statement";
import {
  ClosePeriodForm,
  ExternalIdForm,
  ImportSalesForm,
  MapImportForm,
  MapLineForm,
  MoveToSuspenseForm,
  PostLedgerForm,
  ThresholdForm,
} from "../finance-forms";

export default async function GcFinancePeriodPage({
  params,
}: {
  params: Promise<{ periodId: string }>;
}) {
  const { periodId } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();

  const { data: period } = await supabase
    .from("finance_periods")
    .select(
      "id, org_id, period_year, period_month, status, opening_balance_cents, closing_balance_cents, threshold_cents, organizations(name)",
    )
    .eq("id", periodId)
    .maybeSingle();
  if (!period) notFound();

  const [
    { data: staff },
    { data: titleRows },
    { data: importRows },
    { data: lineRows },
    { data: ledgerRows },
    { data: term },
    { data: jobRows },
  ] = await Promise.all([
      user
        ? supabase.from("gc_staff").select("role").eq("user_id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("titles")
        .select("id, title, catalog_id")
        .eq("org_id", period.org_id)
        .order("title")
        .range(...rangeFor(DETAIL_LIST)),
      supabase
        .from("sales_imports")
        .select("id, filename, content_hash, s3_key, status, imported_at")
        .eq("period_id", periodId)
        .order("imported_at", { ascending: false })
        .range(...rangeFor(DETAIL_LIST)),
      supabase
        .from("sales_lines")
        .select(
          "id, import_id, line_no, endpoint, external_id, title_id, bank_receipt_cents, reported_cents, transaction_date, raw",
        )
        .eq("period_id", periodId)
        .order("line_no")
        .range(...rangeFor(DETAIL_LIST)),
      supabase
        .from("ledger_entries")
        .select("id, kind, amount_cents, title_id, note, posted_at, sales_line_id, source_refs")
        .eq("period_id", periodId)
        .order("posted_at")
        .range(...rangeFor(DETAIL_LIST)),
      supabase
        .from("contract_terms")
        .select("revenue_share_rate_bp")
        .eq("org_id", period.org_id)
        .is("effective_to", null)
        .order("effective_from", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("finance_jobs")
        .select("id, kind, status")
        .eq("period_id", periodId)
        .eq("org_id", period.org_id)
        .in("status", ["queued", "running"])
        .range(...rangeFor(DETAIL_LIST)),
    ]);

  const canWrite = staffCanWriteFinance(staff?.role) && period.status === "open";
  const titles = (titleRows ?? []).map((t) => ({
    id: t.id,
    title: t.catalog_id ? `${t.title} · ${t.catalog_id}` : t.title,
  }));
  const unmapped = (lineRows ?? []).filter((line) => !line.title_id);
  const orgName = Array.isArray(period.organizations)
    ? period.organizations[0]?.name
    : period.organizations?.name;
  const titleById = new Map((titleRows ?? []).map((t) => [t.id, t.title]));
  const ledger = ledgerRows ?? [];
  const closeQueued = (jobRows ?? []).some(
    (job) => job.kind === "close" && (job.status === "queued" || job.status === "running"),
  );
  const statement = assemblePeriodStatement({
    postedOnly: true,
    clientRateBp: term?.revenue_share_rate_bp ?? null,
    openingCents: period.opening_balance_cents,
    thresholdCents: period.threshold_cents,
    titles: (titleRows ?? []).map((t) => ({ id: t.id, title: t.title })),
    imports: (importRows ?? []).map((imp) => ({
      id: imp.id,
      filename: imp.filename,
      content_hash: imp.content_hash,
    })),
    lines: lineRows ?? [],
    ledger,
  });

  return (
    <>
      <PageHeader
        title={financePeriodLabel(period.period_year, period.period_month)}
        subtitle={`${orgName ?? "—"} · ${period.status === "closed" ? FINANCE_PAGE.statusClosed : FINANCE_PAGE.statusOpen}`}
        backLink={{ href: FINANCE_HREF, label: FINANCE_PAGE.title }}
      />

      <div className="mb-[var(--space-6)] flex flex-wrap gap-x-6 gap-y-2 t-body-sm text-ink-2">
        <span>
          {FINANCE_PAGE.opening} {formatUsdCents(period.opening_balance_cents)}
        </span>
        {period.closing_balance_cents !== null ? (
          <span>
            {FINANCE_PAGE.closing} {formatUsdCents(period.closing_balance_cents)}
          </span>
        ) : null}
        <span>
          {FINANCE_PAGE.threshold}{" "}
          {period.threshold_cents === null ? "—" : formatUsdCents(period.threshold_cents)}
        </span>
      </div>

      <div className="flex flex-col gap-[var(--space-8)]">
        {canWrite ? (
          <>
            <section className="flex flex-col gap-3">
              <h2 className="t-body font-medium text-ink">{FINANCE_PAGE.import}</h2>
              <ImportSalesForm periodId={periodId} />
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="t-body font-medium text-ink">{FINANCE_PAGE.map}</h2>
              <ExternalIdForm periodId={periodId} titles={titles} />
              {(importRows ?? []).map((imp) => (
                <div key={imp.id} className="flex items-center justify-between gap-3">
                  <span className="t-body-sm text-ink-2">
                    {imp.filename} · {imp.status}
                  </span>
                  <MapImportForm importId={imp.id} periodId={periodId} />
                </div>
              ))}
              {unmapped.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <h3 className="t-body-sm text-ink-2">{FINANCE_PAGE.unmapped}</h3>
                  {unmapped.map((line) => (
                    <Card key={line.id}>
                      <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="t-body-sm text-ink">
                          {line.endpoint} · {line.external_id} · {formatUsdCents(line.bank_receipt_cents)}
                        </span>
                        <MapLineForm lineId={line.id} periodId={periodId} titles={titles} />
                      </CardBody>
                    </Card>
                  ))}
                  <MoveToSuspenseForm
                    periodId={periodId}
                    lines={unmapped.map((line) => ({
                      id: line.id,
                      endpoint: line.endpoint,
                      external_id: line.external_id,
                    }))}
                  />
                </div>
              ) : null}
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="t-body font-medium text-ink">{FINANCE_PAGE.post}</h2>
              <PostLedgerForm periodId={periodId} titles={titles} />
            </section>

            <section className="flex flex-col gap-3">
              <ThresholdForm periodId={periodId} thresholdCents={period.threshold_cents} />
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="t-body font-medium text-ink">{FINANCE_PAGE.close}</h2>
              {closeQueued ? (
                <p className="t-body-sm text-ink-2">{FINANCE_PAGE.closeQueued}</p>
              ) : (
                <ClosePeriodForm periodId={periodId} />
              )}
            </section>
          </>
        ) : period.status === "open" ? (
          <p className="t-body-sm text-ink-3">{FINANCE_PAGE.writeDenied}</p>
        ) : null}

        <section className="flex flex-col gap-3">
          <h2 className="t-body font-medium text-ink">{FINANCE_PAGE.statement}</h2>
          <PeriodStatementView statement={statement} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="t-body font-medium text-ink">{FINANCE_PAGE.ledger}</h2>
          {(ledgerRows ?? []).length === 0 ? (
            <p className="t-body-sm text-ink-3">No ledger rows.</p>
          ) : (
            <Card>
              <CardBody className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="t-label py-2 font-normal text-ink-3">Kind</th>
                      <th className="t-label py-2 font-normal text-ink-3">Title</th>
                      <th className="t-label py-2 text-right font-normal text-ink-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ledgerRows ?? []).map((row) => (
                      <tr key={row.id} className="border-t border-hairline">
                        <td className="t-body-sm py-2 text-ink">{row.kind}</td>
                        <td className="t-body-sm py-2 text-ink-3">
                          {row.title_id ? (titleById.get(row.title_id) ?? row.title_id) : "Org"}
                        </td>
                        <td className="t-body-sm py-2 text-right text-ink">
                          {formatUsdCents(row.amount_cents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}
        </section>
      </div>
    </>
  );
}
