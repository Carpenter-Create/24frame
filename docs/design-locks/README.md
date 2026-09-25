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
- [`feed-caption-above-media-lock-v1.md`](feed-caption-above-media-lock-v1.md) — Home/feed posts with both text and media: author, caption, media, actions, likes (Facebook). Stories stay media-first.
- [`create-story-photo-video-fb-layout-lock-v1.5.md`](create-story-photo-video-fb-layout-lock-v1.5.md) — Create story stage at `/social/stories/new`. Photo and video each have Upload (file) and Take (live camera). Camera face is a rectangular full-bleed viewfinder plus Stories chrome (close, flash, shutter, gallery, flip, STORY). Supersedes v1.4.
- [`stories-upload-success-immersive-lock-v1.md`](stories-upload-success-immersive-lock-v1.md) — After a Story posts, one immersive studio confirm with the just-posted media. Kills the thin check card.
- [`stories-viewer-desktop-ig-carousel-lock-v1.md`](stories-viewer-desktop-ig-carousel-lock-v1.md) — Desktop story open is a full-viewport dark stage with a centered 9:16 card, dimmed neighbor cards, and chevrons. Phone is a full-bleed single card. Supersedes the light `max-w-[420px]` story page card.
- [`stories-viewer-ig-parity-lock-v1.md`](stories-viewer-ig-parity-lock-v1.md) — Viewer behavior on that stage: persistent host, photo 5s, video media-length, white 2px segments, auto-advance, hold, 220ms in-viewer morph. Does not reopen carousel geometry, the home rail, or create-story v1.5.
- [`stories-open-smooth-lock-v1.1.md`](stories-open-smooth-lock-v1.1.md) — Stories open, hop, and leave stay on the picture. Close X is 44×44, glyph 22, first tap to `/social`. Supersedes v1 paint-only open. Poster-hold and Mux-only stay.
- [`stories-viewer-ig-actions-lock-v1.md`](stories-viewer-ig-actions-lock-v1.md) — Viewer bottom actions: reply-to-author, heart like, send this story item via DM. Supersedes thumbs up/down. Not #664.
- [`stories-send-dm-craft-lock-v1.md`](stories-send-dm-craft-lock-v1.md) — Send-story DM craft v1.5: IG-dark share drawer, pause behind the sheet, centered Sent toast, live story card. Not #664. Heart stays on the actions lock.
- [`dm-thread-message-format-lock-v1.md`](dm-thread-message-format-lock-v1.md) — DM thread is a chat: day and time cluster headers, mine right / theirs left, story-share groups side-aligned. Card geometry and share copy stay Send craft v1.5. Center activity log is out.
- [`dm-thread-header-density-lock-v1.md`](dm-thread-header-density-lock-v1.md) — DM thread peer chrome is one sticky row: back, avatar 32, display name only. Handle and the stacked name+handle hero are out. Companion to the message-format lock; does not reopen body or composer.
- [`dm-vs-group-membership-lock-v1.md`](dm-vs-group-membership-lock-v1.md) — v1.1. 1:1 stays two people. A multi-party DM starts only from a fresh Messages compose. Cap 16, shown as N/16. The action is Chat. Does not reopen header density or the composer.
- [`dm-thread-immersive-real-estate-lock-v1.md`](dm-thread-immersive-real-estate-lock-v1.md) — On a DM thread, hide the Social shell header and the phone tab dock. Peer row, message rhythm, and composer stay. Inbox and New message keep chrome. Supersedes the density lock’s host only.
- [`stories-home-rail-fb-card-lock-v1.md`](stories-home-rail-fb-card-lock-v1.md) — Social Home tall story cards: story-media cover, top-left avatar ring, bottom name gradient, Create story split plate.
- [`24frame-visual-register-rich-calm-lock-v1.md`](24frame-visual-register-rich-calm-lock-v1.md) — Rich calm v1.4 only. Supersedes v1.3. Video and photo are peer-grade, full-bleed media. Paint on the viewer and home rail. Geometry closed. Create-story shutter stays v1.5.
- [`create-story-photo-video-fb-layout-lock-v1.4.md`](create-story-photo-video-fb-layout-lock-v1.4.md) — superseded by v1.5 for camera-face chrome. Rectangular full-bleed viewfinder retained.
- [`create-story-photo-video-fb-layout-lock-v1.3.md`](create-story-photo-video-fb-layout-lock-v1.3.md) — media-path grammar retained. Superseded by v1.4 for the live viewfinder.
- [`shell-desktop-horizontal-gutter-lock-v2.md`](shell-desktop-horizontal-gutter-lock-v2.md) — desktop shell L = R = 32. Supersedes v1.
- [`shell-desktop-horizontal-gutter-lock-v1.md`](shell-desktop-horizontal-gutter-lock-v1.md) — superseded by v2. #661 shipped 32 / 44.
