# [GC][24Frame] LOCK — Preferences settings row grammar v1

**Date:** 2026-09-23
**Status:** **LOCKED**
**Scope:** Preferences pane — Location and Theme rows
**Evidence fail:** Location sitting bare on the page white. Do not ship that.

## One group

Location and Theme sit in **one** `PrefDrillGroup`.

| Piece | Lock |
| --- | --- |
| Host | Inset `SETTINGS_GROUP` + `SettingsDrillRow` |
| Order | Location, then Theme |
| Label | `t-body` |
| Value | `t-body-sm` · `ink-3` |
| Chevron | 16 |
| Row | min height **44** |

The group is the surface. A row does not sit on the page white by itself.

## Notifications

Notifications stays `PrefControlSection`: `t-heading` + helper + matrix.

Do not move Theme into that section. Do not restyle the matrix into the drill group.

## Forbidden

Bare orphan Location or Theme on page white.

## OUT

- Theme under Notifications
- A second row host for Location or Theme
- Inventing craft beyond this lock

## Repo citation

`docs/design-locks/preferences-settings-row-grammar-lock-v1.md`
