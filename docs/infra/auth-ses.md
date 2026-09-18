# Auth transactional email — SES us-west-2

Mail transport only. Auth stays Supabase Auth. **No Cognito.**

SES production in the E8/24Frame account (`405912452061`) is approved in
`us-west-2` (case 178940071800399; out of sandbox). `24frame.co` + DKIM are
verified there. The prior Resend lock for Auth is superseded.

## Deliverability lock (2026-09-15)

- **From:** `24Frame <auth@24frame.co>` — never `noreply@` / `no-reply@`.
  SES reputation guidance forbids noreply as From or Reply-To.
- **Reply-To:** `PORTAL_EMAIL_REPLY_TO` if set, otherwise `admin@globalcontent.co`.
- **Configuration set:** every Auth `SendEmailCommand` sets
  `ConfigurationSetName: "24frame-auth"`. The set already exists; IAM already
  allows `configuration-set/24frame-auth`.
- **Purpose tag:** `EmailTags: [{ Name: "purpose", Value: "auth" }]`.
- **MAIL FROM:** `send.24frame.co` is already LIVE. Do not invent another
  subdomain.

CoS already set Vercel Production + Preview
`PORTAL_EMAIL_FROM=24Frame <auth@24frame.co>` and redeployed. Local/default
matches that lock via `AUTH_SES_DEFAULT_FROM`.

## What sends where

| Mail | Transport | From |
| --- | --- | --- |
| Dashboard magic link | SES | `PORTAL_EMAIL_FROM` / `24Frame <auth@24frame.co>` |
| Mobile sign-in (link + OTP) | SES | same |
| Portal OTP / verification | SES | same |
| GC-Support / asset notification | **Resend residual** | `ASSETS_EMAIL_FROM` / `assets@globalcontent.co` |

Do not invent domains. Do not reuse `AWS_*` (titles), `FINANCE_AWS_*`
(finance S3), or `MEDIA_AWS_*` (social).

## Env names (server-only — never `NEXT_PUBLIC_`)

Set on Vercel Production + Preview, and in local `.env.local` for live send.
Names only — never commit values.

```
SES_AWS_REGION=us-west-2
SES_AWS_ACCESS_KEY_ID=
SES_AWS_SECRET_ACCESS_KEY=
PORTAL_EMAIL_FROM=
PORTAL_EMAIL_REPLY_TO=
```

`PORTAL_EMAIL_FROM` must be an address on `24frame.co`. If unset, Auth send
defaults to `24Frame <auth@24frame.co>`. Never set From or Reply-To to
`noreply@` / `no-reply@`.

`PORTAL_EMAIL_REPLY_TO` is optional. If unset, Auth send uses
`admin@globalcontent.co`.

Residual (not Auth):

```
RESEND_API_KEY=
ASSETS_EMAIL_FROM=
```

## Suppression (AWS-owned — do not reinvent)

Account-level suppression is **already enabled** in SES us-west-2 for
**BOUNCE + COMPLAINT**. SES will not deliver further Auth mail to those
addresses. This repo does not manage the list and does not call
`GetSuppressedDestination` (that would need extra IAM on `24frame-auth-ses`
and a pre-send round trip). IAM stays `ses:SendEmail` + `ses:SendRawEmail`
only.

SNS email alerts to `admin@globalcontent.co` are **Confirmed** for
BOUNCE + COMPLAINT. Those alerts are **operator-facing**. There is **no**
custom SNS → DB webhook in this app.

On `SendEmail`, the app maps SES `MessageRejected` and suppression-shaped
destination failures (`suppression list` / `suppressed destination`) to
`AuthSesSuppressedError` (`src/lib/auth-ses.ts`) with the recipient address.
Other SES faults stay generic `Email send failed: …`.

Dashboard `/login` and mobile `/api/mobile/request-sign-in` catch
`AuthSesSuppressedError` and show `AUTH_SES_SUPPRESSED_USER_MESSAGE`
("This address cannot receive sign-in mail.") — no AWS internals. Portal
`/api/portal/request-otp` lets the error propagate; the buyer UI does not
distinguish mail failures today (non-403/429 maps to the expired/withdrawn
string). Operators still get the SNS bounce/complaint alert.

AWS account-level suppression can also accept `SendEmail` and drop delivery
asynchronously. That path is **not** mapped here — SNS remains the operator
signal. Do not add a webhook unless a later founder-authorized slice says so.

## IAM (founder-executed)

Dedicated send user in the E8 account, `us-west-2`. Suggested name
`24frame-auth-ses`. Allow `ses:SendEmail` and `ses:SendRawEmail` on the
verified `24frame.co` identity and `configuration-set/24frame-auth`. Do not
attach title, finance, or media policies. Do not add
`ses:GetSuppressedDestination` unless a later slice adds a pre-send check.
Do not apply from CI.

## Live smoke (founder / CoS)

CI covers the SES command shape (config set, Reply-To, purpose tag, default
From `auth@`) and that Auth callers still build the house templates. A live
inbox send needs the `SES_AWS_*` credentials this environment does not have.

```bash
# Dry-run — prints whether env names are set. No send. No secret values.
pnpm exec tsx scripts/email/ses-auth-smoke.ts

# Live — one house magic-link template from the 24frame.co identity.
pnpm exec tsx scripts/email/ses-auth-smoke.ts --live --to <inbox>
```

Confirm the message arrives from `auth@24frame.co`, Reply-To is the monitored
address, and SES in us-west-2 shows the MessageId under configuration set
`24frame-auth`. The smoke link is not a usable session.
