import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

import { assertAuroraDatabaseUrl } from "@/lib/aurora";
import { recipientVisibleSalesLines } from "@/lib/finance";
import { assemblePeriodStatement, type PeriodStatement } from "@/lib/finance-statement";
import type { FinanceWorkerDeps, FinanceWorkerJob } from "@/lib/finance-worker-run";
import type { ParsedSalesLine } from "@/lib/finance-import";

// Worker Postgres access. Prefer dedicated Aurora when that URL is set and
// valid. Interim SoT is survivor via FINANCE_DATABASE_URL. Never treat a
// survivor pooler URL as AURORA_DATABASE_URL.

const SERVICE_ROLE_CLAIMS = JSON.stringify({ role: "service_role" });

const FORBIDDEN_FINANCE_DB_MARKERS = ["royalogic", "watershed"] as const;

export type FinanceSql = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ) => Promise<QueryResult<T>>;
};

export type WorkerEnv = Record<string, string | undefined>;

export function financeWorkerDatabaseUrl(
  env: WorkerEnv = process.env,
): { url: string; source: "AURORA_DATABASE_URL" | "FINANCE_DATABASE_URL" } {
  const aurora = env.AURORA_DATABASE_URL?.trim() ?? "";
  if (aurora) {
    return { url: assertAuroraDatabaseUrl(aurora), source: "AURORA_DATABASE_URL" };
  }
  const interim = env.FINANCE_DATABASE_URL?.trim() ?? "";
  if (!interim) {
    throw new Error("FINANCE_DATABASE_URL (or AURORA_DATABASE_URL) is not set");
  }
  if (!interim.startsWith("postgres://") && !interim.startsWith("postgresql://")) {
    throw new Error("FINANCE_DATABASE_URL must be a Postgres connection string");
  }
  const lowered = interim.toLowerCase();
  if (FORBIDDEN_FINANCE_DB_MARKERS.some((marker) => lowered.includes(marker))) {
    throw new Error("FINANCE_DATABASE_URL must be the 24Frame survivor or Aurora host");
  }
  return { url: interim, source: "FINANCE_DATABASE_URL" };
}

