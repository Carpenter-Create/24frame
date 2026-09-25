# [GC][24Frame] LOCK — Topics ↔ composer hairline divider v1.4

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam 2026-09-24 · must have gray line between Topics and compose · surround unsure → Design call · CoS Own→READY) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · stay #681 **DRAFT** · Adam glances height+divider once · CoS CLEAR → Dev · Design HOLD invent else  
**Repo citation:** `docs/design-locks/social-home-composer-fb-row-sheet-lock-v1.4.md`  
**Box draft:** `/workspace/24frame-agg-ux/social-home-composer-fb-row-sheet-lock-v1.4.md`  
**Pattern:** **FB-row+sheet** — unchanged  
**Keeps v1.3 height:** composer outer band **32** === Topics chip **32** · host pad Y **0** · border none · radius 0 · transparent · avatar/field **32** — **do not reopen**  
**Keeps:** field-air v1.2 · icons v1.1 · Share something · spine B–D · rail identity · Create dock  
**Gospels:** Launch-great · quiet redundant-chrome (one separator signal when enough) · field-air (no heavy white capsule) · Media Immersion  
**Out:** Full surround / box around Share something · field hairline regress · host card chrome regress · Dev guessing · soft “maybe both”

---

## One lock

**Required:** a house hairline **between** Topics and the composer row.  
**Surround decision:** **Between-only — no full surround.** No box/border on all sides of Share something.

---

## Surround decision (Design call)

| Option | Verdict |
|--------|---------|
| **Between-only hairline** (Topics ↔ composer) | **OWN** |
| Full surround / hairline all around composer host | **OUT** |

**Why (one line):** A full surround rebuilds the heavy white capsule v1.3 killed and fights field-air; one between-section hairline is enough quiet chrome and leaves band height **32** untouched.

---

## Divider tokens (phone SoT)

| Token | Lock |
|-------|------|
| Color | Hairline **`#ECEDF0`** |
| Weight | **`1px`** solid |
| Width | Full **center column** (same content width as Topics / composer — not viewport-bleed past page pad) |
| Placement | **Between** Topics row and composer row — **sibling rule**, not composer host border |
| Stack | Topics (**32**) → gap **8** → divider **1px** → composer (**32**) |
| Gap note | Spine Topics→composer air stays **8** **above** the line (Topics bottom → line). Line sits immediately above the composer band. Composer band height **excludes** the 1px (divider is not inside the 32). |
| Host (v1.3) | Still **border none** · **radius 0** · **transparent** · pad Y **0** — divider is **not** `border-top` on the host if that would count inside the 32 or redraw a capsule; prefer a dedicated `1px` separator node/rule between sections |
| Field | Still transparent · border none · shadow none (v1.2) |
| Below composer | **No** required hairline this lock (do not invent Stories separator here) |

---

## Explicit OUT

| OUT | Why |
|-----|-----|
| Hairline on all four sides of Share something | Surround = capsule regress |
| Host `border` / radius card returning | Undoes v1.3 |
| Field `#ECEDF0` stroke | Undoes field-air |
| Divider inside the 32 band (shrinking avatar to 31) | Height conflict — keep divider outside band |
| Soft both/and surround “for clarity” | Quiet redundant-chrome FAIL |

---

## FAIL / PASS

| PASS | FAIL |
|------|------|
| Visible `#ECEDF0` 1px between Topics and Share something | No divider |
| Composer band still measures **32** · Topics **32** | Surround or border eats height / redraws capsule |
| Field still airy · no box around row | Full surround |

---

## Done-when (CoS → Adam glance → Dev #681 DRAFT)

1. Phone: hairline `#ECEDF0` **1px** between Topics and composer.  
2. No surround on Share something.  
3. v1.3 height **32** intact · field-air + icons intact.  
4. Adam one glance: height + divider.  
5. No Design PR.

**Ship:** Design Own→READY · Adam glance · CoS CLEAR · Dev #681 tip · Design HOLD invent else.

---

## Report (for CoS)

- **READY tip:** Topics↔composer hairline required · **no surround**
- **Lock path:** `/workspace/24frame-agg-ux/social-home-composer-fb-row-sheet-lock-v1.4.md` → `docs/design-locks/social-home-composer-fb-row-sheet-lock-v1.4.md`
- **Surround decision:** **Between-only** (OUT full surround)
- **Tokens:** `#ECEDF0` · `1px` · center-column width · Topics → gap **8** → divider → composer **32** · divider outside the 32 band · host stays border-none
