import { UNPAGINATED_MAX } from "@/lib/list-bounds";
import { PRODUCT_NAME } from "@/lib/product";
import { normalizeHandle, socialProfileHref } from "@/lib/social";
import { TITLES_HREF } from "@/lib/title-public-id";

// Must stay equal to ACTIVITY_HREF. activity.ts imports this module,
// so this file cannot import that SoT. notifications.test locks them.
const ACTIVITY_PATH = "/activity";

// Notification copy + labels (§20 GC-Support in-app push). Copy in lib/, not JSX.

export const NOTIFICATION_KIND_LABEL: Record<
  "title_rejected" | "delivery_update" | "new_follower",
  string
> = {
  title_rejected: "Title returned",
  delivery_update: "Delivery update",
  new_follower: "New follower",
};

export type NotificationLinkCtx = { titleId?: string; handle?: string };

export type NotificationKind = "title_rejected" | "delivery_update" | "new_follower";

export type NotificationLink = { cta: string; path: string };

export type NotificationEmailCopy = {
  subject: (ctx: { title: string }) => string;
  /** Paired CTA + path for the supplied context — the sender-facing deep-link API. */
  link: (ctx?: NotificationLinkCtx) => NotificationLink;
  /** Path-only convenience for the Activity inbox; always delegates to `link`. */
  path: (ctx?: NotificationLinkCtx) => string;
};

// titleId for delivery_update may arrive from untrusted source_refs — only a canonical
// UUID may be interpolated into a title path. title_rejected keeps the pre-existing
// truthy-titleId contract (no UUID hardening).
const TITLE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isSafeTitleId(titleId: string | undefined): titleId is string {
  return typeof titleId === "string" && TITLE_ID_RE.test(titleId);
}

function deliveryUpdateLink(ctx: NotificationLinkCtx = {}): NotificationLink {
  if (isSafeTitleId(ctx.titleId)) {
    return { cta: "View title", path: `${TITLES_HREF}/${ctx.titleId}` };
  }
  return { cta: "View your titles", path: TITLES_HREF };
}

function titleRejectedLink(ctx: NotificationLinkCtx = {}): NotificationLink {
  return {
    cta: "Review and resubmit",
    // Pre-existing contract: any truthy titleId deep-links; otherwise Activity.
    path: ctx.titleId ? `${TITLES_HREF}/${ctx.titleId}` : ACTIVITY_PATH,
  };
}

function newFollowerLink(ctx: NotificationLinkCtx = {}): NotificationLink {
  const handle = ctx.handle ? normalizeHandle(ctx.handle) : null;
  return {
    cta: "View profile",
    path: handle ? socialProfileHref(handle) : ACTIVITY_PATH,
  };
}

// Email copy for the GC-Support channel (draft — revise here). The email body reuses the
// in-app notification body; `link` defines the per-kind CTA label and dashboard deep-link
// as one paired result. Messages inbox uses `path` (delegates to `link`). There is no
// independent static CTA that can drift from the destination.
export const NOTIFICATION_EMAIL: Record<NotificationKind, NotificationEmailCopy> = {
  title_rejected: {
    subject: ({ title }) => `"${title}" was returned for revision`,
    link: titleRejectedLink,
    path: (ctx = {}) => titleRejectedLink(ctx).path,
  },
  delivery_update: {
    subject: ({ title }) => `"${title}" — delivery update`,
    link: deliveryUpdateLink,
    path: (ctx = {}) => deliveryUpdateLink(ctx).path,
  },
  new_follower: {
    subject: () => "New follower",
    link: newFollowerLink,
    path: (ctx = {}) => newFollowerLink(ctx).path,
  },
};

// Client-facing labels for delivery statuses — never surface the raw snake_case enum
// in a notice (voice governs UI copy).
export const DELIVERY_STATUS_LABELS: Record<
  "pending" | "delivered" | "live" | "rejected" | "taken_down",
  string
> = {
  pending: "pending",
  delivered: "delivered",
  live: "live",
  rejected: "rejected",
  taken_down: "taken down",
};

export const MESSAGES_EMPTY = "No messages yet.";
export const MESSAGES_SUBTITLE = `Updates from ${PRODUCT_NAME}.`;
export const MESSAGES_TRUNCATED = `Showing the first ${UNPAGINATED_MAX} messages. More exist — this list is not complete.`;
