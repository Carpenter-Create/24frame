"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, use, useRef } from "react";
import { railDestinations, STAFF_RAIL_EYEBROW, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/cn";
import type { WorkspaceMode } from "@/lib/workspace";
import { SocialIcon } from "@/components/social/social-icon";
import {
  SocialNavPendingProbe,
  useSocialNavPending,
} from "@/components/social/use-social-nav-pending";
import { SOCIAL_ICON_SIZE_NAV, socialNavIconName } from "@/lib/social-icons";
import { NavGlyph } from "./nav-glyph";

// Access rail: 12px labels (--text-sm / t-body-sm), 16px Phosphor Bold idle /
// Fill active (75:5 / 61:2). Active = Sporty Blue icon+text + quiet wash.
// Social destinations use Social Figma V1 Phosphor via SocialIcon.
// Collapsed mode is icon-only (labels/badges hidden; title tooltips; unread → accent dot).
export function SideNav({
  messagesUnread,
  isGcStaff = false,
  collapsed = false,
  workspace = "aggregation",
}: {
  messagesUnread: Promise<number>;
  isGcStaff?: boolean;
  collapsed?: boolean;
  workspace?: WorkspaceMode;
}) {
  const pathname = usePathname();
  const social = workspace === "social";
  const { activePath, markPending, pendingHref } = useSocialNavPending();
  const pathForActive = social ? activePath : pathname;

  const router = useRouter();
  const warmed = useRef<Set<string>>(new Set());
  const warm = (href: string) => {
    if (social || warmed.current.has(href)) return;
    warmed.current.add(href);
    router.prefetch(href);
  };

  const row = (
    item: NavItem,
    badge: React.ReactNode = null,
  ) => {
    const active = item.exact ? pathForActive === item.href : pathForActive.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        // Aggregation: VIEWPORT prefetch off, HOVER prefetch on. The sidebar
        // renders on every page, so viewport prefetch fired a full uncached
        // render of EVERY destination on EVERY navigation — ~400 invocations
        // in one short session. Hovering warms the one destination you are
        // about to click. Deduped per href so re-hovering does not re-fire.
        // Social: VIEWPORT prefetch on. Desktop rail is four destinations
        // plus local loading.tsx — not the Aggregation dashboard skeleton.
        prefetch={social}
        onMouseEnter={social ? undefined : () => warm(item.href)}
        onFocus={social ? undefined : () => warm(item.href)}
        onClick={social ? (event) => markPending(item.href, event) : undefined}
        title={collapsed ? item.label : undefined}
        aria-label={item.ariaLabel ?? (collapsed ? item.label : undefined)}
        data-social-rail-pending={social && pendingHref === item.href ? "" : undefined}
        className={cn(
          "relative flex items-center rounded-[var(--radius)] t-body-sm leading-4 transition-colors",
          collapsed ? "justify-center px-0 py-2" : "gap-2 px-2 py-2",
          active
            ? "bg-accent-wash font-medium text-accent"
            : "font-normal text-ink-2 hover:bg-surface-muted hover:text-ink",
        )}
      >
        {social ? <SocialNavPendingProbe href={item.href} onPending={markPending} /> : null}
        {social ? (
          <SocialIcon
            name={socialNavIconName(item.href)}
            active={active}
            size={SOCIAL_ICON_SIZE_NAV}
            className="shrink-0"
          />
        ) : (
          <NavGlyph item={item} active={active} />
        )}
        {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
        {badge}
      </Link>
    );
  };

  const { items, staffItems } = railDestinations(isGcStaff, workspace);

  return (
    <nav className="flex flex-col gap-2 px-2" data-side-nav="">
      {items.map((item) =>
        row(
          item,
          item.href === "/messages" ? (
            // Suspense so an unresolved badge never holds up the nav. Fallback is nothing
            // — an empty slot that fills in, rather than a spinner that draws the eye to a
            // decoration.
            <Suspense fallback={null}>
              <UnreadBadge count={messagesUnread} collapsed={collapsed} />
            </Suspense>
          ) : null,
        ),
      )}
      {staffItems.length > 0 ? (
        <>
          <div className="mx-1 my-2 border-t border-hairline" />
          {!collapsed ? (
            <span className="px-2 pb-1 t-label text-ink-3">{STAFF_RAIL_EYEBROW}</span>
          ) : null}
          {staffItems.map((item) => row(item))}
        </>
      ) : null}
    </nav>
  );
}

// Unwraps the unread promise. Kept out of the critical render path because
// my_unread_count calls member_can() per notification row; a badge should not be able to
// delay the page it decorates.
function UnreadBadge({ count, collapsed }: { count: Promise<number>; collapsed: boolean }) {
  const unread = use(count);
  if (unread <= 0) return null;
  return collapsed ? (
    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
  ) : (
    <span className="min-w-4 rounded-full bg-accent px-1.5 text-center t-label text-[var(--accent-contrast)]">
      {unread > 9 ? "9+" : unread}
    </span>
  );
}
