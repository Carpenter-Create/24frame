import { PARENT_ENTITY, PRODUCT_NAME } from "@/lib/product";
import {
  FINANCE_LOGIC_VERSION,
  FINANCE_PAGE,
  financePeriodLabel,
  formatClientRateBp,
} from "@/lib/finance";
import { slugSegment } from "@/lib/export-filename";
import {
  STATEMENT_OUTPUT_FORMAT,
  sourceInputPreserved,
  toStatementOutput,
  transparentMathPresent,
  type PeriodStatement,
  type StatementOutput,
} from "@/lib/finance-statement";

// House PDF/CSV from the Slice 1 statement payload. Input first, then compute.
// Do not invent a second format. Do not drop endpoint-sourced rows.

export type StatementExportMeta = {
  orgName: string;
  periodYear: number;
  periodMonth: number;
  status: "closed";
};

export const STATEMENT_EXPORT_MATH_FIELDS = [
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

export const STATEMENT_EXPORT_SOURCE_FIELDS = [
  "endpoint",
  "externalId",
  "reportedCents",
  "bankReceiptCents",
] as const;

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function row(values: Array<string | number | boolean | null>): string {
  return values.map((value) => csvEscape(value === null ? "" : String(value))).join(",");
}

function asciiUsd(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${(abs / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function statementExportFilename(
  meta: StatementExportMeta,
  format: "pdf" | "csv",
): string {
  const period = financePeriodLabel(meta.periodYear, meta.periodMonth);
  const org = slugSegment(meta.orgName, "organization");
  return `${slugSegment(PRODUCT_NAME, "24frame")}-statement-${period}-${org}.${format}`;
}

export function statementCsv(output: StatementOutput, meta: StatementExportMeta): string {
  const org = output.compute.org;
  const lines = [
    row(["format", output.format]),
    row(["logicVersion", output.logicVersion]),
    row(["complementarySplit", output.complementarySplit]),
    row(["product", PRODUCT_NAME]),
    row(["parent", PARENT_ENTITY]),
    row(["org", meta.orgName]),
    row(["period", financePeriodLabel(meta.periodYear, meta.periodMonth)]),
    row(["currency", FINANCE_PAGE.usd]),
    row(["status", meta.status]),
    "",
    row(["section", "field", "cents", "usd"]),
    row(["org", "bankReceiptCents", org?.bankReceiptCents ?? "", org ? asciiUsd(org.bankReceiptCents) : ""]),
    row(["org", "clientRateBp", org?.clientRateBp ?? "", formatClientRateBp(org?.clientRateBp ?? null)]),
    row(["org", "clientShareCents", org?.clientShareCents ?? "", org ? asciiUsd(org.clientShareCents) : ""]),
    row(["org", "aggregatorKeepCents", org?.aggregatorKeepCents ?? "", org ? asciiUsd(org.aggregatorKeepCents) : ""]),
    row(["org", "recoupCents", org?.recoupCents ?? "", org ? asciiUsd(org.recoupCents) : ""]),
    row(["org", "adjustmentCents", org?.adjustmentCents ?? "", org ? asciiUsd(org.adjustmentCents) : ""]),
    row(["org", "openingCents", org?.openingCents ?? "", org ? asciiUsd(org.openingCents) : ""]),
    row(["org", "netCents", org?.netCents ?? "", org ? asciiUsd(org.netCents) : ""]),
    row(["org", "thresholdCents", org?.thresholdCents ?? "", org?.thresholdCents === null || org?.thresholdCents === undefined ? "" : asciiUsd(org.thresholdCents)]),
    row(["org", "thresholdMet", org?.thresholdMet ?? "", ""]),
    row(["org", "close", org?.close.kind ?? "", org ? asciiUsd(org.close.kind === "payable" ? org.netCents : org.close.closingBalanceCents) : ""]),
    "",
    row([
      "section",
      "endpoint",
      "externalId",
      "reportedCents",
      "bankReceiptCents",
      "titleName",
      "importFilename",
      "importContentHash",
      "transactionDate",
    ]),
    ...output.input.lines.map((line) =>
      row([
        "source",
        line.endpoint,
        line.externalId,
        line.reportedCents,
        line.bankReceiptCents,
        "",
        line.importFilename,
        line.importContentHash,
        line.transactionDate,
      ]),
    ),
    "",
    row([
      "section",
      "titleId",
      "titleName",
      "bankReceiptCents",
      "clientShareCents",
      "aggregatorKeepCents",
      "recoupCents",
      "adjustmentCents",
    ]),
    ...output.compute.titles.map((title) =>
      row([
        "title",
        title.titleId,
        title.titleName,
        title.bankReceiptCents,
        title.clientShareCents,
        title.aggregatorKeepCents,
        title.recoupCents,
        title.adjustmentCents,
      ]),
    ),
  ];
  return `${lines.join("\n")}\n`;
}

function pdfEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function pdfSafe(text: string): string {
  return [...text]
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code === 0x2212 || code === 0x2013 || code === 0x2014) return "-";
      if (code === 0x00a0) return " ";
      if (code < 32) return " ";
      if (code > 126) return "?";
      return ch;
    })
    .join("");
}

function wrapLine(text: string, max = 92): string[] {
  if (text.length <= max) return [text];
  const words = text.split(" ");
  const out: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max && current) {
      out.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) out.push(current);
  return out;
}

