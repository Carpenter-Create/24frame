import { PRODUCT_NAME } from "@/lib/product";

// Staff ops copy + client recipient copy. Ops write path stays /gc/finance.
// Recipient read path is /finance. Official complementary-split lock: display
// client % and remainder only. Do not invent a second fee field.

export const FINANCE_HREF = "/gc/finance";
export const FINANCE_CLIENT_HREF = "/finance";

export const FINANCE_WRITE_RPCS = [
  "create_finance_period",
  "import_sales",
  "close_finance_period",
  "post_ledger_entry",
  "set_finance_period_threshold",
  "map_sales_import",
  "map_sales_line",
  "upsert_title_external_id",
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
  importHint: "Excel or CSV. USD only. The amount column is bank-receipt cents used for compute.",
  map: "Map endpoint ids",
  mapHint: "Resolve vendor ids onto this organization’s titles only.",
  mapImport: "Apply mappings",
  post: "Post ledger",
  postHint: "Recoup, adjustment, or sale. Amounts are signed cents as entered.",
  close: "Close period",
  closeHint:
    "Applies the org’s current contract client share to bank-receipt gross, then recoup and close.",
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
  subtitle: "Monthly statements. USD.",
  empty: "No statements yet.",
  notYet: "This period is not closed yet.",
  noAccess: "Finance is not available on this seat.",
  noOrg: "Choose an organization to read statements.",
  pdf: "Download PDF",
  csv: "Download CSV",
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
