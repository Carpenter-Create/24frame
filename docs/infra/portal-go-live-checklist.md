# Portal go-live checklist — the founder actions

> **Status:** all six slices are merged to `main` and green (portal master-download, screener room,
> Glacier restoring, OTP hardening, findings, notifications). **No code work remains.** Everything on
> this page is *your* action — provisioning + testing the app can't do itself. Detailed copy-paste CLI
> commands are in `asset-portal-setup.md`; this page is the ordered "what to do, in what order, and how
> to know it worked."

**Nothing here is destructive to existing data.** It stands up new AWS resources and sets env vars. Auth OTP is SES (`docs/infra/auth-ses.md`). Resend is residual for GC-support/asset notification only.
Do them in order — later steps depend on values from earlier ones.

---

## 0. Already done — nothing to do
- **Cloudflare Turnstile** is already live on the portal OTP form. `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and
  `TURNSTILE_SECRET_KEY` already exist in your envs — **no action.** Dashboard `/login` no longer reads
  these keys; leave them in place for portal.

---

## 1. AWS — S3 lifecycle (masters → Glacier at 90 days)
**Do:** on the assets bucket, add a **lifecycle rule**: transition objects under the `master/` prefix to
**Glacier Flexible Retrieval** at **90 days**. (Prefix scoped to masters only — never artwork/captions/screeners.)
**Where:** S3 console → the assets bucket → Management → Lifecycle rules. (This is config, not code.)
**Verify:** the rule shows "Transition to Glacier Flexible Retrieval, 90 days, prefix master/".
**Why:** Portal-3's restore flow assumes this policy exists; without it, masters never archive (fine) but
you also can't exercise the restore path.

## 2. AWS — IAM: add `s3:RestoreObject`
**Do:** to the app's IAM policy (the one that already allows `s3:GetObject`/`PutObject`),
add restore **and** the founder-lock 2026-09-17 title-prefix purge (not a bucket wipe):
```json
{ "Effect": "Allow", "Action": ["s3:RestoreObject"], "Resource": "arn:aws:s3:::<your-assets-bucket>/*" }
```
```json
{
  "Effect": "Allow",
  "Action": ["s3:ListBucket"],
  "Resource": "arn:aws:s3:::<your-assets-bucket>",
  "Condition": { "StringLike": { "s3:prefix": ["orgs/*/titles/*"] } }
}
```
```json
{
  "Effect": "Allow",
  "Action": ["s3:DeleteObject","s3:DeleteObjects"],
  "Resource": "arn:aws:s3:::<your-assets-bucket>/orgs/*/titles/*"
}
```
**Where:** IAM console → the app's policy → edit JSON.
**Verify:** policy JSON contains `s3:RestoreObject` and prefix-scoped `s3:DeleteObject` /
`s3:DeleteObjects` on `orgs/*/titles/*` only — never `DeleteObject` on the whole bucket.

## 3. AWS — CloudFront distribution (private, signed) + subdomain
Follow **`asset-portal-setup.md` §1–§5** (copy-paste CLI). In order:
1. **ACM cert** for your portal subdomain **in us-east-1** (CloudFront requires us-east-1). → pick the real
   subdomain, e.g. `links.globalcontent.<domain>`.
2. **Origin Access Control (OAC)** so the S3 bucket stays private (only CloudFront can read it).
3. **CloudFront distribution** over the assets bucket, with the OAC + the ACM cert + the subdomain as CNAME
   + **TrustedKeyGroups** (from step 4 below).
4. **Signing key pair + key group** → the public key ID becomes **`CLOUDFRONT_KEY_PAIR_ID`**; the private
   PEM becomes **`CLOUDFRONT_PRIVATE_KEY`**.
5. **Route 53** record pointing the subdomain at the distribution.
**Verify:** `https://<subdomain>/` resolves to CloudFront; a manually-signed URL for a known S3 key downloads.
**Produces env:** `CLOUDFRONT_DOMAIN` (= `https://<subdomain>`), `CLOUDFRONT_KEY_PAIR_ID`, `CLOUDFRONT_PRIVATE_KEY`.

## 4. Auth OTP mail — SES us-west-2 on 24frame.co
Follow **`auth-ses.md`**. Portal OTP is Auth transactional mail, not Resend.
**Do:** founder sets dedicated `SES_AWS_*` (us-west-2) + `PORTAL_EMAIL_FROM` on the verified `24frame.co` identity.
**Verify:** `pnpm exec tsx scripts/email/ses-auth-smoke.ts --live --to <inbox>` arrives from `24frame.co`.
**Produces env:** `SES_AWS_REGION`, `SES_AWS_ACCESS_KEY_ID`, `SES_AWS_SECRET_ACCESS_KEY`, `PORTAL_EMAIL_FROM`.
**Residual:** `RESEND_API_KEY` / `ASSETS_EMAIL_FROM` remain for GC-support/asset notification only.

## 5. Set env vars — Vercel (all environments) + your local `.env.local`
Set these **server-only** vars (none are `NEXT_PUBLIC_`):

| Var | From | Purpose |
|---|---|---|
| `CLOUDFRONT_DOMAIN` | step 3 | base URL for signed asset URLs |
| `CLOUDFRONT_KEY_PAIR_ID` | step 3 | CloudFront public-key id |
| `CLOUDFRONT_PRIVATE_KEY` | step 3 | PEM signing key (headers/footers + newlines preserved) |
| `SES_AWS_REGION` | step 4 | must be `us-west-2` |
| `SES_AWS_ACCESS_KEY_ID` | step 4 | dedicated Auth SES IAM (not `AWS_*` / `FINANCE_AWS_*`) |
| `SES_AWS_SECRET_ACCESS_KEY` | step 4 | dedicated Auth SES IAM |
| `PORTAL_EMAIL_FROM` | step 4 | `24frame.co` sender for portal OTP |
| `RESEND_API_KEY` | residual | GC-support/asset notification only — not Auth |
| `PORTAL_BASE_URL` | this app's own origin (e.g. `https://app.globalcontent.<domain>`) | builds the `/portal/<token>` link GC pastes into email |

**Where:** Vercel project → Settings → Environment Variables (Production + Preview). Mirror into `.env.local` for local testing.
**Verify:** `vercel env ls` shows the CloudFront + SES Auth names; none prefixed `NEXT_PUBLIC_`. Redeploy so they take effect.

## 6. Vercel WAF — rate-limit the portal API (required, security)
**Do:** add a **Firewall / WAF rate-limit rule** on `/api/portal/*` (per-IP + global). The app already has
Turnstile + per-link/per-email caps, but per-IP throttling is a network concern only the WAF can do.
**Where:** Vercel project → Firewall tab → add a rate-limit rule (e.g. on `/api/portal/request-otp`).
**Verify:** the rule is active. **Treat this as a launch gate** — the endpoint is public + sends real email.

---

## 7. Manual end-to-end tests (the checks automated tests can't cover)
Run all three after 1–6 (details in `asset-portal-setup.md`). Record pass/fail in the sign-off thread.

- **Master download** — GC generates a link on `/gc/deliveries`; a logged-out browser → name/company/email →
  Turnstile → emailed code → **Download** → file downloads via a signed `$CLOUDFRONT_DOMAIN` URL. Then
  Revoke → link dies (403). Negatives: expired OTP rejected; >5 codes/(link,email) or >20/link in an hour → 429.
- **Screener room** — client sets a title's screener source (master or a dedicated upload); GC generates a
  screener link on `/gc/review`; logged-out → identity → code → the screener **plays** (streamed, not
  downloaded); the per-viewer summary on `/gc/review` shows % watched + completed.
- **Glacier restore** — force a master to Glacier (or wait out the 90-day rule); open its portal link →
  first access shows "preparing (~3–5h)" + a `restore_requested` event; after restore, the same link
  serves/plays it; a second access during the window launches **no** new retrieval.

Also confirm **notifications**: reject a title → the client's `/messages` shows it (with the reason) + the
nav unread badge; advance a delivery → a "delivery update" message appears.

---

## What unlocks after go-live (code work, when you're ready)
- **Notification email residual** — GC-support/asset notification still uses Resend
  (`RESEND_API_KEY`). Auth OTP is SES. Do not send Auth mail through Resend.
- **Health score** — aggregate of findings, once you finalize the canonical metadata field list (§21.1).