export function statementPdf(output: StatementOutput, meta: StatementExportMeta): Uint8Array {
  const org = output.compute.org;
  const period = financePeriodLabel(meta.periodYear, meta.periodMonth);
  const body: string[] = [
    PRODUCT_NAME,
    "Finance statement",
    meta.orgName,
    `${period}  ${FINANCE_PAGE.statusClosed}  ${FINANCE_PAGE.usd}`,
    `${output.format}  ${output.logicVersion}`,
    PARENT_ENTITY,
    "",
    FINANCE_PAGE.orgRollup,
    `${FINANCE_PAGE.bankReceipt}  ${org ? asciiUsd(org.bankReceiptCents) : ""}`,
    `${FINANCE_PAGE.clientRate}  ${formatClientRateBp(org?.clientRateBp ?? null)}`,
    `${FINANCE_PAGE.clientShare}  ${org ? asciiUsd(org.clientShareCents) : ""}`,
    `${FINANCE_PAGE.aggregatorKeep}  ${org ? asciiUsd(org.aggregatorKeepCents) : ""}`,
    `${FINANCE_PAGE.recoup}  ${org ? asciiUsd(org.recoupCents ?? 0) : ""}`,
    `${FINANCE_PAGE.adjustments}  ${org ? asciiUsd(org.adjustmentCents ?? 0) : ""}`,
    `${FINANCE_PAGE.opening}  ${org ? asciiUsd(org.openingCents) : ""}`,
    `${FINANCE_PAGE.periodNet}  ${org ? asciiUsd(org.netCents) : ""}`,
    `${FINANCE_PAGE.thresholdCheck}  ${org?.thresholdCents === null || org?.thresholdCents === undefined ? FINANCE_PAGE.threshold : asciiUsd(org.thresholdCents)}`,
    `${org?.close.kind === "payable" ? FINANCE_PAGE.payable : FINANCE_PAGE.carryForward}  ${
      org ? asciiUsd(org.close.kind === "payable" ? org.netCents : org.close.closingBalanceCents) : ""
    }`,
    `thresholdMet  ${org?.thresholdMet ?? ""}`,
    `bankReceiptCents  ${org?.bankReceiptCents ?? ""}`,
    `clientRateBp  ${org?.clientRateBp ?? ""}`,
    `clientShareCents  ${org?.clientShareCents ?? ""}`,
    `aggregatorKeepCents  ${org?.aggregatorKeepCents ?? ""}`,
    `recoupCents  ${org?.recoupCents ?? ""}`,
    `adjustmentCents  ${org?.adjustmentCents ?? ""}`,
    `openingCents  ${org?.openingCents ?? ""}`,
    `netCents  ${org?.netCents ?? ""}`,
    `thresholdCents  ${org?.thresholdCents ?? ""}`,
    `close  ${org?.close.kind ?? ""}`,
    "",
    FINANCE_PAGE.byTitle,
    ...output.compute.titles.flatMap((title) => [
      title.titleName,
      `${FINANCE_PAGE.bankReceipt}  ${asciiUsd(title.bankReceiptCents)}`,
      `${FINANCE_PAGE.clientShare}  ${asciiUsd(title.clientShareCents)}`,
      `${FINANCE_PAGE.aggregatorKeep}  ${asciiUsd(title.aggregatorKeepCents)}`,
      `${FINANCE_PAGE.recoup}  ${asciiUsd(title.recoupCents)}`,
      `${FINANCE_PAGE.adjustments}  ${asciiUsd(title.adjustmentCents)}`,
    ]),
    "",
    FINANCE_PAGE.source,
    "endpoint  externalId  reportedCents  bankReceiptCents",
    `${FINANCE_PAGE.endpoint}  ${FINANCE_PAGE.externalId}  ${FINANCE_PAGE.reported}  ${FINANCE_PAGE.bankReceipt}`,
    ...output.input.lines.map((line) =>
      [
        line.endpoint,
        line.externalId,
        line.reportedCents === null ? "" : asciiUsd(line.reportedCents),
        asciiUsd(line.bankReceiptCents),
        line.importFilename ?? "",
      ].join("  "),
    ),
  ];

  const pages: string[][] = [];
  let page: string[] = [];
  const maxLines = 48;
  for (const line of body.flatMap((text) => wrapLine(pdfSafe(text)))) {
    if (page.length >= maxLines) {
      pages.push(page);
      page = [];
    }
    page.push(line);
  }
  if (page.length > 0 || pages.length === 0) pages.push(page);

  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`;
  pages.forEach((lines, i) => {
    const pageObj = 3 + i * 2;
    const contentObj = pageObj + 1;
    objects[pageObj] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObj} 0 R /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> >>`;
    const commands = lines
      .map((text, lineNo) => {
        const y = 738 - lineNo * 14;
        return `BT /F1 10 Tf 54 ${y} Td (${pdfEscape(text)}) Tj ET`;
      })
      .join("\n");
    objects[contentObj] = `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`;
  });
  const fontObj = 3 + pages.length * 2;
  objects[fontObj] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let offset = 0;
  const chunks = ["%PDF-1.4\n"];
  offset = 9;
  const xref = [0];
  for (let i = 1; i < objects.length; i++) {
    const bodyObj = objects[i];
    if (!bodyObj) continue;
    xref[i] = offset;
    const obj = `${i} 0 obj\n${bodyObj}\nendobj\n`;
    chunks.push(obj);
    offset += obj.length;
  }
  const xrefStart = offset;
  const maxObj = objects.length - 1;
  let xrefTable = `xref\n0 ${maxObj + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= maxObj; i++) {
    xrefTable += `${String(xref[i] ?? 0).padStart(10, "0")} 00000 n \n`;
  }
  chunks.push(xrefTable);
  chunks.push(`trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);
  return new TextEncoder().encode(chunks.join(""));
}

