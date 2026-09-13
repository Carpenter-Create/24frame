# 24Frame finance AWS setup — founder-executed

Dedicated **private** finance namespace. AWS owns files and compute.
Auth stays Supabase Auth. App Postgres SoT is still survivor
`uevsculwzwlhxeamagwg` until Vercel Secure Compute + Aurora cutover.
See [`aurora-postgres-setup.md`](aurora-postgres-setup.md). Not Supabase
Storage. Not a Royalogic cluster.

Do **not** apply SQL from CI. Do **not** touch Royalogic / Watershed
buckets, roles, repos, or accounts. Do **not** reuse title, media, or
avatar credentials.

Buckets, IAM, ECS/ECR/log group, and Vercel finance env below are
**live** (account `405912452061` / `us-west-2`). CloudFront, EventBridge
enablement, a digest-tagged task-def revision, and image push are
**founder-gated**.

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
| Execution role | `24frame-finance-worker-execution` | Pull ECR + write `/ecs/24frame-finance` |
| ECS cluster | `24frame-finance` (Fargate) | Worker SG `sg-001080a8a798d5cb6`, private subnets in `vpc-07f0141dafa80a408` |
| ECR | `405912452061.dkr.ecr.us-west-2.amazonaws.com/24frame-finance-worker` | Push a digest tag after merge; `:pending` is not a runnable image |
| Task def | `24frame-finance-worker:1` | Points at nonexistent `:pending` until CoS registers a digest revision |
| EventBridge | `24frame-finance-poll` **DISABLED**, no targets | Founder adds the RunTask target and enables after **dev** smoke |
| Log group | `/ecs/24frame-finance` | |
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
FINANCE_DATABASE_URL=       # interim survivor Postgres for the worker
AURORA_DATABASE_URL=        # prefer when set; never a survivor pooler URL
```

`src/lib/aurora.ts` refuses survivor pooler / Royalogic / Watershed hosts
as `AURORA_DATABASE_URL`. The worker uses that guard, then falls back to
`FINANCE_DATABASE_URL` until Aurora cutover. Names live in `.env.example`.
Agents do not set values.

## Still founder-gated

1. Optional dedicated CloudFront + signing key → `FINANCE_CLOUDFRONT_*`.
2. Image build/push of `24frame-finance-worker` to ECR, new task-def
   revision pinned to an image **digest**, EventBridge target role +
   target on `24frame-finance-poll`. **Do not enable** the rule until
   a **dev** bucket + survivor `FINANCE_DATABASE_URL` smoke exits 0.
3. Slice 2 SQL apply is already live on survivor. Aurora SQL apply and
   app cutover stay founder-only.

## Worker image (code is runnable; schedule is not)

Build from repo root. The image copies `pnpm-workspace.yaml` so
`allowBuilds.esbuild` / `tsx` run, plus `apps/mobile/package.json` only
to satisfy the lockfile importer (`--filter @24frame/dashboard` keeps
Expo out). `tsx` + `tsconfig.json` resolve `@/` imports.
`pg` talks to the current relational SoT.

```bash
REPO=405912452061.dkr.ecr.us-west-2.amazonaws.com/24frame-finance-worker
aws ecr get-login-password --region us-west-2 \
  | docker login --username AWS --password-stdin 405912452061.dkr.ecr.us-west-2.amazonaws.com
docker build -f workers/finance/Dockerfile -t "$REPO:candidate" .
docker push "$REPO:candidate"
DIGEST=$(aws ecr describe-images --region us-west-2 \
  --repository-name 24frame-finance-worker \
  --image-ids imageTag=candidate \
  --query 'imageDetails[0].imageDigest' --output text)
# Register a new 24frame-finance-worker revision with image $REPO@$DIGEST
# First smoke: S3_FINANCE_BUCKET=24frame-finance-dev and FINANCE_DATABASE_URL
# (survivor). Then add the EventBridge RunTask target. Leave the rule disabled
# until that smoke is clean. Founder enables 24frame-finance-poll after.
```

Worker SG, subnets, log group, and IAM already exist. Do not recreate
them. Do not push images unless this environment already has AWS/ECR
auth.

## App / worker contracts already in-repo

- Next staff import hashes bytes, PUTs when finance AWS is configured, then
  `request_sales_import`. It does **not** parse lines or compute money.
- `close_finance_period` only enqueues. `apply_finance_close` is
  service_role / worker-only and is the sole close compute path.
- Recipient export serves a signed finance URL, or `202` +
  `request_finance_export`. Next does not generate CSV/PDF.
- Worker: `src/lib/finance-worker-run.ts` + `workers/finance/run.ts`.
  Poll claims `finance_jobs` (`status = queued`, `SKIP LOCKED`), builds
  S3 + RPC deps, calls `processFinanceJob`. Idle exits 0.
