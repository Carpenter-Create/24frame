import ExcelJS from "exceljs";

// Parse staff sales files into integer-cent lines. USD only.
// Does not apply aggregator % or client tier-plan %.

export type ParsedSalesLine = {
  endpoint: string;
  external_id: string;
  bank_receipt_cents: number;
  reported_cents: number | null;
  transaction_date: string | null;
  currency: "USD";
  raw: Record<string, string>;
};

export type ParseSalesResult =
  | { ok: true; lines: ParsedSalesLine[] }
  | { ok: false; error: string };

const ENDPOINT_HEADERS = ["endpoint", "vendor", "platform", "platform_id"];
const EXTERNAL_HEADERS = ["external_id", "external id", "sku", "vendor_title_id", "id"];
const BANK_HEADERS = [
  "bank_receipt_cents",
  "bank_receipt",
  "bank",
  "settled",
  "received",
  "gross_cents",
  "gross",
  "amount",
  "revenue",
];
const REPORTED_HEADERS = ["reported_cents", "reported", "platform_gross", "reported_amount"];
const DATE_HEADERS = ["transaction_date", "date", "sale_date"];
const CURRENCY_HEADERS = ["currency"];

function normHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function pick(row: Record<string, string>, aliases: string[]): string | undefined {
  for (const key of aliases) {
    if (row[key] !== undefined && row[key] !== "") return row[key];
  }
  return undefined;
}

function parseGross(raw: string, headerUsed: string | undefined): number | null {
  const cleaned = raw.replace(/[$,]/g, "").trim();
  if (cleaned === "" || cleaned === "-") return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  if (headerUsed === "gross_cents" || headerUsed === "bank_receipt_cents" || headerUsed === "reported_cents") {
    if (!Number.isInteger(n)) return null;
    return n;
  }
  return Math.round(n * 100);
}

function rowFromCells(headers: string[], cells: string[]): Record<string, string> {
  const row: Record<string, string> = {};
  headers.forEach((h, i) => {
    if (h) row[h] = (cells[i] ?? "").trim();
  });
  return row;
}

export function parseSalesRows(headers: string[], rows: string[][]): ParseSalesResult {
  const normalized = headers.map(normHeader);
  const hasEndpoint = normalized.some((h) => ENDPOINT_HEADERS.includes(h));
  const hasExternal = normalized.some((h) => EXTERNAL_HEADERS.includes(h));
  const hasBank = normalized.some((h) => BANK_HEADERS.includes(h));
  if (!hasEndpoint || !hasExternal || !hasBank) {
    return { ok: false, error: "File needs endpoint, external_id, and a bank-receipt amount." };
  }

  const lines: ParsedSalesLine[] = [];
  for (let i = 0; i < rows.length; i++) {
    const raw = rowFromCells(normalized, rows[i] ?? []);
    if (Object.values(raw).every((v) => v === "")) continue;

    const endpoint = pick(raw, ENDPOINT_HEADERS);
    const external = pick(raw, EXTERNAL_HEADERS);
    const bankHeader = BANK_HEADERS.find((h) => raw[h] !== undefined && raw[h] !== "");
    const bankRaw = bankHeader ? raw[bankHeader] : undefined;
    const reportedHeader = REPORTED_HEADERS.find((h) => raw[h] !== undefined && raw[h] !== "");
    const reportedRaw = reportedHeader ? raw[reportedHeader] : undefined;
    const currency = (pick(raw, CURRENCY_HEADERS) ?? "USD").toUpperCase();
    const date = pick(raw, DATE_HEADERS) ?? null;

    if (!endpoint || !external) {
      return { ok: false, error: `Line ${i + 1} is missing endpoint or external_id.` };
    }
    if (currency !== "USD") {
      return { ok: false, error: `USD only (line ${i + 1}).` };
    }
    if (bankRaw === undefined) {
      return { ok: false, error: `Line ${i + 1} is missing a bank-receipt amount.` };
    }
    const bank = parseGross(bankRaw, bankHeader);
    if (bank === null) {
      return { ok: false, error: `Line ${i + 1} has an unreadable bank-receipt amount.` };
    }
    let reported: number | null = null;
    if (reportedRaw !== undefined) {
      reported = parseGross(reportedRaw, reportedHeader);
      if (reported === null) {
        return { ok: false, error: `Line ${i + 1} has an unreadable reported amount.` };
      }
    }

    lines.push({
      endpoint: endpoint.trim().toLowerCase(),
      external_id: external.trim(),
      bank_receipt_cents: bank,
      reported_cents: reported,
      transaction_date: date,
      currency: "USD",
      raw,
    });
  }

  if (lines.length === 0) return { ok: false, error: "File has no sales lines." };
  return { ok: true, lines };
}

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object" && "text" in value && typeof value.text === "string") {
    return value.text;
  }
  if (typeof value === "object" && "result" in value) {
    return cellText(value.result as ExcelJS.CellValue);
  }
  return "";
}

export async function parseSalesFile(input: {
  filename: string;
  bytes: ArrayBuffer | Uint8Array;
}): Promise<ParseSalesResult> {
  const name = input.filename.toLowerCase();
  const wb = new ExcelJS.Workbook();
  const buffer = input.bytes instanceof Uint8Array ? input.bytes : new Uint8Array(input.bytes);

  try {
    if (name.endsWith(".csv")) {
      // exceljs csv.read wants a stream; decode and split instead — CSV is text.
      const text = new TextDecoder("utf-8").decode(buffer);
      const rows = text
        .split(/\r?\n/)
        .map((line) => splitCsvLine(line));
      const headers = rows[0] ?? [];
      return parseSalesRows(headers, rows.slice(1));
    }
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      return { ok: false, error: "Use an Excel (.xlsx) or CSV file." };
    }
    await wb.xlsx.load(Buffer.from(buffer) as unknown as Parameters<ExcelJS.Xlsx["load"]>[0]);
  } catch {
    return { ok: false, error: "The file could not be read." };
  }

  const sheet = wb.worksheets[0];
  if (!sheet) return { ok: false, error: "Workbook has no sheet." };

  const matrix: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cells[col - 1] = cellText(cell.value);
    });
    matrix.push(cells);
  });
  const headers = matrix[0] ?? [];
  return parseSalesRows(headers, matrix.slice(1));
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}
