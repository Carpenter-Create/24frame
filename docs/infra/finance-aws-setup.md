# 24Frame finance AWS setup — founder-executed

Dedicated **private** finance namespace. AWS owns files, compute, and later
schedules. Auth and Postgres stay on survivor Supabase
`uevsculwzwlhxeamagwg`. This is **not** an RDS lift and **not** Supabase
Storage.

Do **not** apply from CI. Do **not** touch Royalogic / Watershed buckets,
roles, repos, or accounts. Do **not** reuse title, media, or avatar
credentials.

Names below are **proposals**. They are not live until Adam applies them.

## Proposed resources

| Item | Proposal | Notes |
| --- | --- | --- |
| Account | Existing GC AWS account (Adam confirms) | Entity-isolated from RL/Watershed |
| Region | Same as other 24Frame AWS (`us-east-1` unless Adam says otherwise) | |
| Prod bucket | `24frame-finance-prod` | Never `24frame-media-*`, `gc-content-assets*`, `gc-avatars*`, `S3_BUCKET` |
| Dev bucket | `24frame-finance-dev` | Same isolation |
| Object prefix | `orgs/{org_id}/imports/{sha256}/{filename}` and `orgs/{org_id}/statements/{period_id}/24frame-statement.{pdf,csv}` | Org isolation in the key |
| App IAM user | `24frame-finance-app` | `FINANCE_AWS_*` for Next signed GET / staff PUT only |
| Worker OIDC / task role | `24frame-finance-worker` | Fargate preferred; Lambda OK for export |
| CloudFront | Dedicated finance distribution if needed | `FINANCE_CLOUDFRONT_*` only — never `CLOUDFRONT_*` or `MEDIA_CLOUDFRONT_*` |

## Env names (server-only)

Never fall back to `AWS_*` (titles) or `MEDIA_AWS_*` (social). Never
`NEXT_PUBLIC_`.

```
FINANCE_AWS_REGION=
FINANCE_AWS_ACCESS_KEY_ID=
FINANCE_AWS_SECRET_ACCESS_KEY=
S3_FINANCE_BUCKET=          # proposed 24frame-finance-dev / 24frame-finance-prod
FINANCE_CLOUDFRONT_DOMAIN=
FINANCE_CLOUDFRONT_KEY_PAIR_ID=
FINANCE_CLOUDFRONT_PRIVATE_KEY=
```

Add the **names** to `.env.example`. Agents do not set values.

## Adam / CoS hand steps

1. Confirm account + region. Create the two buckets. Block all public access.
   No website. No public policy. Versioning optional.
2. Bucket policy / IAM: `s3:GetObject` + `s3:PutObject` on
   `arn:aws:s3:::24frame-finance-*/orgs/*` only. No `DeleteObject`. No `/*`
   on any other bucket. Explicitly omit `gc-content-assets*`,
   `24frame-media-*`, `gc-avatars*`, and the title `S3_BUCKET`.
3. Create `24frame-finance-app` access keys. Set `FINANCE_AWS_*` +
   `S3_FINANCE_BUCKET` in Vercel (server-only) and local `.env.local`.
4. Create Fargate task role / OIDC `24frame-finance-worker` with the same
   bucket prefix plus `service_role` access to survivor Supabase (worker
   calls `apply_sales_import`, `apply_finance_close`, `apply_finance_export`
   only). Worker secrets must also be `FINANCE_AWS_*` / `S3_FINANCE_*`.
5. Optional: dedicated CloudFront + signing key → `FINANCE_CLOUDFRONT_*`.
6. EventBridge schedule for `finance_jobs` (`status = queued`) — after the
   worker image is wired. Not required to merge the schema/app contracts.

## App / worker contracts already in-repo

- Next staff import hashes bytes, PUTs when finance AWS is configured, then
  `request_sales_import`. It does **not** parse lines or compute money.
- `close_finance_period` only enqueues. `apply_finance_close` is
  service_role / worker-only and is the sole close compute path.
- Recipient export serves a signed finance URL, or `202` +
  `request_finance_export`. Next does not generate CSV/PDF.
- Worker scaffold: `src/lib/finance-worker-run.ts`, `workers/finance/`.

Production SQL apply remains founder-only after merge.
