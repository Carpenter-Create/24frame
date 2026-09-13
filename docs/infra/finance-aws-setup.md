# 24Frame finance AWS setup — founder-executed

Dedicated **private** finance namespace. AWS owns files and compute.
Auth stays Supabase Auth. Relational SoT is Aurora PostgreSQL (see
[`aurora-postgres-setup.md`](aurora-postgres-setup.md)). Not Supabase
Storage. Not a Royalogic cluster.

Do **not** apply SQL from CI. Do **not** touch Royalogic / Watershed
buckets, roles, repos, or accounts. Do **not** reuse title, media, or
avatar credentials.

Buckets, IAM, and Vercel finance env below are **live** (account
`405912452061` / `us-west-2`). CloudFront, EventBridge, ECS deploy, and
Slice 2 SQL apply are **not yet**.

## Live resources

| Item | Live | Notes |
| --- | --- | --- |
| Account | `405912452061` (E8) | Entity-isolated from RL/Watershed |
| Region | `us-west-2`. Title-asset S3 stays `us-east-1` — existing split. | |
| Prod bucket | `24frame-finance-prod` | Private, AES256, tagged. Never media/title/avatar buckets |
| Dev bucket | `24frame-finance-dev` | Same isolation |
| Object prefix | `orgs/{org_id}/imports/{sha256}/{filename}` and `orgs/{org_id}/statements/{period_id}/24frame-statement.{pdf,csv}` | Policy `24frame-finance-s3-orgs` is Get/Put `orgs/*` only |
| App IAM user | `24frame-finance-app` | `FINANCE_AWS_*` for Next signed GET / staff PUT |
| Worker IAM role | `24frame-finance-worker` | `ecs-tasks` trust + same S3 + Secrets `24frame/aurora/*` and `24frame/finance/*` |
| Vercel Production | `FINANCE_AWS_*` + `S3_FINANCE_BUCKET=24frame-finance-prod` | Server-only. Values stay out of the repo |
| Vercel Preview | `FINANCE_*` + `S3_FINANCE_BUCKET=24frame-finance-dev` | Server-only |
| CloudFront | **Not yet** | Optional. `FINANCE_CLOUDFRONT_*` only if created |

## Env names (server-only)

Never fall back to `AWS_*` (titles) or `MEDIA_AWS_*` (social). Never
`NEXT_PUBLIC_`. Do not commit secret values.

```
FINANCE_AWS_REGION=
FINANCE_AWS_ACCESS_KEY_ID=
FINANCE_AWS_SECRET_ACCESS_KEY=
S3_FINANCE_BUCKET=          # live: 24frame-finance-dev / 24frame-finance-prod
FINANCE_CLOUDFRONT_DOMAIN=
FINANCE_CLOUDFRONT_KEY_PAIR_ID=
FINANCE_CLOUDFRONT_PRIVATE_KEY=
```

Names live in `.env.example`. Agents do not set values.

## Still founder-gated

1. Optional dedicated CloudFront + signing key → `FINANCE_CLOUDFRONT_*`.
2. EventBridge schedule + ECS service deploy for `finance_jobs`
   (`status = queued`). Worker image is scaffolded, not scheduled.
3. Slice 2 SQL apply after merge + Adam yes. Not from this runbook.

## App / worker contracts already in-repo

- Next staff import hashes bytes, PUTs when finance AWS is configured, then
  `request_sales_import`. It does **not** parse lines or compute money.
- `close_finance_period` only enqueues. `apply_finance_close` is
  service_role / worker-only and is the sole close compute path.
- Recipient export serves a signed finance URL, or `202` +
  `request_finance_export`. Next does not generate CSV/PDF.
- Worker scaffold: `src/lib/finance-worker-run.ts`, `workers/finance/`.
