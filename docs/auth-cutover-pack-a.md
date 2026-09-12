# Auth cutover Pack A — inventory + plan

> **Status: inventory + recommendation only. Not execute.** This file is Pack A.
> It does not authorize Pack B, production mutation, Auth writes, user import or
> delete, schema apply, Vercel env flips, or donor-project deletion. Pack B waits
> founder (Adam) lock after a fresh inventory. Do not merge this as execute
> authority.
>
> **Auth stays Supabase Auth.** No Cognito. No Aurora. Mapping C is unchanged.
>
> Queried **2026-09-12** via Supabase MCP `execute_sql` (SELECT only) against both
> live projects. Counts below are those results, copied verbatim. This Pack A
> draft did **not** re-query. Emails and email domains are omitted on purpose.

Repo remains `Carpenter-Create/globalcontent-dashboard`. Product language is
24Frame. Start point for this plan: `main` tip `1f081874` (Social UI v0).
Pack B record: [`auth-cutover-pack-b.md`](auth-cutover-pack-b.md).

---

## Projects

| Role | Project ref | Name | Region | Status | Created |
| --- | --- | --- | --- | --- | --- |
| **Survivor** (keep) | `uevsculwzwlhxeamagwg` | Global Content Dashboard | us-west-2 | ACTIVE_HEALTHY | 2026-07-21 |
| **Donor** (do not delete in Pack B) | `qxribdfzkvffambaartp` | 24Frame | us-east-1 | ACTIVE_HEALTHY | 2026-09-10 |

Vercel `NEXT_PUBLIC_SUPABASE_URL` and service keys already point at the survivor.
Do not flip them in Pack B.

---

## 1. Inventory

Query time: **2026-09-12**. Source: read-only `SELECT` against both live
projects. **PII omitted on purpose** — no emails, no email-domain list, no
user ids in this public file.

### Survivor — `uevsculwzwlhxeamagwg`

#### Auth

| Metric | Count / value |
| --- | --- |
| `auth.users` | 5 |
| deleted | 0 |
| confirmed | 5 |
| SSO | 0 |
| anonymous | 0 |
| banned | 0 |
| identities | 5 |
| providers | `[email]` only |
| first_user | 2026-07-21 03:40:40 UTC |
| last_user | 2026-08-15 17:26:03 UTC |
| distinct email domains | 5 (not listed) |

#### Catalog / operator

| Metric | Count |
| --- | --- |
| `gc_staff` | 2 |
| `organizations` | 4 |
| `memberships` | 4 |

#### Social spine (schema LIVE, data empty)

| Metric | Count |
| --- | --- |
| `profiles` | 0 |
| orphan_profiles | 0 |
| auth_without_profile | 5 |
| `groups` | 0 |
| `group_members` | 0 |
| `posts` | 0 |
| `likes` | 0 |
| `blocks` | 0 |
| `conversations` | 0 |
| `conversation_participants` | 0 |
| `messages` | 0 |
| `point_events` | 0 |

`auth_without_profile = 5` is Mapping C, not a defect: five survivor Auth users
and zero opt-in `profiles` rows.

#### Ask 24Frame AI (stay on survivor)

| Metric | Count |
| --- | --- |
| `ai_conversations` | 7 |
| `ai_conversation_messages` | 22 |

Do not move these to the donor. Pack 0 already renamed Ask 24Frame AI off
`conversations` / `conversation_messages` so donor DMs can occupy those names.

#### Applied social migrations on survivor

Live applied versions (inventory 2026-09-12):

| Applied version | Name |
| --- | --- |
| `20260912032826` | Pack 0 rename (Ask 24Frame AI → `ai_*`) |
| `20260912034413` | `identity_spine` |
| `20260912040353` | `groups_posts` |
| `20260912044030` | `likes` |
| `20260912050532` | `direct_messages` |

Repo source files (filenames differ from live applied versions; that is
expected when MCP apply assigns its own version):

