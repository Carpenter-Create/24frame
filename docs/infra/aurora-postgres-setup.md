# 24Frame Aurora PostgreSQL — founder-executed

Relational SoT moves from survivor Supabase Postgres
(`uevsculwzwlhxeamagwg`) to a **new** Aurora PostgreSQL cluster.
**Supabase Auth stays identity.** No Cognito. No Royalogic / Watershed
cluster. Do **not** create this from CI. CoS gates create/apply.

Names below are **proposals**. They are not live.

## Why Aurora (not RDS PostgreSQL)

Aurora PostgreSQL keeps the existing RLS / `plpgsql` RPC surface
portable, adds a reader endpoint for statement reads, and autoscales
storage as the ledger grows. There is **no RDS-only reason** in this
repo.

## Proposed shape

| Item | Proposal |
| --- | --- |
| Account | `405912452061` (E8) |
| Region | `us-west-2` |
| Engine | Aurora PostgreSQL 15 |
| Dev cluster | `24frame-aurora-dev` |
| Prod cluster | `24frame-aurora-prod` |
| Class | Serverless v2, 0.5–4 ACU until Adam sizes prod |
| Parameter group | Standard PG; no `pg_cron`, no Supabase realtime, no vault |

### Region split (called out)

This repo’s **title-asset** S3 / MediaConvert / ACM docs are `us-east-1`.
Survivor **Postgres** is already `us-west-2`
(`aws-1-us-west-2.pooler.supabase.com`). Putting Aurora in `us-west-2`
keeps the relational hop where it is today. Moving it to `us-east-1`
would colocate film buckets and split away from the current database.
Finance S3 + worker should follow Aurora (`us-west-2`), not the title
bucket.

## Networking (Vercel + Fargate)

1. New 24Frame VPC in `405912452061` / `us-west-2` (or an existing
   24Frame VPC Adam confirms). Not an RL VPC.
2. Private subnets for the cluster. No public `0.0.0.0/0` on 5432.
3. Security group: 5432 from (a) Vercel Secure Compute / the app SG and
   (b) the finance worker task SG only.
4. Fargate worker in the same VPC.
5. TLS required (`sslmode=require`).

Weaker fallback Adam may choose: IP-allowlisted public endpoint. Do not
default to that.

## Secrets

Server-only. Never `NEXT_PUBLIC_`. Never reuse title `AWS_*` or
`MEDIA_AWS_*`.

```
AURORA_DATABASE_URL=postgresql://...
```

Proposal: Secrets Manager `24frame/aurora/dev` and `24frame/aurora/prod`.
Vercel and the worker task read the same name. `src/lib/aurora.ts`
refuses survivor pooler hosts and Royalogic/Watershed markers.

Until the cluster exists, the app keeps talking to survivor via the
existing Supabase client. After cutover, Auth stays on Supabase JWTs;
table/RPC traffic uses `AURORA_DATABASE_URL`.

## Auth shim

`docs/infra/aurora-auth-shim.sql` recreates `auth.uid()` / `auth.role()`
from `request.jwt.claims` on the **new** cluster only. Do not apply that
file to survivor.

Historical Slice 1 FKs to `auth.users` stay as-is until a dedicated
cutover migration. New Slice 2 tables do **not** add `auth.users` FKs.
`finance_jobs.requested_by` is a UUID (JWT `sub`) with no FK.

## Cutover from survivor `uevsculwzwlhxeamagwg`

1. Adam creates the cluster + VPC + SG + secret (this runbook).
2. Founder applies historical migrations, then Slice 2, then the auth
   shim, on the new cluster.
3. Logical replication or dump/restore of business data. Auth users
   remain on Supabase Auth — do not treat a copied `auth.users` as
   identity SoT.
4. Point worker + app at `AURORA_DATABASE_URL`. Flip after a founder
   checksum of `ledger_entries` counts and org isolation.
5. Survivor Postgres becomes read-only archive; Auth project stays.

## Isolation

- New cluster. Not Royalogic. Not shared ingest.
- Finance IAM still cannot write title/media/avatar buckets.
- Client A rows stay `org_id`-scoped under the same RLS helpers once
  the auth shim is in place.
