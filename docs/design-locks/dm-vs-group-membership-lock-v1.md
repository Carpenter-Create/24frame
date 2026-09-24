# [GC][24Frame] LOCK — DM membership (1:1 + multi-party) v1.1

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam Apply 2026-09-24 — cap amend **16** BEFORE apply · DM copy not Groups product) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev  
**Repo citation:** `docs/design-locks/dm-vs-group-membership-lock-v1.md`  
**Box draft:** `/workspace/24frame-agg-ux/dm-vs-group-membership-lock-v1.md`  
**Adam FAIL (ADD PEOPLE on 1:1 thread):**  
`/workspace/24frame-agg-ux/dm-thread-refs/01-adam-fail-center-log-header.png`  
**Cites:** `dm-thread-header-density-lock-v1.md` (peer row · **no invent trailing**) · `dm-thread-message-format-lock-v1.md` (body/composer — do not reopen)  
**Supersedes:** v1 cap **32** · “Group / Create group / Groups product” copy  
**Out of scope:** #677 Send sheet · sticky composer tips · header density already CLEAR’d · #664 · inventing full inbox redesign · inventing a Groups product/label · dark-mode invent

---

## One lock

**1:1 DM** stays exactly two profiles forever — **no** Add people / invite. **Multi-party DM** exists only by starting a **fresh** direct-message thread and picking members (never promote a 1:1 by adding). Cap **16** people total (creator + ≤15), shown and enforced in the create picker. Product language stays **DM / direct message / multi-party DM** — not Groups.

---

## A) Direct (1:1) — never add

| Token | Lock |
|-------|------|
| Membership | Exactly **two** profiles for the life of the thread |
| ADD PEOPLE / Handle + Add | **OUT** of 1:1 thread body (FAIL shot 01) |
| Header trailing add / invite | **OUT** — density lock forbids inventing trailing; this lock forbids add affordances on 1:1 |
| Invite link / “Add to chat” | **OUT** on 1:1 |
| Convert / promote 1:1 → multi-party by adding | **OUT** |

---

## B) Multi-party DM — fresh create only

| Token | Lock |
|-------|------|
| How multi-party starts | **New** DM thread only · member pick **before** first message lands |
| Promote existing 1:1 | **OUT** |
| Add people into an existing DM (1:1 or multi-party) | **OUT** this lock (membership set at create; Adam may override later) |
| Entry (minimal — no inbox invent) | Use the **existing** Messages compose / New message entry already in product · picker supports multi-select · **do not** invent a new inbox tab, FAB, Groups surface, or marketing chrome |
| 1 selected other (+ self) | Creates / opens **1:1** DM |
| ≥2 selected others (+ self) | Creates **fresh multi-party DM** |
| Thread header label | Single label per density lock — thread title if set, else comma-truncated display names · **one** line · avatar **32** px (first-member avatar or existing asset — **do not invent** multi-face stack or Groups glyph this lock) |
| Product label | **DM / Message / New message** · **OUT:** Group, Groups, Create group, Group chat as product name |

---

## C) Cap 16 (Adam LOCK amend 2026-09-24)

| Token | Lock |
|-------|------|
| Cap | **16** people total including creator |
| Others selectable | ≤ **15** |
| Picker chrome | Persistent helper under search/header: **`N/16 selected`** (N = everyone in the thread including self) · `t-body-sm` secondary |
| At 0–15 | Selecting another person increments N |
| At 16 | Further select **disabled** · helper → **`16/16 · Chat is full`** · tap on disabled row no-ops |
| Over-cap submit | **OUT** — Chat / Next disabled when under 2 people or over 16 |
| Empty / only self | Cannot start multi-party · primary disabled |
| Copy | Exact **16** — no soft “up to about 15” · **32 out** |

---

## D) Picker geometry (create only — thin)

| Token | Lock |
|-------|------|
| Host | Existing compose sheet/page — house light · pad **16** |
| Search | Height **40** · radius **20** · muted fill (match Social search grammar already shipping) |
| Rows | Avatar **40** · display name `t-body` medium · handle `t-body-sm` secondary · check Sporty Blue `#1769FF` **20** when selected |
| Cap helper | Below search · pad top **8** · `N/16 selected` |
| Primary CTA | **Chat** (works for 1:1 and multi-party) · height **48** · Sporty Blue · full width · disabled when invalid · **OUT:** Create group |

---

## Dev ship checklist (one line)

**Ship:** strip ADD PEOPLE from every 1:1 · never promote 1:1→multi-party · multi-party DM = fresh compose multi-select only · show+enforce **N/16** · Chat CTA (no Groups label) · header stays density lock (no add trailing) · no Send/#664/inbox invent.

---

## FAIL / PASS

**PASS:** 1:1 has no add UI · multi-party only from new picker · hard stop at 16 with visible count · DM copy only.  
**FAIL:** ADD PEOPLE on 1:1 · convert by inviting · cap 32 leftover · Groups product language · silent cap · inventing inbox chrome · new header trailing add icon.

---

## Keep closed

- `dm-thread-header-density-lock-v1.md`  
- `dm-thread-message-format-lock-v1.md`  
- `stories-send-dm-craft-lock-v1.md` v1.5  

---

## Label

**[Global Content][24Frame]** DM membership v1.1 — 1:1 sealed · fresh multi-party DM · cap 16
