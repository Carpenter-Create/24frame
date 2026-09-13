import { PRODUCT_NAME } from "@/lib/product";

// Staff ops copy + client recipient copy. Ops write path stays /gc/finance.
// Recipient read path is /finance. Official complementary-split lock: display
// client % and remainder only. Do not invent a second fee field.

export const FINANCE_HREF = "/gc/finance";
export const FINANCE_CLIENT_HREF = "/finance";

export const FINANCE_WRITE_RPCS = [
  "create_finance_period",
  "import_sales",
  "request_sales_import",
  "apply_sales_import",
  "close_finance_period",
  "apply_finance_close",
  "apply_finance_export",
  "post_ledger_entry",
  "set_finance_period_threshold",
  "map_sales_import",
  "map_sales_line",
  "upsert_title_external_id",
  "move_sales_lines_to_suspense",
  "assign_suspense_lines_to_period",
] as const;

export const FINANCE_PAGE = {
  title: "Finance",
  subtitle: "Monthly periods. Import, map, post, close.",
  empty: "No periods yet.",
  create: "Open period",
  org: "Organization",
  period: "Period",
  year: "Year",
  month: "Month",
  threshold: "Payable threshold (cents)",
  thresholdHint: "Staff-set. Blank means close always carries the balance.",
  opening: "Opening",
  closing: "Closing",
  payable: "Payable",
  statusOpen: "Open",
  statusClosed: "Closed",
  import: "Import sales",
  importHint:
    "Excel or CSV. USD only. Bytes go to the finance bucket. The worker parses; this screen does not recompute money.",
  importQueued: "Import queued for the finance worker.",
  map: "Map endpoint ids",
  mapHint: "Resolve vendor ids onto this organization’s titles only.",
  mapImport: "Apply mappings",
  post: "Post ledger",
  postHint: "Recoup, adjustment, or sale. Amounts are signed cents as entered.",
  close: "Close period",
  closeHint:
    "Queues close for the finance worker. The worker applies client share, recoup, and threshold. Map remaining lines or move them to Suspense first.",
  closeQueued: "Close queued. The worker posts ledger entries; this screen does not recompute money.",
  suspense: "Suspense",
  suspenseHint:
    "Parked unmapped lines. Assign to an open period for that organization, then map.",
  suspenseEmpty: "No parked lines.",
  toSuspense: "Move to Suspense",
  assignPeriod: "Assign to period",
  originPeriod: "Original period",
  imported: "Imported",
  statement: "Period math",
  source: "Endpoint input",
  sourceHint: "As received. Bank receipt is the compute gross.",
  sourceEmpty: "No sales lines.",
  endpoint: "Endpoint",
  externalId: "Endpoint id",
  reported: "Reported",
  mappedTitle: "Title",
  byTitle: "By title",
  orgRollup: "Organization",
  bankReceipt: "Bank receipt",
  clientRate: "Client share rate",
  clientShare: "Client share",
  aggregatorKeep: "Aggregator keep",
  recoup: "Recoup",
  adjustments: "Adjustments",
  staffSale: "Posted sale",
  periodNet: "Period net",
  thresholdCheck: "Threshold",
  carryForward: "Carry-forward",
  noTerm: "No current contract term. Client share is not invented.",
  unmapped: "Unmapped lines",
  ledger: "Ledger",
  glance: `Finance periods live on the ${PRODUCT_NAME} Finance rail.`,
  glanceCta: "Finance",
  writeDenied: "Import, post, and close are limited to owner and accountant seats.",
  usd: "USD",
} as const;

export const FINANCE_CLIENT = {
  title: "Finance",
  subtitle: "Organization purse. Monthly periods. USD.",
  empty: "No statements yet.",
  notYet: "This period is not closed yet.",
  noAccess: "Finance is not available on this seat.",
  noOrg: "Choose an organization to read statements.",
  pack: "Download pack",
  pdf: "Branded PDF",
  csv: "Raw CSV",
  exportQueued: "Export queued. Refresh shortly.",
  overview: "Overview",
  history: "Statement history",
  contribution: "Title contribution",
  recoupVisible: "Recoupment",
  adjustmentVisible: "Adjustments",
  invoice: "Self-billing invoice",
  invoiceHint: "For your records. Documents the period settlement. It does not move funds.",
  amountDue: "Amount due",
  settlementCarry: "Carried forward",
  thresholdVsNet: "Threshold versus net",
  nonePosted: "None posted.",
  closedCount: "Closed",
  openCount: "Open",
  glanceRate: "Client share",
  glanceBalance: "Balance",
  glanceThreshold: "Threshold",
  glanceLatest: "Latest statement",
  glanceNone: "No closed statement yet.",
  glanceNoTerm: "No current term",
  glanceNoThreshold: "No threshold",
  glanceCta: "Finance",
} as const;

export const FINANCE_LOGIC_VERSION = "finance-ops-slice-1.1-client-tier-remainder";

export const LEDGER_POST_KINDS = ["recoup", "adjustment", "sale"] as const;
export type LedgerPostKind = (typeof LEDGER_POST_KINDS)[number];

export type FinancePeriodStatus = "open" | "closed";