- `supabase/migrations/20260912000100_rename_ask_globee_ai_conversation_tables.sql`
- `supabase/migrations/20260912033234_identity_spine.sql`
- `supabase/migrations/20260912120000_groups_posts.sql`
- `supabase/migrations/20260912180000_likes.sql`
- `supabase/migrations/20260912200000_direct_messages.sql`

Schema is already on the survivor. Pack B must not re-apply it.

### Donor — `qxribdfzkvffambaartp`

#### Auth

| Metric | Count |
| --- | --- |
| `auth.users` | 0 |
| identities | 0 |
| sessions | 0 |
| refresh_tokens | 0 |

#### Social tables EXIST, all row counts 0

`profiles`, `groups`, `group_members`, `posts`, `likes`, `blocks`,
`conversations`, `conversation_participants`, `messages`, `point_events`.

| Metric | Count |
| --- | --- |
| orphan_profiles | 0 |
| auth_without_profile | 0 |

#### Applied migrations on donor

| Applied version | Name |
| --- | --- |
| `20260910030605` | `identity_engagement_spine` |
| `20260910121226` | `groups_posts` |
| `20260910131540` | `likes` |
| `20260912014715` | `direct_messages` |

### Overlap (computed from empty donor)

| Metric | Count |
| --- | --- |
| UUID overlap | 0 |
| Email collision set | 0 |
| Donor social rows that still matter | none (all zero) |

Survivor social spine is also empty. **Only survivor Auth + catalog + AI
threads matter.**

### Inventory SELECT set (re-run before Pack B)

COUNT-only. Do not `SELECT` email or domain lists. Do not write. Run the same
shapes on **both** projects immediately before execute.

```sql
-- Auth population
select count(*) as users from auth.users;
select
  count(*) filter (where deleted_at is not null) as deleted,
  count(*) filter (where email_confirmed_at is not null) as confirmed,
  count(*) filter (where is_sso_user is true) as sso,
  count(*) filter (where is_anonymous is true) as anonymous,
  count(*) filter (where banned_until is not null) as banned
from auth.users;
select count(*) as identities from auth.identities;
select array_agg(distinct provider order by provider) as providers from auth.identities;
select min(created_at) as first_user, max(created_at) as last_user from auth.users;
select count(distinct split_part(lower(email), '@', 2)) as distinct_email_domains
from auth.users;
-- donor only (empty on 2026-09-12):
select count(*) as sessions from auth.sessions;
select count(*) as refresh_tokens from auth.refresh_tokens;

-- Catalog / operator (survivor)
select count(*) as gc_staff from public.gc_staff;
select count(*) as organizations from public.organizations;
select count(*) as memberships from public.memberships;

-- Social spine + Mapping C occupancy
select count(*) as profiles from public.profiles;
select count(*) as orphan_profiles
from public.profiles p
where not exists (select 1 from auth.users u where u.id = p.id);
select count(*) as auth_without_profile
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
select count(*) as groups from public.groups;
select count(*) as group_members from public.group_members;
select count(*) as posts from public.posts;
select count(*) as likes from public.likes;
select count(*) as blocks from public.blocks;
select count(*) as conversations from public.conversations;
select count(*) as conversation_participants from public.conversation_participants;
select count(*) as messages from public.messages;
select count(*) as point_events from public.point_events;

-- Ask 24Frame AI (survivor only; stay)
select count(*) as ai_conversations from public.ai_conversations;
select count(*) as ai_conversation_messages from public.ai_conversation_messages;
```

Overlap is computed **across** projects (not one SQL session): UUID overlap =
count of `auth.users.id` present in both; email collision set = count of
lowercased emails present in both. On 2026-09-12 both were **0** because donor
`auth.users` was **0**.

If donor `auth.users` **> 0** on re-inventory, **stop**. Do not execute option
(c). Reopen (a)/(b).

---

## 2. Options

Social person FKs (Mapping C) all point at `profiles.id`, and `profiles.id`
equals `auth.users.id` (`ON DELETE CASCADE` from Auth → profile only). Catalog
tables (`gc_staff`, `organizations`, `memberships`, titles, assets) stay on the
survivor and are not remapped by any option.

