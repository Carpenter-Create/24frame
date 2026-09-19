# Account Team invite + house grant/comp

Founder locks 2026-09-19. One account model. Solo vs company is org size only.

## Data model

Existing SoT, extended — not forked:

| Fact | Lives in |
| --- | --- |
| Account | `organizations` |
| Seat + role | `memberships` + `org_role` |
| House staff | `gc_staff` + `gc_role` |
| Plan / entitlement | `contract_terms.tier` |
| Pending email invite | `account_invites` |

`account_invites` is email-first (the user may not exist yet). Status changes only — never deleted. `token_hash` is SHA-256 of the raw token; the raw token is emailed and never stored. Authenticated SELECT is column-enumerated and omits `token_hash` (a table-level GRANT would still expose it).

Two kinds, one table:

- `team` — invite onto an existing org with an `org_role`
- `house_grant` — staff creates/grants a new account user + tier

## Authz (fail-closed)

| Action | Who |
| --- | --- |
| Team invite / withdraw | `member_can(manage_team)` — account owner of that org; `gc_account_owner` via `gc_can` |
| House grant / withdraw | `is_gc_staff` AND `gc_can(operate)` — house owner + delivery ops. Legal / accountant cannot. UI hides Grant account unless operate. Actions return SoT `forbidden`, not raw SQL. |
| Accept | Authenticated session whose email matches the invite (case-normalized). Wrong session sees `wrongEmail` + magic-link for the invited email. After accept, `setActiveOrg` writes `gc_active_org`. |
| Peek | Knowledge of `token_hash` (public `/invite/accept`) |
| Team roster | `member_can(view)` on that org |
| Pending grants list | `is_gc_staff` |

Viewers cannot invite. Client Settings never lists all platform users.

## Email accept path

1. Owner or staff creates the invite (RPC writes the hash).
2. SES auth mail (`auth@24frame.co`) sends `/invite/accept?token=…`.
3. Logged-out visitors stay on `/invite` (public, token-gated) and request a magic link with `next` back to accept.
4. `accept_account_invite` matches email, writes the seat (and for a grant: org + owner + `contract_terms`).

After a grant accept, that person is a normal account owner and can use Team invite.

## Where staff comps live

`/aggregation/gc/clients` — existing house Clients page, **Grant account** section composed next to the directory (not inside the list primitive). Not Settings. Not staff Home. Not a CRM.

## Defaults

- Team role: `viewer` (least seat)
- Grant plan: `access` (least entitlement)
- Invite TTL: 14 days
- Premium term length on grant: 24 months (same as live `finalize_paid_signup`; app `TIER_META` still says 36)

## Deferred

- Stripe checkout / subscription row for comps — `contract_terms.tier` is the entitlement SoT
- Clickwrap `contract_assents` on a complimentary grant (founder/counsel)
- Dedicated `term_trigger_enum` value `house_grant` (ADD VALUE cannot be used in the same transaction; grant provenance is `source_documents.kind = house_grant`)
- House inviting house staff onto `gc_staff` (still provisioned out of band)
- Full platform user directory
- Preferences / avatar menu (PR #484)

Production SQL apply remains founder-executed after merge.