export async function withServiceRole<T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("select set_config('request.jwt.claims', $1, true)", [SERVICE_ROLE_CLAIMS]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export function createPgFinanceSql(pool: Pool): FinanceSql {
  return {
    query: (text, values) => withServiceRole(pool, (client) => client.query(text, values)),
  };
}

export function createFinanceWorkerPool(
  env: WorkerEnv = process.env,
): { pool: Pool; source: "AURORA_DATABASE_URL" | "FINANCE_DATABASE_URL" } {
  const resolved = financeWorkerDatabaseUrl(env);
  return {
    source: resolved.source,
    pool: new Pool({ connectionString: resolved.url, max: 2 }),
  };
}

export type FinanceWorkerDbOps = Pick<
  FinanceWorkerDeps,
  | "getJob"
  | "markRunning"
  | "markFailed"
  | "getImport"
  | "applySalesImport"
  | "applyClose"
  | "applyExport"
  | "loadPostedStatement"
> & {
  claimNextQueuedJob: () => Promise<string | null>;
  markSucceededIfRunning: (id: string) => Promise<void>;
};

export function createFinanceWorkerDbOps(sql: FinanceSql): FinanceWorkerDbOps {
  return {
    async claimNextQueuedJob() {
      const result = await sql.query<{ id: string }>(
        `update public.finance_jobs as j
            set status = 'running',
                started_at = coalesce(j.started_at, now())
           from (
             select id
               from public.finance_jobs
              where status = 'queued'
              order by created_at asc
              limit 1
              for update skip locked
           ) as picked
          where j.id = picked.id
          returning j.id`,
      );
      return result.rows[0]?.id ?? null;
    },

    async getJob(id) {
      const result = await sql.query<FinanceWorkerJob>(
        `select id, org_id, period_id, import_id, kind, status::text as status
           from public.finance_jobs
          where id = $1`,
        [id],
      );
      return result.rows[0] ?? null;
    },

    async markRunning(id) {
      await sql.query(
        `update public.finance_jobs
            set status = 'running',
                started_at = coalesce(started_at, now())
          where id = $1
            and status in ('queued', 'running')`,
        [id],
      );
    },

    async markFailed(id, error) {
      await sql.query(
        `update public.finance_jobs
            set status = 'failed',
                error = $2,
                finished_at = now()
          where id = $1`,
        [id, error],
      );
    },

    async markSucceededIfRunning(id) {
      await sql.query(
        `update public.finance_jobs
            set status = 'succeeded',
                finished_at = now()
          where id = $1
            and status = 'running'`,
        [id],
      );
    },

    async getImport(id) {
      const result = await sql.query<{
        id: string;
        org_id: string;
        filename: string;
        s3_key: string | null;
      }>(
        `select id, org_id, filename, s3_key
           from public.sales_imports
          where id = $1`,
        [id],
      );
      return result.rows[0] ?? null;
    },

    async applySalesImport(importId, lines: ParsedSalesLine[]) {
      const result = await sql.query<{ apply_sales_import: number }>(
        `select public.apply_sales_import($1::uuid, $2::jsonb) as apply_sales_import`,
        [importId, JSON.stringify(lines)],
      );
      return result.rows[0]?.apply_sales_import ?? 0;
    },

    async applyClose(periodId) {
      await sql.query(`select public.apply_finance_close($1::uuid)`, [periodId]);
    },

    async applyExport(input) {
      await sql.query(
        `select public.apply_finance_export($1::uuid, $2::text, $3::text, $4::text)`,
        [input.periodId, input.format, input.s3Key, input.contentHash],
      );
    },

    async loadPostedStatement(periodId, orgId) {
      return loadPostedStatementFromSql(sql, periodId, orgId);
    },
  };
}

async function loadPostedStatementFromSql(
  sql: FinanceSql,
  periodId: string,
  orgId: string,
): Promise<{
  statement: PeriodStatement;
  orgName: string;
  periodYear: number;
  periodMonth: number;
}> {
  const periodResult = await sql.query<{
    id: string;
    org_id: string;
    period_year: number;
    period_month: number;
    opening_balance_cents: number;
    threshold_cents: number | null;
    org_name: string;
  }>(
    `select p.id, p.org_id, p.period_year, p.period_month,
            p.opening_balance_cents, p.threshold_cents, o.name as org_name
       from public.finance_periods p
       join public.organizations o on o.id = p.org_id
      where p.id = $1`,
    [periodId],
  );
  const period = periodResult.rows[0];
  if (!period) throw new Error("Period not found");
  if (period.org_id !== orgId) throw new Error("Client A never reads Client B money");

  const [titles, imports, lines, ledger, term] = await Promise.all([
    sql.query<{ id: string; title: string }>(
      `select id, title from public.titles where org_id = $1 order by title`,
      [orgId],
    ),
    sql.query<{ id: string; filename: string; content_hash: string | null }>(
      `select id, filename, content_hash
         from public.sales_imports
        where period_id = $1 and org_id = $2
        order by imported_at desc`,
      [periodId, orgId],
    ),
    sql.query<{
      id: string;
      import_id: string;
      period_id: string | null;
      line_no: number;
      endpoint: string;
      external_id: string;
      title_id: string | null;
      bank_receipt_cents: number;
      reported_cents: number | null;
      transaction_date: string | null;
      raw: unknown;
    }>(
      `select id, import_id, period_id, line_no, endpoint, external_id, title_id,
              bank_receipt_cents, reported_cents, transaction_date::text, raw
         from public.sales_lines
        where period_id = $1 and org_id = $2
        order by line_no`,
      [periodId, orgId],
    ),
    sql.query<{
      id: string;
      kind: string;
      amount_cents: number;
      title_id: string | null;
      note: string | null;
      sales_line_id: string | null;
      source_refs: unknown;
    }>(
      `select id, kind, amount_cents, title_id, note, sales_line_id, source_refs
         from public.ledger_entries
        where period_id = $1 and org_id = $2
        order by posted_at`,
      [periodId, orgId],
    ),
    sql.query<{ revenue_share_rate_bp: number }>(
      `select revenue_share_rate_bp
         from public.contract_terms
        where org_id = $1 and effective_to is null
        order by effective_from desc
        limit 1`,
      [orgId],
    ),
  ]);

  return {
    orgName: period.org_name,
    periodYear: period.period_year,
    periodMonth: period.period_month,
    statement: assemblePeriodStatement({
      postedOnly: true,
      clientRateBp: term.rows[0]?.revenue_share_rate_bp ?? null,
      openingCents: period.opening_balance_cents,
      thresholdCents: period.threshold_cents,
      titles: titles.rows,
      imports: imports.rows,
      lines: recipientVisibleSalesLines(lines.rows),
      ledger: ledger.rows,
    }),
  };
}
