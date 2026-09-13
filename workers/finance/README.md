# 24Frame finance worker

Isolated AWS compute for finance ingest, close apply, and statement export.

- Account / region: Adam confirms. Do not reuse Royalogic or Watershed.
- Proposed buckets: `24frame-finance-dev`, `24frame-finance-prod` (not live until applied).
- Credentials: `FINANCE_AWS_*` / `S3_FINANCE_*` only. Fargate task role via OIDC preferred.
- IAM must not allow write to title, media, or avatar buckets.
- Postgres stays on survivor Supabase `uevsculwzwlhxeamagwg`. No RDS lift.

Entry: `processFinanceJob` in `src/lib/finance-worker-run.ts`.

EventBridge can later poll `finance_jobs` where `status = queued`. Not scheduled in this slice.

Founder-executed apply: [`docs/infra/finance-aws-setup.md`](../../docs/infra/finance-aws-setup.md).
