# [GC][24Frame] LOCK — DM vs group membership v1

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam product 2026-09-24 · CoS-defined cap **32**) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev  
**Repo citation:** `docs/design-locks/dm-vs-group-membership-lock-v1.md`  
**Box draft:** `/workspace/24frame-agg-ux/dm-vs-group-membership-lock-v1.md`  
**Adam FAIL (ADD PEOPLE on 1:1 thread):**  
`/workspace/24frame-agg-ux/dm-thread-refs/01-adam-fail-center-log-header.png`  
**Cites:** `dm-thread-header-density-lock-v1.md` (peer row · **no invent trailing**) · `dm-thread-message-format-lock-v1.md` (body/composer — do not reopen)  
**Out of scope:** #677 Send sheet · sticky composer tips · header density already CLEAR’d · #664 · inventing full inbox redesign · dark-mode invent

---

## One lock

**1:1 DM** stays exactly two profiles forever — **no** Add people / invite. **Group** exists only by starting a **fresh** thread and picking members (never promote a DM). Cap **32** members total (creator + ≤31), shown and enforced in the create picker.

---

## A) Direct (1:1) — never add

| Token | Lock |
|-------|------|
| Membership | Exactly **two** profiles for the life of the thread |
| ADD PEOPLE / Handle + Add | **OUT** of 1:1 thread body (FAIL shot 01) |
| Header trailing add / invite | **OUT** — density lock forbids inventing trailing; this lock forbids add affordances on 1:1 |
| Invite link / “Add to chat” | **OUT** on 1:1 |
| Convert / promote DM → group by adding | **OUT** |

---

## B) Group — fresh create only

| Token | Lock |
|-------|------|
| How a group starts | **New** thread only · member pick **before** first message lands |
| Promote existing DM | **OUT** |
| Add people into an existing thread (1:1 or group) | **OUT** this lock (membership set at create; Adam may override later) |
| Entry (minimal — no inbox invent) | Use the **existing** Messages compose / New message entry already in product · picker supports multi-select · **do not** invent a new inbox tab, FAB, or marketing chrome |
| 1 selected other (+ self) | Creates / opens **1:1** DM |
| ≥2 selected others (+ self) | Creates **fresh group** thread |
| Group header label | Single label per density lock — group title if set, else comma-truncated display names · **one** line · avatar **32** (group glyph or first-member avatar — reuse existing asset if any; **do not invent** multi-face stack this lock) |

---

## C) Cap 32 (CoS-defined)

| Token | Lock |
|-------|------|
| Cap | **32** members total including creator |
| Others selectable | ≤ **31** |
| Picker chrome | Persistent helper under search/header: **`N/32 selected`** (N = selected others + self counted in total) · `t-body-sm` secondary |
| At 0–31 | Selecting another person increments N |
| At 32 | Further select **disabled** · helper → **`32/32 · Group is full`** · tap on disabled row no-ops |
| Over-cap submit | **OUT** — Create / Next disabled until 2…32 and not over |
| Empty / only self | Cannot create group · Create disabled |
| Copy | No soft “up to about 30” — exact **32** |

---

## D) Picker geometry (create only — thin)

| Token | Lock |
|-------|------|
| Host | Existing compose sheet/page — house light · pad **16** |
| Search | Height **40** · radius **20** · muted fill (match Social search grammar already shipping) |
| Rows | Avatar **40** · display name `t-body` medium · handle `t-body-sm` secondary · check Sporty Blue `#1769FF` **20** when selected |
| Cap helper | Below search · pad top **8** · `N/32 selected` |
| Primary CTA | **Chat** (1:1) or **Create group** (≥2 others) · height **48** · Sporty Blue · full width · disabled when invalid |

---

## Dev ship checklist (one line)

**Ship:** strip ADD PEOPLE from every 1:1 · never promote DM→group · group = fresh compose multi-select only · show+enforce **N/32** in picker · Create disabled over cap · header stays density lock (no add trailing) · no Send/#664/inbox invent.

---

## FAIL / PASS

**PASS:** 1:1 has no add UI · groups only from new picker · hard stop at 32 with visible count.  
**FAIL:** ADD PEOPLE on DM · convert DM by inviting · silent cap · inventing inbox chrome · new header trailing add icon.

---

## Keep closed

- `dm-thread-header-density-lock-v1.md`  
- `dm-thread-message-format-lock-v1.md`  
- `stories-send-dm-craft-lock-v1.md` v1.5  

---

## Label

**[Global Content][24Frame]** DM vs group membership v1 — 1:1 sealed · fresh group · cap 32