### (a) Same-UUID user import donor → survivor

Copy donor `auth.users` (and identities) onto the survivor **keeping each
donor UUID**.

FK remap implications if donor social rows existed:

| Table | FK | Remap if same UUID kept? |
| --- | --- | --- |
| `profiles` | `id` = `auth.users.id` | No remap. Copy row as-is after the Auth user exists. |
| `groups` | `created_by` → `profiles.id` | No remap. |
| `group_members` | `user_id` → `profiles.id` | No remap. |
| `posts` | `author_id` → `profiles.id` | No remap. |
| `likes` | `user_id` → `profiles.id` | No remap. |
| `blocks` | `blocker_id` / `blocked_id` → `profiles.id` | No remap. |
| `conversations` | `created_by` → `profiles.id` | No remap. |
| `conversation_participants` | `user_id` → `profiles.id` | No remap. |
| `messages` | `sender_id` → `profiles.id` | No remap. |
| `point_events` | `user_id` / `actor_id` → `profiles.id` | No remap. |

**Today:** donor Auth is empty and every social table on both sides is 0. There
is nothing to import and nothing to remap. Collision risk appears only if a
later donor user reuses a UUID already on the survivor (overlap is 0 now).

Irreversible if executed: Auth user create on the survivor; those ids become
live login subjects.

### (b) Email rematch merge

Match donor users to survivor users by email. On a hit, keep the **survivor**
`auth.users.id` and rewrite every donor social FK from the donor UUID to the
survivor UUID. On a miss, import as a new survivor user (then same-UUID or a
new UUID plus remap).

FK remap implications if donor social rows existed:

| Table | What would be rewritten |
| --- | --- |
| `profiles` | Cannot keep donor `id` on a collision — the survivor already owns that email's Auth id. Insert/merge the person row under the survivor UUID, or skip if a profile already exists. |
| `groups` | `created_by` donor UUID → survivor UUID. |
| `group_members` | `user_id` remap; PK `(group_id, user_id)` can collide. |
| `posts` | `author_id` remap. |
| `likes` | `user_id` remap; PK `(user_id, target_type, target_id)` can collide. |
| `blocks` | both person columns; PK can collide. |
| DM tables | `created_by`, `user_id`, `sender_id`; `dm_key` is a sorted pair of profile UUIDs and would have to be rebuilt. |
| `point_events` | `user_id` / `actor_id`; unique `(user_id, reason, source_type, source_id, actor_id)` can collide. |

**Today:** email collision set is **0** and donor Auth is **0**. There is no
rematch set and no social rows to rewrite.

Irreversible if executed: PK/FK rewrites and possible row merges. No clean
undo once traffic writes new rows against the remapped ids.

### (c) Survivor-SoT / abandon donor Auth (early-only)

Treat the survivor as the only Auth and catalog source of truth. Do not import
users. Do not delete users. Do not remap FKs. Leave the donor project in place
(separate later lock). Future opt-in `profiles` attach to survivor
`auth.users.id` (Mapping C).

FK remap implications **today** (both social spines empty):

| Table | Action |
| --- | --- |
| `profiles` | None. 0 rows. Later opt-in uses survivor Auth id. |
| `groups` / `group_members` / `posts` | None. 0 rows. |
| `likes` / `blocks` | None. 0 rows. |
| `conversations` / `conversation_participants` / `messages` | None. 0 rows. |
| `point_events` | None. 0 rows. |
| catalog + `gc_staff` + Ask 24Frame AI | Already on survivor. Untouched. |

This option is **early-only**. It is valid only while donor `auth.users` stays
**0** and donor social row counts stay **0**. If the donor grows a second
population, (c) is closed.

---

## 3. Recommended: (c)

Donor Auth is empty. Donor social data is empty. Survivor social spine is
empty. Survivor already holds the only live Auth population (**5** users), the
catalog (**2** `gc_staff`, **4** organizations, **4** memberships), and Ask
24Frame AI (**7** / **22**).

