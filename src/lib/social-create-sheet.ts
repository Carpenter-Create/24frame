import {
  APP_SHEET_HEAD_CLASS,
  APP_SHEET_SURFACE_CLASS,
} from "@/lib/house-sheet";
import {
  SOCIAL,
  SOCIAL_ROUTES,
  socialCreateHref,
} from "@/lib/social";
import type { SocialPhosphorIconName } from "@/lib/social-icons";

// Social Create chooser. Adam lock 2026-09-20; presentation + craft
// refine same day.
// Presentation: iMessage New Message — sheet rises over the dimmed
// Social feed. Title Create. X dismiss. Scrim dismiss. House rise
// (calm precision, no bounce).
// Register: Coinbase institutional — modern trust, calm precision,
// one Sporty Blue primary, sharp selected states, quiet helpers —
// still social/creator/fun enough for Photo · Video · Write · Go live.
// Light 24Frame + Social media spine. Not traditional institutional
// (no bank / enterprise / gov chrome, no stiff corporate density).
// Not Mercury-stiff. Not LinkedIn-grey. Not a cold fintech vault.
// Not loud IG/FB. Not a Pinterest skin. Not an X FAB flyout.
// Not iMessage frost. Not iMessage’s vertical + attachment list.
// One SoT for the sheet + tile primitive. Social-only door
// (dock dest · composer plus). Never in the house header.

export const SOCIAL_CREATE_TILES = [
  {
    id: "photo",
    label: SOCIAL.create.photo,
    href: socialCreateHref("photo"),
    icon: "image",
  },
  {
    id: "video",
    label: SOCIAL.create.video,
    href: socialCreateHref("video"),
    icon: "film-strip",
  },
  {
    id: "write",
    label: SOCIAL.create.write,
    href: socialCreateHref("text"),
    icon: "text-t",
  },
  {
    id: "live",
    label: SOCIAL.create.goLive,
    href: SOCIAL_ROUTES.createLive,
    icon: "camera",
  },
] as const satisfies readonly {
  id: string;
  label: string;
  href: string;
  icon: SocialPhosphorIconName;
}[];

export type SocialCreateTileId = (typeof SOCIAL_CREATE_TILES)[number]["id"];

export function socialCreateTile(
  id: string,
): (typeof SOCIAL_CREATE_TILES)[number] | null {
  return SOCIAL_CREATE_TILES.find((tile) => tile.id === id) ?? null;
}

export const SOCIAL_CREATE_SHEET_PRESENTATION = "imessage-new-message";

export const SOCIAL_CREATE_SHEET_HOST_CLASS =
  "fixed inset-0 z-50 flex h-dvh w-full flex-col justify-end";

export const SOCIAL_CREATE_SHEET_SURFACE_CLASS =
  `${APP_SHEET_SURFACE_CLASS} relative z-10 w-full shadow-none`;

export const SOCIAL_CREATE_SHEET_HEAD_CLASS =
  `${APP_SHEET_HEAD_CLASS} relative justify-between`;

export const SOCIAL_CREATE_SHEET_TITLE_CLASS =
  "pointer-events-none absolute inset-0 flex items-center justify-center t-body font-medium text-ink";

// Dim the feed behind. Opaque wash — not frost, not backdrop-blur.
export const SOCIAL_CREATE_SHEET_SCRIM_CLASS =
  "absolute inset-0 bg-ink/40 app-sheet-scrim-fade";

// Phone: 2×2. Wider: one equal row. Never truncate — labels wrap/stack.
export const SOCIAL_CREATE_TILES_CLASS =
  "grid w-full grid-cols-2 gap-[var(--space-4)] min-[480px]:grid-cols-4";

// Tile chrome stays quiet. Selected lives on the well — not a
// full-tile enterprise hover card, not a Mercury dest chip.
export const SOCIAL_CREATE_TILE_CLASS =
  "group flex min-w-0 flex-col items-center justify-center gap-[var(--space-3)] rounded-[var(--radius-lg)] px-[var(--space-2)] py-[var(--space-5)] text-ink";

// Muted house-radius well at rest. Hover/active: Sporty Blue wash +
// accent icon. One primary, sharp. Not a colored orb.
export const SOCIAL_CREATE_TILE_WELL_CLASS =
  "flex size-14 items-center justify-center rounded-[var(--radius-lg)] bg-surface-muted transition-colors group-hover:bg-accent-wash group-active:bg-accent-wash";

export const SOCIAL_CREATE_TILE_ICON_CLASS =
  "text-ink transition-colors group-hover:text-accent group-active:text-accent";

export const SOCIAL_CREATE_TILE_LABEL_CLASS =
  "whitespace-normal text-center t-body-sm font-medium text-ink";