export function exportStatement(
  statement: PeriodStatement,
  meta: StatementExportMeta,
  format: "pdf" | "csv",
): { filename: string; contentType: string; body: Uint8Array } {
  if (!transparentMathPresent(statement) && statement.org === null) {
    throw new Error("Statement math is not available.");
  }
  const output = toStatementOutput(statement);
  if (!sourceInputPreserved(statement, output)) {
    throw new Error("Statement export dropped source input.");
  }
  if (output.format !== STATEMENT_OUTPUT_FORMAT) {
    throw new Error("Statement export must stay 24frame-statement-v1.");
  }
  if (output.logicVersion !== FINANCE_LOGIC_VERSION) {
    throw new Error("Statement export must keep the locked compute version.");
  }
  const filename = statementExportFilename(meta, format);
  if (format === "csv") {
    return {
      filename,
      contentType: "text/csv; charset=utf-8",
      body: new TextEncoder().encode(statementCsv(output, meta)),
    };
  }
  return {
    filename,
    contentType: "application/pdf",
    body: statementPdf(output, meta),
  };
}

export function exportContainsRequiredMath(text: string): boolean {
  return STATEMENT_EXPORT_MATH_FIELDS.every((field) => text.includes(field));
}

export function exportContainsRequiredSourceFields(text: string): boolean {
  return STATEMENT_EXPORT_SOURCE_FIELDS.every((field) => text.includes(field));
}
