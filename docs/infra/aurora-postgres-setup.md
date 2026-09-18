# 24Frame Aurora PostgreSQL — founder-executed

Relational SoT is a **new** Aurora PostgreSQL cluster on E8. **Supabase
Auth stays identity.** No Cognito. No Royalogic / Watershed cluster.
Do **not** create more infra from CI. Do **not** apply Slice 2 SQL from
this runbook.

Clusters, VPC, and Secrets Manager names below are **live**. Vercel
Secure Compute, app cutover off survivor, EventBridge/ECS, and SQL apply
are **not yet**.

## Why Aurora (not RDS PostgreSQL)

Aurora PostgreSQL keeps the existing RLS / `plpgsql` RPC surface
portable, adds a reader endpoint for statement reads, and autoscales
storage as the ledger grows. There is **no RDS-only reason** in this
repo.

## Live shape

| Item | Live |
| --- | --- |
| Account | `405912452061` (E8) |
| Region | `us-west-2` |
| Engine | Aurora PostgreSQL 15, Serverless v2 |
| Dev cluster | `frame-aurora-dev` (IDs cannot start with a digit — not `24frame-aurora-*`) |
| Prod cluster | `frame-aurora-prod` (deletion protection ON) |
| VPC | `vpc-07f0141dafa80a408` (`10.24.0.0/16`) + NAT + private subnets |
| Endpoints | Private |
| Secrets Manager | `24frame/aurora/dev` and `24frame/aurora/prod` |
| Parameter group | Standard PG; no `pg_cron`, no Supabase realtime, no vault |

### Region split (called out)

This repo’s **title-asset** S3 / MediaConvert / ACM docs are `us-east-1`.
Survivor **Postgres** is already `us-west-2`. Aurora is `us-west-2` —
same hop as today’s database. Title film buckets stay `us-east-1`.
Finance S3 + worker follow Aurora (`us-west-2`).

## Networking (live VPC; app path not yet)

1. Live 24Frame VPC `vpc-07f0141dafa80a408` in `405912452061` /
   `us-west-2`. Not an RL VPC.
2. Private subnets + NAT. Cluster endpoints are private. No public
   `0.0.0.0/0` on 5432.
3. Finance worker role `24frame-finance-worker` can read
   `24frame/aurora/*` and `24frame/finance/*`.
4. TLS required (`sslmode=require`).
5. **Not yet:** Vercel Secure Compute into this VPC. The Next.js app
   still uses survivor Supabase for Postgres until that cutover.

## Secrets

Server-only. Never `NEXT_PUBLIC_`. Never reuse title `AWS_*` or
`MEDIA_AWS_*`. Do not commit secret values.

```
AURORA_DATABASE_URL=
FINANCE_DATABASE_URL=
```

Live Secrets Manager: `24frame/aurora/dev` and `24frame/aurora/prod`.
`src/lib/aurora.ts` refuses survivor pooler hosts and Royalogic/Watershed
markers as `AURORA_DATABASE_URL`. Until cutover the finance worker uses
`FINANCE_DATABASE_URL` (survivor). The app does not use Aurora until
Secure Compute + cutover.

## Auth shim

`docs/infra/aurora-auth-shim.sql` recreates `auth.uid()` / `auth.role()`
from `request.jwt.claims` on the **new** cluster only. Do not apply that
file to survivor.

Historical Slice 1 FKs to `auth.users` stay as-is until a dedicated
cutover migration. New Slice 2 tables do **not** add `auth.users` FKs.
`finance_jobs.requested_by` is a UUID (JWT `sub`) with no FK.

## Cutover from survivor `uevsculwzwlhxeamagwg` (not yet)

1. Clusters + VPC + secrets are live (this runbook).
2. Founder applies historical migrations, then Slice 2, then the auth
   shim, on the new cluster — after `#256` merge + Adam yes.
3. Logical replication or dump/restore of business data. Auth users
   remain on Supabase Auth — do not treat a copied `auth.users` as
   identity SoT.
4. Vercel Secure Compute so the app can reach private Aurora. Then
   point worker + app at `AURORA_DATABASE_URL`. Flip after a founder
   checksum of `ledger_entries` counts and org isolation.
5. Survivor Postgres becomes read-only archive; Auth project stays.
6. Cognito stays queued until Aurora is stable. Do not start it here.

## Isolation

- New cluster. Not Royalogic. Not shared ingest.
- Finance IAM still cannot write title/media/avatar buckets.
- Client A rows stay `org_id`-scoped under the same RLS helpers once
  the auth shim is in place.
