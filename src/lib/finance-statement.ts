import { FINANCE_LOGIC_VERSION } from "@/lib/finance";
import {
  aggregatorKeepCents,
  clientShareCents,
  closePeriodDecision,
  type CloseDecision,
} from "@/lib/finance-compute";

// Official statement shape (CoS 2026-09-13). Input from sales_lines is preserved.
// House math is derived per bank-receipt line, then rolled up title → org.
// ledger_entries remains the posted source of truth. No second fee field.

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
  org: {
    bankReceiptCents: number;
    mappedBankReceiptCents: number;
    unmappedBankReceiptCents: number;
    clientRateBp: number;
    clientShareCents: number;
    aggregatorKeepCents: number;
    recoupCents: number;
    adjustmentCents: number;
    staffSaleCents: number;
    openingCents: number;
    netCents: number;
    thresholdCents: number | null;
    close: CloseDecision;
  } | null;
};

function sumItems(items: ReadonlyArray<StatementPostedItem>): number {
  return items.reduce((sum, item) => sum + item.amountCents, 0);
}

export function buildPeriodStatement(input: {
  clientRateBp: number | null;
  openingCents: number;
  thresholdCents: number | null;
  sourceLines: readonly StatementSourceLine[];
  recoupItems: readonly StatementPostedItem[];
  adjustmentItems: readonly StatementPostedItem[];
  staffSaleItems: readonly StatementPostedItem[];
}): PeriodStatement {
  const sourceLines = [...input.sourceLines];
  const unmappedLines = sourceLines.filter((line) => !line.titleId);
  const recoupItems = [...input.recoupItems];
  const adjustmentItems = [...input.adjustmentItems];
  const staffSaleItems = [...input.staffSaleItems];

  const titles: TitleStatementSlice[] = [];
  if (input.clientRateBp !== null) {
    const byTitle = new Map<string, TitleStatementSlice>();
    for (const line of sourceLines) {
      if (!line.titleId) continue;
      const existing = byTitle.get(line.titleId);
      const share = clientShareCents(line.bankReceiptCents, input.clientRateBp);
      const keep = aggregatorKeepCents(line.bankReceiptCents, input.clientRateBp);
      if (existing) {
        existing.bankReceiptCents += line.bankReceiptCents;
        existing.clientShareCents += share;
        existing.aggregatorKeepCents += keep;
        existing.sourceLines.push(line);
        continue;
      }
      byTitle.set(line.titleId, {
        titleId: line.titleId,
        titleName: line.titleName ?? line.titleId,
        bankReceiptCents: line.bankReceiptCents,
        clientShareCents: share,
        aggregatorKeepCents: keep,
        recoupCents: 0,
        adjustmentCents: 0,
        sourceLines: [line],
        recoupItems: [],
        adjustmentItems: [],
      });
    }
    for (const item of recoupItems) {
      if (!item.titleId) continue;
      const title = byTitle.get(item.titleId);
      if (!title) continue;
      title.recoupItems.push(item);
      title.recoupCents += item.amountCents;
    }
    for (const item of adjustmentItems) {
      if (!item.titleId) continue;
      const title = byTitle.get(item.titleId);
      if (!title) continue;
      title.adjustmentItems.push(item);
      title.adjustmentCents += item.amountCents;
    }
    titles.push(...byTitle.values());
  }

  const mappedBankReceiptCents = titles.reduce((sum, title) => sum + title.bankReceiptCents, 0);
  const clientShare = titles.reduce((sum, title) => sum + title.clientShareCents, 0);
  const aggregatorKeep = titles.reduce((sum, title) => sum + title.aggregatorKeepCents, 0);
  const recoupCents = sumItems(recoupItems);
  const adjustmentCents = sumItems(adjustmentItems);
  const staffSaleCents = sumItems(staffSaleItems);
  const bankReceiptCents = sourceLines.reduce((sum, line) => sum + line.bankReceiptCents, 0);
  const unmappedBankReceiptCents = unmappedLines.reduce((sum, line) => sum + line.bankReceiptCents, 0);
  const netCents = input.openingCents + clientShare + recoupCents + adjustmentCents + staffSaleCents;

  return {
    complementarySplit: true,
    logicVersion: FINANCE_LOGIC_VERSION,
    clientRateBp: input.clientRateBp,
    sourceLines,
    unmappedLines,
    titles,
    recoupItems,
    adjustmentItems,
    staffSaleItems,
    org:
      input.clientRateBp === null
        ? null
        : {
            bankReceiptCents,
            mappedBankReceiptCents,
            unmappedBankReceiptCents,
            clientRateBp: input.clientRateBp,
            clientShareCents: clientShare,
            aggregatorKeepCents: aggregatorKeep,
            recoupCents,
            adjustmentCents,
            staffSaleCents,
            openingCents: input.openingCents,
            netCents,
            thresholdCents: input.thresholdCents,
            close: closePeriodDecision({
              netCents,
              thresholdCents: input.thresholdCents,
            }),
          },
  };
}
