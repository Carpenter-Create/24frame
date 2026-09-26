# [GC][24Frame] LOCK — DM compose immersive IA v1.1 (Split like IG)

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam clarify amend 2026-09-24 — CoS REQUIRED before CLEAR · **Group chat** wording IN · group pages / community Groups OUT) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev follow-on tip  
**Repo citation:** `docs/design-locks/dm-compose-immersive-ia-lock-v1.md`  
**Box draft:** `/workspace/24frame-agg-ux/dm-compose-immersive-ia-lock-v1.md`  
**Adam FAIL (chrome tax + empty void):**  
`/workspace/24frame-agg-ux/dm-compose-refs/01-ours-new-message-chrome-void.png`  
**IG PASS:**  
`/workspace/24frame-agg-ux/dm-compose-refs/02-ig-new-message.png`  
`/workspace/24frame-agg-ux/dm-compose-refs/03-ig-new-group-chat.png`  
**Gospel:** Social = immersive tech social media — **not** paper/admin click-forms (Adam 2026-09-24 standing).  
**Doctrine:** Media Immersion stays for media surfaces; this lock is compose **IA + chrome + density**.  
**Cites:** `dm-thread-immersive-real-estate-lock-v1.md` (hide Social shell + dock) · `dm-vs-group-membership-lock-v1.md` **v1.1** (cap **16** · 1:1 sealed · fresh multi-party only)  
**Supersedes:** v1 “Multi-party chat / New multi-party chat” product strings (Adam IN: Group chat wording for IG-sense DM)  
**Out of scope:** #677 Send · #664 · inventing Channel / AI chats rows · **group pages / community Groups product** · inventing link-invite row · blocking #678 thread immersive tip

---

## One lock

**Split like IG:** Screen A **New message** (1:1-first + **Group chat** entry) → Screen B **New group chat** (dedicated multi-select + optional group/thread name). Both screens immersive (no Social shell / no tab dock). **Suggested** fills the viewport — empty white void under Chat is **FAIL**. Cap **16** with **N/16**. **Group chat** means multi-party / group **direct message** (IG sense) — **not** group pages or a separate community Groups product.

---

## Concrete strings (Adam clarify — locked)

| Surface | Copy |
|---------|------|
| Screen A title | **New message** |
| Screen A search | **To:** + placeholder **Search** |
| Screen A entry row (only one) | Title **Group chat** · subtext **Message up to 16 people** |
| Screen B title | **New group chat** |
| Screen B name field | Placeholder **Group name (optional)** |
| Screen B search | Placeholder **Search** |
| Cap helper | **`N/16 selected`** · at cap **`16/16 · Chat is full`** |
| Primary CTA | **Chat** |
| **IN** | Group chat · New group chat · optional group/thread name on create (IG-sense multi-party DM) |
| **OUT** | **Groups** (community/pages product) · **group pages** · **Create group** (ambiguous product CTA) · Channel · AI chats · link-invite invent · **Note:** **Group chat** / **New group chat** are IN — do not ban them |

---

## A) Immersive chrome (both compose screens)

Same as thread immersive lock:

| Token | Lock |
|-------|------|
| Social shell header | **HIDDEN** on compose routes |
| Phone bottom tab dock | **HIDDEN** on compose routes |
| Restore | Back / dismiss to inbox/list → shell + dock return |
| Floating debug FAB | **OUT** |
| House light | bg `#FAFAFB` / surface `#FFFFFF` · ink `#14171A` · no drop shadows · no IG dark invent |

---

## B) Screen A — New message (IG split entry)

| Token | Lock |
|-------|------|
| Header | Row **48** · back hit **40** · centered title **New message** `t-body` medium |
| To row | Height **40** · leading label **To:** · search field grows · selected people as chips (avatar **24** + name · dismiss ×) · pad **16** |
| Entry rows | **Exactly one** row under To: — **Group chat** · leading people icon in circle **40** · title + subtext **Message up to 16 people** · trailing chevron · hit full width · pad **16** · gap **8** |
| Channel / AI chats | **OUT** invent |
| Suggested | Section label **Suggested** `t-label` uppercase tracked · **fills remaining viewport** · scroll |
| Suggested row | Height **56** · avatar **40** · display name `t-body` medium · handle `t-body-sm` secondary · pad inline **16** |
| Suggested empty | Skeletons **≥6** rows while loading · never blank white void (FAIL ref 01) |
| 1:1 path | Tap Suggested person → add chip to To: · sticky **Chat** enables at **1** other · Chat opens/creates **1:1** DM |
| Group-chat path | Tap **Group chat** entry → push Screen B (dedicated multi-select · do not 16-select on Screen A) |
| Sticky Chat | Bottom safe-area · height **48** Sporty Blue when enabled · muted disabled when To: empty · **Suggested still visible above** |

---

## C) Screen B — New group chat (dedicated multi-party DM)

| Token | Lock |
|-------|------|
| Header | Row **48** · back · title **New group chat** |
| Group name | Optional · height **40** · radius **8** · hairline · placeholder **Group name (optional)** · pad **16** · margin bottom **8** |
| Search | Height **40** · radius **20** · muted fill · placeholder **Search** |
| Cap helper | **`N/16 selected`** · `t-body-sm` secondary · pad top **8** · counts everyone including self per membership v1.1 |
| Link-invite row | **OUT** invent |
| Suggested | Same density as Screen A · multi-select · Sporty Blue check circle **20** when selected |
| Select rules | ≥2 others (+ self) required for Chat · at **16** further select disabled · hard stop |
| Sticky Chat | **Chat** · Sporty Blue **48** · disabled until ≥2 others and ≤16 |
| Membership | Fresh multi-party / group DM only · never promote 1:1 · cites membership v1.1 |
| Meaning | This is a **group direct message** thread — **not** a group page, community hub, or Groups product surface |

---

## D) Density / FAIL patterns

| FAIL (ref 01) | PASS |
|---------------|------|
| Social shell + tab dock on compose | Immersive hide both |
| Empty white void under Chat | Suggested fills viewport |
| Paper form: big title + search + dead CTA + no people | Split IG flow + dense list |
| **Groups product / group pages** | **Group chat** OK (IG-sense group DM) |
| Banning or avoiding “Group chat” copy | Use **Group chat** / **New group chat** / **Group name (optional)** |
| Channel + AI rows | Single **Group chat** entry only |

---

## E) Desktop note

Same immersive hide of Social top chrome. Compose column max-width **680** centered. Same two-screen Split · same tokens.

---

## Dev ship checklist (one line)

**Ship:** Split A **New message** (To: + **Group chat** entry + dense Suggested) → B **New group chat** (optional **Group name (optional)** · N/16 · multi-select · **Chat**) · **Group chat OK** · Groups product/group pages FAIL · hide shell+dock · no void · no Channel/AI · no Create group product CTA · cap 16 · follow-on after #678.

---

## Keep closed

- `dm-thread-immersive-real-estate-lock-v1.md`  
- `dm-vs-group-membership-lock-v1.md` v1.1  
- `dm-thread-header-density-lock-v1.md`  
- `dm-thread-message-format-lock-v1.md`  

---

## Label

**[Global Content][24Frame]** DM compose immersive IA v1.1 — Split like IG · Group chat = group DM
