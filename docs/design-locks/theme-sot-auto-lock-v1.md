# [GC][24Frame] LOCK — Theme source of truth, Auto v1

**Date:** 2026-09-23
**Status:** **LOCKED**
**Scope:** Theme preference — one store, three writers
**Related:** [`preferences-settings-row-grammar-lock-v1.md`](preferences-settings-row-grammar-lock-v1.md)

## Store

One key: `gc-theme`. Every write goes through `lib/theme.ts`. No twin store.

| Stored value | Face label |
| --- | --- |
| `light` | Light |
| `dark` | Dark |
| `auto` | **Auto** |

The label is **Auto**. Not “System default”.

Unset stays Light. Auto is a stored choice, not the missing-key default.

Auto follows `prefers-color-scheme`. When the OS scheme changes, Auto re-resolves the `.dark` class. Light and Dark do not listen.

## Entries

The avatar Theme drill and the Preferences Theme row open the **same** picker component and the **same** writes (`applyDocumentThemePreference` → `gc-theme`).

The header sun/moon is a different control: an explicit light ↔ dark flip. It stores `light` or `dark`. It **exits Auto**.

## OUT

- Theme under Notifications
- A second theme store
- The label “System default”
- Inventing craft beyond this lock

## Repo citation

`docs/design-locks/theme-sot-auto-lock-v1.md`
