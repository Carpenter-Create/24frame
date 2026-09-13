import { FINANCE_LOGIC_VERSION } from "@/lib/finance";
import {
  aggregatorKeepCents,
  clientShareCents,
  closePeriodDecision,
  type CloseDecision,
} from "@/lib/finance-compute";

// Official statement shape (CoS 2026-09-13). Ops and a later recipient view
// both call assemblePeriodStatement — same numbers, recipient read-only.
// ledger_entries is posted SoT. Source lines stay on the statement.
// Do not collapse to a single net. No second fee field.

export const STATEMENT_TRANSPARENCY_LINES = [
  "bankReceiptCents",
  "clientRateBp",
  "clientShareCents",
  "aggregatorKeepCents",
  "recoupCents",
  "adjustmentCents",
  "openingCents",
  "netCents",
  "thresholdCents",
  "thresholdMet",
  "close",
] as const;

export type StatementSourceLine = {
  id: string;
  importId: string;
  importFilename: string | null;
  lineNo: number;
  endpoint: string;
  externalId: string;
  titleId: string | null;
  titleName: string | null;
  bankReceiptCents: number;
  reportedCents: number | null;
};

export type StatementPostedItem = {
  id: string;
  kind: "recoup" | "adjustment" | "sale";
  amountCents: number;
  titleId: string | null;
  titleName: string | null;
  note: string | null;
};

export type PostedSaleRef = {
  salesLineId: string;
  clientShareCents: number;
  aggregatorKeepCents: number;
  clientRateBp: number | null;
};

export type TitleStatementSlice = {
  titleId: string;
  titleName: string;
  bankReceiptCents: number;
  clientShareCents: number;
  aggregatorKeepCents: number;
  recoupCents: number;
  adjustmentCents: number;
  sourceLines: StatementSourceLine[];
  recoupItems: StatementPostedItem[];
  adjustmentItems: StatementPostedItem[];
};

export type OrgStatementSlice = {
  bankReceiptCents: number;
  mappedBankReceiptCents: number;
  unmappedBankReceiptCents: number;
  clientRateBp: number | null;
  clientShareCents: number;
  aggregatorKeepCents: number;
  recoupCents: number;
  adjustmentCents: number;
  staffSaleCents: number;
  openingCents: number;
  netCents: number;
  thresholdCents: number | null;
  thresholdMet: boolean | null;
  close: CloseDecision;
};

export type PeriodStatement = {
  complementarySplit: true;
  logicVersion: typeof FINANCE_LOGIC_VERSION;
  clientRateBp: number | null;
  sourceLines: StatementSourceLine[];
  unmappedLines: StatementSourceLine[];
  titles: TitleStatementSlice[];
  recoupItems: StatementPostedItem[];
  adjustmentItems: StatementPostedItem[];
  staffSaleItems: StatementPostedItem[];
  org: OrgStatementSlice | null;
};

export type StatementLineRow = {
  id: string;
  import_id: string;
  line_no: number;
  endpoint: string;
  external_id: string;
  title_id: string | null;
  bank_receipt_cents: number;
  reported_cents: number | null;
};

export type StatementLedgerRow = {
  id: string;
  kind: string;
  amount_cents: number;
  title_id: string | null;
  note: string | null;
  sales_line_id: string | null;
  source_refs: unknown;
};

function sumItems(items: ReadonlyArray<StatementPostedItem>): number {
  return items.reduce((sum, item) => sum + item.amountCents, 0);
}

