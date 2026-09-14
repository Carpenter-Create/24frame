"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { MOBILE_NAV, isClientNavActive, railDestinations, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/cn";
import type { WorkspaceMode } from "@/lib/workspace";
import { SocialIcon } from "@/components/social/social-icon";
import { SOCIAL_ICON_SIZE_NAV, socialNavIconName } from "@/lib/social-icons";
import {
  MOBILE_CHROME_HAMBURGER_BUTTON_CLASS,
  MOBILE_CHROME_ICON_CLASS,
  MOBILE_CHROME_ICON_STROKE,
} from "@/lib/mobile-chrome";
import { AppSheetHead, AppSheetSurface, Close44 } from "./house";

// Phone menu: lucide Menu 16 / 1.33 / tertiary in the shared 44 hit
// (same object as the Ask Globee clock). Opens an opaque full-bleed
// portal. The sheet surface is 543:576 app-sheet chrome — same object as
// the account sheet, different body. Header is one row: large "Menu" on the
// list edge, Close/44 at top-right. Rows use the same Lucide
// marks as the rail (item.icon, 16 / 1.33, stroke only). Client destinations
// only unless isGcStaff — staff get NAV, then a hairline + 24 gap, then
// GC_NAV. Hidden at md, where the desktop rail stays.
// Destination clicks keep the opaque portal mounted until the next route
// commits. Closing on click unmounted the overlay and the next segment painted
// a blank canvas. Same-href clicks still dismiss immediately. Portal to
// document.body so the header's backdrop-blur does not become the fixed
// containing block (that left the page showing through).
export function MobileNav({
  isGcStaff = false,
  workspace = "aggregation",
}: {
  isGcStaff?: boolean;
  workspace?: WorkspaceMode;
}) {
  const pathname = usePathname();
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  // Open only while we are still on the path the sheet was opened from.
  // A destination commit changes pathname and dismisses the overlay without
  // unmounting chrome or calling setState in an effect.
  const open = openedOn !== null && openedOn === pathname;

  const sheet = open ? (
    <MobileNavSheet
      pathname={pathname}
      onClose={() => setOpenedOn(null)}
      isGcStaff={isGcStaff}
      workspace={workspace}
    />
  ) : null;

  return (
    <>
      <button
        type="button"
        data-mobile-nav-trigger=""
        aria-label={MOBILE_NAV.open}
        aria-expanded={open}
        aria-controls="mobile-nav-sheet"
        onClick={() => setOpenedOn(pathname)}
        className={MOBILE_CHROME_HAMBURGER_BUTTON_CLASS}
      >
        <Menu className={MOBILE_CHROME_ICON_CLASS} strokeWidth={MOBILE_CHROME_ICON_STROKE} />
      </button>
      {sheet && typeof document !== "undefined" ? createPortal(sheet, document.body) : sheet}
    </>
  );
}

// Same-href taps never commit a new route, so the pathname effect will not run.
export function destinationClickClosesSheet(pathname: string, href: string): boolean {
  return pathname === href;
}

export function MobileNavSheet({
  pathname,
  onClose,
  isGcStaff = false,
  workspace = "aggregation",
}: {
  pathname: string;
  onClose: () => void;
  isGcStaff?: boolean;
  workspace?: WorkspaceMode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const { items, staffItems } = railDestinations(isGcStaff, workspace);

  const link = (item: NavItem) => {
    const active = isClientNavActive(pathname, item);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={destinationClickClosesSheet(pathname, item.href) ? onClose : undefined}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-[var(--radius-lg)] p-[var(--space-4)] t-body text-ink",
          active ? "bg-surface-muted" : "hover:bg-surface-muted",
        )}
      >
        {workspace === "social" ? (
          <SocialIcon
            name={socialNavIconName(item.href)}
            active={active}
            size={SOCIAL_ICON_SIZE_NAV}
            className="shrink-0"
          />
        ) : (
          <Icon className="size-4 shrink-0" strokeWidth={1.33} />
        )}
        {item.label}
      </Link>
    );
  };

  return (
    <div
      id="mobile-nav-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={MOBILE_NAV.sheet}
      data-mobile-nav-sheet=""
      className="fixed inset-0 z-50 flex h-dvh w-full flex-col justify-end overflow-hidden touch-none bg-canvas md:hidden"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <AppSheetSurface
        data-mobile-nav-surface=""
        className="min-h-0 flex-1"
      >
        <AppSheetHead
          data-mobile-nav-header=""
          className="justify-between"
        >
          <p data-mobile-nav-title="" className="t-title text-ink">
            {MOBILE_NAV.sheet}
          </p>
          <Close44
            label={MOBILE_NAV.close}
            data-mobile-nav-close=""
            onClick={onClose}
          />
        </AppSheetHead>
        <nav
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain touch-pan-y"
          data-mobile-nav-destinations=""
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex flex-col gap-[var(--space-2)]">{items.map(link)}</div>
          {staffItems.length > 0 ? (
            <>
              <div
                data-mobile-nav-group-rule=""
                className="my-[var(--space-6)] border-t border-hairline"
              />
              <div className="flex flex-col gap-[var(--space-2)]">{staffItems.map(link)}</div>
            </>
          ) : null}
        </nav>
      </AppSheetSurface>
    </div>
  );
}