- No import.
- No FK remap.
- No Vercel env flip (already survivor).
- No schema apply (already applied on survivor).
- Future opt-in `profiles` attach to survivor `auth.users.id` (Mapping C).

Mapping C (locked, unchanged):

- `gc_staff` stays operator.
- `organizations` / `memberships` stay distribution/catalog.
- `profiles` is the optional 24Frame audience/person row.
- One `auth.users.id` on the survivor may be `gc_staff` + membership + profile
  in any combination.
- A creator need not have a catalog org.
- Do not auto-create `profiles` on org invite or membership insert.
- Revoking membership must not delete a profile.
- Do not wire `is_gc_staff` into social policies as a privilege bridge.

`auth_without_profile = 5` is the expected pre-opt-in state under Mapping C.

---

## 4. Why not (a) / (b) now

- **Nothing to import.** Donor `auth.users` is 0. Donor identities / sessions /
  refresh_tokens are 0. Every listed social table is 0 on both sides.
- **(a)** would only be needed if the donor later gains users **before** Pack B.
  Re-inventory is the gate. Same-UUID import is the wrong amount of machinery
  for an empty donor.
- **(b)** has no collision set (email collision set = 0) and no donor users to
  rematch. Remap SQL would be a no-op that still trains the wrong habit: rewriting
  person FKs when the survivor already owns Auth.

If re-inventory shows donor `auth.users` > 0, stop (c) and reopen (a) or (b)
using the appendix checklists. Do not invent a hybrid in Pack B.

---

## 5. Pack B execute checklist (chosen: (c))

Founder-executed only. Pack B is **not** authorized by this file. Re-read the
inventory the day of execute. Isolation-green on this docs PR is not a reserved
gate pass.

### Ordered steps — option (c)

1. **Re-run the inventory SELECTs in §1 on both live projects.** Compare every
   count in this file. Do not round. Do not skip overlap.
2. **Stop gate (irreversible if ignored).** If donor `auth.users` > 0, **STOP**.
   Reopen (a)/(b). Do not execute (c) blindly. If any donor social count > 0,
   **STOP** and reopen — (c) assumed those tables empty.
3. Confirm survivor still has `auth.users` = 5 or a founder-accepted delta,
   catalog still present, Ask 24Frame AI still on survivor (`ai_*` not moved).
4. Confirm Mapping C still holds in schema: `profiles.id` → `auth.users(id)`;
   social FKs → `profiles.id`; no `org_id` on social tables; no auto-create
   profile trigger on `auth.users` / `memberships` / `organizations`.
5. **Do not import users.**
6. **Do not delete users** (survivor or donor).
7. **Do not flip** Vercel `NEXT_PUBLIC_SUPABASE_URL` or service keys. They
   already target the survivor.
8. **Do not apply schema.** Survivor already has Pack 0 + identity_spine +
   groups_posts + likes + direct_messages.
9. **Do not delete the donor project in Pack B.** That is a separate later
   lock. Pack B must not pause-delete, wipe, or unlink it.
10. Record the re-inventory timestamp and the decision "(c) held" or "stopped"
    in the Pack B PR. No production apply from that record.

**Irreversible steps under (c):** none, if the stop gate is honored. The
forbidden actions in steps 5–9 **are** irreversible if someone performs them
anyway (Auth import/delete, env flip, schema re-apply, donor delete).

### Optional later — **not this pack**

- Disable donor Auth signup, and/or pause the donor project, so it cannot grow
  a second population that would invalidate (c).
- Donor-project deletion remains a **separate later lock**, not Pack B.

### Mapping C confirm (Pack B, still no writes)

One `auth.users.id` on the survivor may be `gc_staff` + membership + profile in
any combo. Do not auto-create profiles. Catalog membership without a profile
must keep working (current `auth_without_profile` = 5).

---

## 6. HARD OUT remainder

Out of this pack and out of Pack B execute. Do not pull them in.