function emptyTitle(titleId: string, titleName: string): TitleStatementSlice {
  return {
    titleId,
    titleName,
    bankReceiptCents: 0,
    clientShareCents: 0,
    aggregatorKeepCents: 0,
    recoupCents: 0,
    adjustmentCents: 0,
    sourceLines: [],
    recoupItems: [],
    adjustmentItems: [],
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function postedSaleFromRefs(
  salesLineId: string | null,
  sourceRefs: unknown,
): PostedSaleRef | null {
  if (!salesLineId) return null;
  const refs = asRecord(sourceRefs);
  if (!refs) return null;
  if (typeof refs.client_share_cents !== "number") return null;
  if (typeof refs.aggregator_keep_cents !== "number") return null;
  return {
    salesLineId,
    clientShareCents: refs.client_share_cents,
    aggregatorKeepCents: refs.aggregator_keep_cents,
    clientRateBp: typeof refs.client_rate_bp === "number" ? refs.client_rate_bp : null,
  };
}

export function transparentMathPresent(statement: PeriodStatement): boolean {
  if (!statement.org) return false;
  if (!Array.isArray(statement.recoupItems) || !Array.isArray(statement.adjustmentItems)) {
    return false;
  }
  return STATEMENT_TRANSPARENCY_LINES.every((key) => statement.org?.[key] !== undefined);
}

export function buildPeriodStatement(input: {
  clientRateBp: number | null;
  openingCents: number;
  thresholdCents: number | null;
  sourceLines: readonly StatementSourceLine[];
  recoupItems: readonly StatementPostedItem[];
  adjustmentItems: readonly StatementPostedItem[];
  staffSaleItems: readonly StatementPostedItem[];
  postedSales?: readonly PostedSaleRef[];
}): PeriodStatement {
  const sourceLines = [...input.sourceLines];
  const unmappedLines = sourceLines.filter((line) => !line.titleId);
  const recoupItems = [...input.recoupItems];
  const adjustmentItems = [...input.adjustmentItems];
  const staffSaleItems = [...input.staffSaleItems];
  const postedByLine = new Map((input.postedSales ?? []).map((sale) => [sale.salesLineId, sale]));

  const byTitle = new Map<string, TitleStatementSlice>();
  const ensureTitle = (titleId: string, titleName: string | null) => {
    const existing = byTitle.get(titleId);
    if (existing) return existing;
    const created = emptyTitle(titleId, titleName ?? titleId);
    byTitle.set(titleId, created);
    return created;
  };

  const canCompute = input.clientRateBp !== null || postedByLine.size > 0;
  if (canCompute) {
    for (const line of sourceLines) {
      if (!line.titleId) continue;
      const title = ensureTitle(line.titleId, line.titleName);
      const posted = postedByLine.get(line.id);
      const share =
        posted?.clientShareCents ??
        (input.clientRateBp === null ? 0 : clientShareCents(line.bankReceiptCents, input.clientRateBp));
      const keep =
        posted?.aggregatorKeepCents ??
        (input.clientRateBp === null
          ? 0
          : aggregatorKeepCents(line.bankReceiptCents, input.clientRateBp));
      title.bankReceiptCents += line.bankReceiptCents;
      title.clientShareCents += share;
      title.aggregatorKeepCents += keep;
      title.sourceLines.push(line);
    }
    for (const item of recoupItems) {
      if (!item.titleId) continue;
      const title = ensureTitle(item.titleId, item.titleName);
      title.recoupItems.push(item);
      title.recoupCents += item.amountCents;
    }
    for (const item of adjustmentItems) {
      if (!item.titleId) continue;
      const title = ensureTitle(item.titleId, item.titleName);
      title.adjustmentItems.push(item);
      title.adjustmentCents += item.amountCents;
    }
  }

  const titles = [...byTitle.values()];
  const mappedBankReceiptCents = titles.reduce((sum, title) => sum + title.bankReceiptCents, 0);
  const clientShare = titles.reduce((sum, title) => sum + title.clientShareCents, 0);
  const aggregatorKeep = titles.reduce((sum, title) => sum + title.aggregatorKeepCents, 0);
  const recoupCents = sumItems(recoupItems);
  const adjustmentCents = sumItems(adjustmentItems);
  const staffSaleCents = sumItems(staffSaleItems);
  const bankReceiptCents = sourceLines.reduce((sum, line) => sum + line.bankReceiptCents, 0);
  const unmappedBankReceiptCents = unmappedLines.reduce((sum, line) => sum + line.bankReceiptCents, 0);
  const netCents = input.openingCents + clientShare + recoupCents + adjustmentCents + staffSaleCents;
  const thresholdMet =
    input.thresholdCents === null ? null : netCents >= input.thresholdCents;
  const postedRate = [...postedByLine.values()].find((sale) => sale.clientRateBp !== null);
  const clientRateBp = input.clientRateBp ?? postedRate?.clientRateBp ?? null;

  return {
    complementarySplit: true,
    logicVersion: FINANCE_LOGIC_VERSION,
    clientRateBp,
    sourceLines,
    unmappedLines,
    titles,
    recoupItems,
    adjustmentItems,
    staffSaleItems,
    org:
      input.clientRateBp === null && postedByLine.size === 0
        ? null
        : {
            bankReceiptCents,
            mappedBankReceiptCents,
            unmappedBankReceiptCents,
            clientRateBp,
            clientShareCents: clientShare,
            aggregatorKeepCents: aggregatorKeep,
            recoupCents,
            adjustmentCents,
            staffSaleCents,
            openingCents: input.openingCents,
            netCents,
            thresholdCents: input.thresholdCents,
            thresholdMet,
            close: closePeriodDecision({
              netCents,
              thresholdCents: input.thresholdCents,
            }),
          },
  };
}

export function assemblePeriodStatement(input: {
  clientRateBp: number | null;
  openingCents: number;
  thresholdCents: number | null;
  titles: ReadonlyArray<{ id: string; title: string }>;
  imports: ReadonlyArray<{ id: string; filename: string }>;
  lines: readonly StatementLineRow[];
  ledger: readonly StatementLedgerRow[];
}): PeriodStatement {
  const titleById = new Map(input.titles.map((title) => [title.id, title.title]));
  const importById = new Map(input.imports.map((imp) => [imp.id, imp.filename]));
  const named = (titleId: string | null) =>
    titleId ? (titleById.get(titleId) ?? titleId) : null;

  const posted = (kind: "recoup" | "adjustment"): StatementPostedItem[] =>
    input.ledger
      .filter((row) => row.kind === kind)
      .map((row) => ({
        id: row.id,
        kind,
        amountCents: row.amount_cents,
        titleId: row.title_id,
        titleName: named(row.title_id),
        note: row.note,
      }));

  return buildPeriodStatement({
    clientRateBp: input.clientRateBp,
    openingCents: input.openingCents,
    thresholdCents: input.thresholdCents,
    sourceLines: input.lines.map((line) => ({
      id: line.id,
      importId: line.import_id,
      importFilename: importById.get(line.import_id) ?? null,
      lineNo: line.line_no,
      endpoint: line.endpoint,
      externalId: line.external_id,
      titleId: line.title_id,
      titleName: named(line.title_id),
      bankReceiptCents: line.bank_receipt_cents,
      reportedCents: line.reported_cents,
    })),
    recoupItems: posted("recoup"),
    adjustmentItems: posted("adjustment"),
    staffSaleItems: input.ledger
      .filter((row) => row.kind === "sale" && !row.sales_line_id)
      .map((row) => ({
        id: row.id,
        kind: "sale" as const,
        amountCents: row.amount_cents,
        titleId: row.title_id,
        titleName: named(row.title_id),
        note: row.note,
      })),
    postedSales: input.ledger
      .filter((row) => row.kind === "sale")
      .map((row) => postedSaleFromRefs(row.sales_line_id, row.source_refs))
      .filter((sale): sale is PostedSaleRef => sale !== null),
  });
}
