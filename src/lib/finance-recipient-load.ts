import "server-only";

import { notFound } from "next/navigation";

import { DETAIL_LIST, LIST_PAGE, rangeFor } from "@/lib/list-bounds";
import { assertRecipientOrgIsolation, recipientVisibleSalesLines } from "@/lib/finance";
import { assemblePeriodStatement, type PeriodStatement } from "@/lib/finance-statement";
import { createClient } from "@/lib/supabase/server";

export type RecipientPeriod = {
  id: string;
  org_id: string;
  period_year: number;
  period_month: number;
  status: "open" | "closed";
  opening_balance_cents: number;
  closing_balance_cents: number | null;
  threshold_cents: number | null;
};

export async function loadRecipientPeriod(
  periodId: string,
  orgId: string,
): Promise<RecipientPeriod> {
  const supabase = await createClient();
  const { data: period } = await supabase
    .from("finance_periods")
    .select(
      "id, org_id, period_year, period_month, status, opening_balance_cents, closing_balance_cents, threshold_cents",
    )
    .eq("id", periodId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!period) notFound();
  assertRecipientOrgIsolation(period.org_id, orgId);
  return period;
}

export async function loadRecipientStatement(
  period: RecipientPeriod,
  orgId: string,
): Promise<PeriodStatement> {
  assertRecipientOrgIsolation(period.org_id, orgId);
  const supabase = await createClient();
  const [{ data: titleRows }, { data: importRows }, { data: lineRows }, { data: ledgerRows }, { data: term }] =
    await Promise.all([
      supabase
        .from("titles")
        .select("id, title")
        .eq("org_id", orgId)
        .order("title")
        .range(...rangeFor(DETAIL_LIST)),
      supabase
        .from("sales_imports")
        .select("id, filename, content_hash")
        .eq("period_id", period.id)
        .eq("org_id", orgId)
        .order("imported_at", { ascending: false })
        .range(...rangeFor(DETAIL_LIST)),
      supabase
        .from("sales_lines")
        .select(
          "id, import_id, period_id, line_no, endpoint, external_id, title_id, bank_receipt_cents, reported_cents, transaction_date, raw",
        )
        .eq("period_id", period.id)
        .eq("org_id", orgId)
        .not("period_id", "is", null)
        .order("line_no")
        .range(...rangeFor(DETAIL_LIST)),
      supabase
        .from("ledger_entries")
        .select("id, kind, amount_cents, title_id, note, sales_line_id, source_refs")
        .eq("period_id", period.id)
        .eq("org_id", orgId)
        .order("posted_at")
        .range(...rangeFor(DETAIL_LIST)),
      supabase
        .from("contract_terms")
        .select("revenue_share_rate_bp")
        .eq("org_id", orgId)
        .is("effective_to", null)
        .order("effective_from", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  return assemblePeriodStatement({
    postedOnly: true,
    clientRateBp: term?.revenue_share_rate_bp ?? null,
    openingCents: period.opening_balance_cents,
    thresholdCents: period.threshold_cents,
    titles: titleRows ?? [],
    imports: (importRows ?? []).map((imp) => ({
      id: imp.id,
      filename: imp.filename,
      content_hash: imp.content_hash,
    })),
    lines: recipientVisibleSalesLines(lineRows ?? []),
    ledger: ledgerRows ?? [],
  });
}

export async function loadRecipientDashboard(orgId: string): Promise<{
  periods: RecipientPeriod[];
  latestClosed: RecipientPeriod | null;
  latestStatement: PeriodStatement | null;
  ledger: Array<{ period_id: string; kind: string; amount_cents: number }>;
  clientRateBp: number | null;
}> {
  assertRecipientOrgIsolation(orgId, orgId);
  const supabase = await createClient();
  const [{ data: periodRows }, { data: term }] = await Promise.all([
    supabase
      .from("finance_periods")
      .select(
        "id, org_id, period_year, period_month, status, opening_balance_cents, closing_balance_cents, threshold_cents",
      )
      .eq("org_id", orgId)
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false })
      .range(...rangeFor(LIST_PAGE)),
    supabase
      .from("contract_terms")
      .select("revenue_share_rate_bp")
      .eq("org_id", orgId)
      .is("effective_to", null)
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const periods = (periodRows ?? []).filter((period) => period.org_id === orgId);
  const latestClosed = periods.find((period) => period.status === "closed") ?? null;
  const periodIds = periods.map((period) => period.id);
  const { data: ledgerRows } =
    periodIds.length === 0
      ? { data: [] }
      : await supabase
          .from("ledger_entries")
          .select("period_id, kind, amount_cents")
          .eq("org_id", orgId)
          .in("period_id", periodIds)
          .range(...rangeFor(DETAIL_LIST));

  const ledger = (ledgerRows ?? []).filter((row) => periodIds.includes(row.period_id));
  const latestStatement = latestClosed ? await loadRecipientStatement(latestClosed, orgId) : null;

  return {
    periods,
    latestClosed,
    latestStatement,
    ledger,
    clientRateBp: term?.revenue_share_rate_bp ?? null,
  };
}