export function financePeriodLabel(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function formatUsdCents(cents: number): string {
  const sign = cents < 0 ? "−" : "";
  const abs = Math.abs(cents);
  return `${sign}$${(abs / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function staffCanWriteFinance(role: string | null | undefined): boolean {
  return role === "gc_account_owner" || role === "gc_accountant";
}

/** Existing member_can view_financial seats. Viewer and delivery_ops stay out. */
export function orgRoleCanViewFinancial(role: string | null | undefined): boolean {
  return role === "account_owner" || role === "accountant" || role === "legal";
}

/** Recipients never import, close, post, or write threshold. */
export function recipientCanWriteFinance(): false {
  return false;
}

/** Hard isolation: Client A never reads Client B money. */
export function assertRecipientOrgIsolation(periodOrgId: string, activeOrgId: string): void {
  if (periodOrgId !== activeOrgId) {
    throw new Error("Client A never reads Client B money");
  }
}

export function recipientMayReadPeriod(periodOrgId: string, activeOrgId: string): boolean {
  return periodOrgId === activeOrgId;
}

export function recipientMayExportPeriod(input: {
  periodOrgId: string;
  activeOrgId: string;
  status: string;
}): boolean {
  return input.status === "closed" && recipientMayReadPeriod(input.periodOrgId, input.activeOrgId);
}

export function financeExportHref(periodId: string, format: "pdf" | "csv"): string {
  return `${FINANCE_CLIENT_HREF}/${periodId}/export?format=${format}`;
}

export function formatClientRateBp(rateBp: number | null): string {
  if (rateBp === null) return FINANCE_CLIENT.glanceNoTerm;
  return `${rateBp / 100}%`;
}

/** Hard isolation: a title from another org must never attach to this org's import. */
export function assertOrgTitleIsolation(lineOrgId: string, titleOrgId: string): void {
  if (lineOrgId !== titleOrgId) {
    throw new Error("Client A title never receives Client B import");
  }
}

export function isSuspenseLine(periodId: string | null | undefined): boolean {
  return periodId == null;
}

export function assertSuspenseOrgIsolation(lineOrgId: string, targetOrgId: string): void {
  if (lineOrgId !== targetOrgId) {
    throw new Error("Client A lines never enter Client B suspense");
  }
}

/** Unmapped lines still attached to an open period may move to the org pool. */
export function decideSuspenseMove(input: {
  titleId: string | null;
  periodId: string | null;
  periodStatus: FinancePeriodStatus;
}): { ok: true } | { ok: false; reason: "mapped" | "already_suspense" | "closed_period" } {
  if (input.titleId != null) return { ok: false, reason: "mapped" };
  if (isSuspenseLine(input.periodId)) return { ok: false, reason: "already_suspense" };
  if (input.periodStatus !== "open") return { ok: false, reason: "closed_period" };
  return { ok: true };
}

/** Staff chooses an open period on the same org. No date-based guess. */
export function decideSuspenseAssign(input: {
  linePeriodId: string | null;
  lineOrgId: string;
  targetOrgId: string;
  targetStatus: FinancePeriodStatus;
}): { ok: true } | { ok: false; reason: "not_suspense" | "closed_period" | "cross_org" } {
  if (!isSuspenseLine(input.linePeriodId)) return { ok: false, reason: "not_suspense" };
  if (input.targetStatus !== "open") return { ok: false, reason: "closed_period" };
  if (input.lineOrgId !== input.targetOrgId) return { ok: false, reason: "cross_org" };
  return { ok: true };
}

export function openPeriodsForOrg<T extends { id: string; org_id: string; status: string }>(
  orgId: string,
  periods: readonly T[],
): T[] {
  return periods.filter((period) => period.org_id === orgId && period.status === "open");
}

export function periodLinesForMath<T extends { period_id: string | null }>(
  periodId: string,
  lines: readonly T[],
): T[] {
  return lines.filter((line) => line.period_id === periodId);
}

/** Attached unmapped lines still block close. Parked (null period) lines do not. */
export function unmappedLinesBlockClose<T extends { period_id: string | null; title_id: string | null }>(
  periodId: string,
  lines: readonly T[],
): boolean {
  return periodLinesForMath(periodId, lines).some((line) => line.title_id == null);
}

export function recipientVisibleSalesLines<T extends { period_id: string | null }>(
  lines: readonly T[],
): T[] {
  return lines.filter((line) => !isSuspenseLine(line.period_id));
}

export function suspenseLineSummary(input: {
  endpoint: string;
  externalId: string;
  bankReceiptCents: number;
  reportedCents: number | null;
  filename: string | null;
  originLabel: string | null;
  transactionDate: string | null;
  importedAt: string | null;
}): string {
  const reported =
    input.reportedCents === null ? "" : ` · ${FINANCE_PAGE.reported} ${formatUsdCents(input.reportedCents)}`;
  const origin = input.originLabel ? ` · ${FINANCE_PAGE.originPeriod} ${input.originLabel}` : "";
  const file = input.filename ? ` · ${input.filename}` : "";
  const when = input.transactionDate ?? input.importedAt ?? "";
  const date = when ? ` · ${when}` : "";
  return `${input.endpoint} · ${input.externalId} · ${FINANCE_PAGE.bankReceipt} ${formatUsdCents(input.bankReceiptCents)}${reported}${file}${origin}${date}`;
}

export function resolveMappedTitleId(input: {
  lineOrgId: string;
  mappingOrgId: string;
  titleOrgId: string;
  titleId: string;
}): string | null {
  if (input.lineOrgId !== input.mappingOrgId) return null;
  if (input.lineOrgId !== input.titleOrgId) return null;
  return input.titleId;
}
