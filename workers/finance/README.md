# 24Frame finance worker

Isolated AWS compute for finance ingest, close apply, and statement export.

- Account `405912452061` / `us-west-2`. Do not reuse Royalogic or Watershed.
- Live buckets: `24frame-finance-dev`, `24frame-finance-prod`.
- Credentials: `FINANCE_AWS_*` / `S3_FINANCE_*` only. Task role `24frame-finance-worker`.
- IAM must not allow write to title, media, or avatar buckets.
- Relational SoT: live Aurora `frame-aurora-dev` / `frame-aurora-prod` (`AURORA_DATABASE_URL`). Auth stays Supabase Auth. App cutover is not yet.

Entry: `processFinanceJob` in `src/lib/finance-worker-run.ts`.

EventBridge + ECS service deploy are **not yet**. Do not pretend they are scheduled.

Founder-executed apply: [`docs/infra/finance-aws-setup.md`](../../docs/infra/finance-aws-setup.md).
