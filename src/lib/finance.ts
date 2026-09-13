import { PRODUCT_NAME } from "@/lib/product";

// Staff finance-ops copy and helpers. Aggregation only. No client recipient UI.
// Official complementary-split lock: display client % and remainder only.

export const FINANCE_HREF = "/gc/finance";

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
