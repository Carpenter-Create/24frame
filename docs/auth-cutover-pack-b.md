# Auth cutover Pack B — path (c) held (record only)

> **Status: record only. Not execute.** This file is Pack B.
> It does not authorize Auth writes, user import or delete, schema apply,
> Vercel env flips, or donor-project pause or delete. Do not merge this as
> execute authority. Donor project delete is a later separate lock.
>
> **Adam lock 2026-09-12:** path **(c)** — survivor-SoT / abandon donor Auth.
> Survivor is the only Auth population. Donor Auth is abandoned for product
> use. No import. No FK remap.
>
> **Auth stays Supabase Auth.** No Cognito. No Aurora. Mapping C is unchanged.
>
> Emails and email domains are omitted on purpose.

Repo remains `Carpenter-Create/globalcontent-dashboard`. Product language is
24Frame. Start point: `main` tip `ed433823` (Pack A [#232](https://github.com/Carpenter-Create/globalcontent-dashboard/pull/232) MERGED). Plan:
[`docs/auth-cutover-pack-a.md`](auth-cutover-pack-a.md).

---

## Projects (unchanged)

| Role | Project ref | Pack B action |
| --- | --- | --- |
| **Survivor** (keep) | `uevsculwzwlhxeamagwg` | Source of truth. No writes in this pack. |
| **Donor** (stays) | `qxribdfzkvffambaartp` | Abandoned for product Auth. **Stays.** Do not pause or delete in this pack. |

---

## 1. Re-inventory (Pack A vs Pack B)

Re-inventory run **2026-09-12 14:28:57 UTC / 9:28 AM CT**. Source: read-only
`SELECT` via Supabase MCP immediately before this PR. Counts below are those
results, copied verbatim. This file does **not** invent counts. PII omitted —
no emails, no email-domain list, no user ids.

**Stop gate PASSED.** Gate: donor `auth.users` > 0 **OR** any donor social
count > 0 would **STOP**. Did not fire.

Pack A inventory: 2026-09-12 morning (see
[`docs/auth-cutover-pack-a.md`](auth-cutover-pack-a.md) §1). Pack B counts
below are **unchanged** vs that inventory on every table restated here.

Pack A also recorded SSO / anonymous / banned, `first_user` / `last_user`,
distinct email-domain count (not listed), `orphan_profiles`,
`auth_without_profile`, and `point_events`. Those extras are **not restated**
as Pack B counts. They are not invented here.

### Survivor — `uevsculwzwlhxeamagwg`

Queried_at: `2026-09-12 14:28:57.938999+00`

#### Auth

| Metric | Pack A | Pack B | Same? |
| --- | --- | --- | --- |
| `auth.users` | 5 | 5 | yes |
| deleted | 0 | 0 | yes |
| confirmed | 5 | 5 | yes |
| identities | 5 | 5 | yes |
| providers | `[email]` | `[email]` | yes |

#### Catalog / operator

| Metric | Pack A | Pack B | Same? |
| --- | --- | --- | --- |
| `gc_staff` | 2 | 2 | yes |
| `organizations` | 4 | 4 | yes |
| `memberships` | 4 | 4 | yes |

#### Social spine

| Metric | Pack A | Pack B | Same? |
| --- | --- | --- | --- |
| `profiles` | 0 | 0 | yes |
| `groups` | 0 | 0 | yes |
| `group_members` | 0 | 0 | yes |
| `posts` | 0 | 0 | yes |
| `likes` | 0 | 0 | yes |
| `blocks` | 0 | 0 | yes |
| `conversations` | 0 | 0 | yes |
| `conversation_participants` | 0 | 0 | yes |
| `messages` | 0 | 0 | yes |

#### Ask 24Frame AI (stay on survivor)

| Metric | Pack A | Pack B | Same? |
| --- | --- | --- | --- |
| `ai_conversations` | 7 | 7 | yes |
| `ai_conversation_messages` | 22 | 22 | yes |

### Donor — `qxribdfzkvffambaartp`

Queried_at: `2026-09-12 14:28:58.399061+00`

#### Auth

| Metric | Pack A | Pack B | Same? |
| --- | --- | --- | --- |
| `auth.users` | 0 | 0 | yes |
| identities | 0 | 0 | yes |
| sessions | 0 | 0 | yes |
| refresh_tokens | 0 | 0 | yes |

#### Social tables (all 0)

| Metric | Pack A | Pack B | Same? |
| --- | --- | --- | --- |
| `profiles` | 0 | 0 | yes |
| `groups` | 0 | 0 | yes |
| `group_members` | 0 | 0 | yes |
| `posts` | 0 | 0 | yes |
| `likes` | 0 | 0 | yes |
| `blocks` | 0 | 0 | yes |
| `conversations` | 0 | 0 | yes |
| `conversation_participants` | 0 | 0 | yes |
| `messages` | 0 | 0 | yes |

### Overlap

| Metric | Pack A | Pack B | Same? |
| --- | --- | --- | --- |
| Overlap | 0 | 0 | yes |

Overlap is still **0**. Do not list emails or domains.

---

## 2. Decision: (c) held

**(c) held.** Survivor is the only Auth population. Donor Auth is abandoned
for product use. No import. No FK remap.

- No user import (option (a) not used).
- No email rematch / FK rewrite (option (b) not used).
- No user delete on either project.
- Future opt-in `profiles` attach to survivor `auth.users.id` (Mapping C).

This option remains **early-only**. It stayed valid because donor
`auth.users` is still **0** and every listed donor social count is still
**0**. If the donor later grows a second population, (c) is closed — that
is a later lock, not this record.

---

## 3. Vercel (no env flip performed)

No Vercel env flip was performed in this pack.

Pack A already states: `NEXT_PUBLIC_SUPABASE_URL` and service keys point at
the survivor. That statement is confirmed here. This pack does **not** read
or print secrets, env files, or key values. Do not flip
`NEXT_PUBLIC_SUPABASE_URL` or service keys.

---

## 4. Mapping C confirm (still no writes)

Confirm only. No schema apply. No Auth writes.

- One survivor `auth.users.id` may be `gc_staff` + org membership + optional
  `profiles` in any combination.
- Do not auto-create `profiles` on org invite or membership insert.
- Org invites stay Aggregation-only.
- Catalog membership without a profile must keep working (`profiles` is
  still 0 on the survivor; five Auth users, zero opt-in person rows).
- Do not wire `is_gc_staff` into social policies as a privilege bridge.
- Revoking membership must not delete a profile.

---

## 5. Donor project stays

Donor project `qxribdfzkvffambaartp` **STAYS**.

Pause / delete is a later separate lock. This pack does not pause it, wipe
it, unlink it, or delete it.

---

## 6. HARD OUT remainder

Out of this pack. Do not pull them in.

| Item | Note |
| --- | --- |
| **Auth writes** | No create / update / delete on Auth. |
| **import / delete** | No user import. No user delete. |
| **schema apply** | Survivor already has Pack 0 + social packs. Do not re-apply. |
| **env flip** | Not performed. Already survivor. Do not flip. |
| **donor pause / delete** | Later separate lock. Donor stays. |
| **#16** | Leaderboards. Existing HOLD. |
| **media / avatars** | S3 / `avatar_key` / Social photos. Separate infra track. |
| **Expo** | Native client. Not this dashboard. |
| **group-chat** | Productization is HOLD. |
| **repo rename** | Repo stays `Carpenter-Create/globalcontent-dashboard`. |
| **Cognito / Aurora** | Auth stays Supabase Auth. No platform cutover. |

Also still out: Social Figma visual/copy checkpoint; donor
notifications/subscriptions tables; realtime invention; donor `org_status`.

---

## What this PR is not

- Not production apply.
- Not a migration.
- Not an env sample and not a secrets file.
- Not permission to query Auth for emails.
- Not permission to pause or delete the donor.
- Not a Cognito/Aurora decision.
- Not a change to Mapping C.
- Not authorization for a later donor-delete lock.
