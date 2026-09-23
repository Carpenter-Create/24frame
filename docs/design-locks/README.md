# Design locks

Design locks land in this directory before CoS undrafts a UI pull request.

## Rules

- One lock per file. The filename is the lock id.
- Cite the lock path in the pull request body: `docs/design-locks/….md`. A UI, visual, or information-architecture change cites the lock it follows.
- Phone never truncates. Prefer a vertical stack. House gospel 2026-09-19.
- Never-patch lookalikes. Do not restyle a near-match, fork a second host, or patch a cousin into the job. Extend the locked primitive, or stop.
- Craft lanes. One row unlock at a time. The order is [`house-dual-host-primitive-audit-v1.md`](house-dual-host-primitive-audit-v1.md). A pull request opens one row.

## Locks

- [`mobile-menu-family-tree-v1.md`](mobile-menu-family-tree-v1.md) — families A–D, OUT, parks
- [`house-dual-host-primitive-audit-v1.md`](house-dual-host-primitive-audit-v1.md) — primitive rows
- [`house-overlay-dual-host-v1.md`](house-overlay-dual-host-v1.md) — overlay geometry
- [`preferences-settings-row-grammar-lock-v1.md`](preferences-settings-row-grammar-lock-v1.md) — Preferences block types (PrefDrillGroup vs PrefControlSection) and type steps
- [`preferences-settings-row-grammar-lock-v2.md`](preferences-settings-row-grammar-lock-v2.md) — Preferences row geometry. Supersedes v1 geometry only (row layout, chevron alignment, inter-row rhythm, column width). Block types and type steps from v1 stay.
- [`theme-sot-auto-lock-v1.md`](theme-sot-auto-lock-v1.md) — Theme Auto, one `gc-theme` store
- [`theme-chrome-avatar-only-lock-v1.md`](theme-chrome-avatar-only-lock-v1.md) — avatar Theme drill; header sun/moon removed
- [`preferences-drill-nested-slugs-lock-v1.md`](preferences-drill-nested-slugs-lock-v1.md) — Preferences drill URLs nest under `/settings/preferences/<drill>`
- [`social-home-activity-feed-lock-v1.md`](social-home-activity-feed-lock-v1.md) — Social Home is the live activity feed at `/social`
- [`create-story-photo-video-fb-layout-lock-v1.4.md`](create-story-photo-video-fb-layout-lock-v1.4.md) — Create story stage at `/social/stories/new`. Photo and video each have Upload (file) and Take (live camera). Live Take/Record is a rectangular full-bleed viewfinder. Supersedes v1.3 viewfinder geometry.
- [`create-story-photo-video-fb-layout-lock-v1.3.md`](create-story-photo-video-fb-layout-lock-v1.3.md) — superseded by v1.4 for the live viewfinder. Media-path grammar retained.
- [`shell-desktop-horizontal-gutter-lock-v2.md`](shell-desktop-horizontal-gutter-lock-v2.md) — desktop shell L = R = 32. Supersedes v1.
- [`shell-desktop-horizontal-gutter-lock-v1.md`](shell-desktop-horizontal-gutter-lock-v1.md) — superseded by v2. #661 shipped 32 / 44.