| Item | Note |
| --- | --- |
| **#16** | Leaderboards. Existing HOLD in Packs 2–4 (`leaderboards (#16 HOLD)`). |
| **media / avatars** | S3 / `avatar_key` / Social photos. Account-photo bucket is a separate infra track. |
| **Expo** | Native client. Not this dashboard. |
| **group-chat** | `conversation_kind` may include `group`; productization is HOLD. |
| **repo rename** | Repo stays `Carpenter-Create/globalcontent-dashboard`. |
| **Social Figma** | Visual / copy checkpoint. Not this file. |
| **Cognito / Aurora** | Auth stays Supabase Auth. No platform cutover. |

Also still out: donor notifications/subscriptions tables (dashboard already has
different ones), realtime invention, donor `org_status` (`active`/`churned`).

---

## Appendix A — option (a) execute checklist (not chosen)

Use only if re-inventory shows donor `auth.users` > 0 **and** founder picks
same-UUID import. **Irreversible.** Do not run from this PR.

1. Re-run §1 SELECTs on both projects. Compute UUID overlap and email collision
   set (counts only; do not paste emails).
2. If UUID overlap > 0, **STOP**. Same-UUID import would collide on
   `auth.users.id`.
3. Founder lock on the exact import set (count + overlap = 0).
4. Snapshot / PITR posture on the survivor (founder-held, outside the repo).
5. **Auth Admin API (preferred over raw SQL):** for each donor user,
   `auth.admin.createUser` on the survivor with the **same `id`**, email, and
   confirmation state. Then recreate the email identity. Do not assign a new
   UUID.
6. **Do not** `INSERT` into `auth.users` / `auth.identities` by ad-hoc SQL
   unless founder-approved exact SQL is shown first. That path is reserved-gate
   and easy to desync from GoTrue.
7. If donor social counts are still 0: **do not** copy social tables. Future
   profiles attach to the imported survivor ids.
8. If donor social counts > 0: copy rows **after** Auth users exist, same
   UUIDs, no FK rewrite. Order: `profiles` → `groups` → `group_members` /
   `posts` → `likes` / `blocks` / conversations → `messages` / `point_events`.
9. Env flip **only if** Vercel still pointed at the donor (it does not today).
   `NEXT_PUBLIC_SUPABASE_URL`, publishable key, server service key — survivor
   values. No secrets in the repo. Redeploy is founder-executed.
10. Do not delete donor users or the donor project in the same lock as the
    import. Confirm logins on the survivor first.
11. Irreversible: each `createUser` on the survivor; any copied social row;
    any env flip once clients hold the new JWT issuer.

---

## Appendix B — option (b) execute checklist (not chosen)

Use only if re-inventory shows a **non-zero email collision set** or founder
explicitly wants rematch instead of same-UUID. **Irreversible.** Do not run
from this PR.

1. Re-run §1 SELECTs. Compute email collision set size and UUID overlap
   (counts only).
2. If collision set is 0 and donor users are 0, **do not use (b)** — that is
   today's state; (c) applies.
3. Classify each donor user: email hit on survivor vs miss.
4. **Hits:** keep survivor `auth.users.id`. Do not create a second Auth user.
   Draft (do not apply here) `UPDATE`s that rewrite donor social FKs to the
   survivor UUID, then copy. Rebuild `conversations.dm_key` from the remapped
   pair. Watch PK collisions on `group_members`, `likes`, `blocks`,
   `point_events`.
5. **Misses:** import via Auth Admin API (new or same UUID). If a new UUID is
   issued, remap as in step 4.
6. Exact SQL / Admin API payload is a reserved gate. Show it; founder approves;
   founder applies. No agent apply.
7. Env flip only if the app still targeted the donor (it does not today). Same
   vars as Appendix A. No secret samples in-repo.
8. Do not delete donor users until rematch is proven on the survivor.
9. Irreversible: every remapped PK/FK, every merged profile, every Auth create,
   every env flip.

---

## What this PR is not

- Not Pack B.
- Not a migration.
- Not an env sample.
- Not permission to query Auth for emails.
- Not permission to pause or delete the donor.
- Not a Cognito/Aurora decision.
- Not a change to Mapping C.
