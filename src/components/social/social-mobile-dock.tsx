"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { isClientNavActive, SOCIAL_MOBILE_PILL } from "@/lib/nav";
import { cn } from "@/lib/cn";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";

// Phone Social jobs. Pill is Home / Explore / Messages / Profile.
// Create is a separate FAB. Desktop keeps the five-job left rail.

export function SocialMobileDock() {
  const pathname = usePathname();

  return (
    <div data-social-mobile-dock="" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="pointer-events-auto flex items-end justify-center px-[var(--space-4)] pb-[var(--space-4)]">
        <nav
          data-social-mobile-pill=""
          className="flex items-center gap-[var(--space-2)] rounded-full border border-hairline bg-surface/95 px-[var(--space-3)] py-[var(--space-2)] backdrop-blur"
        >
          {SOCIAL_MOBILE_PILL.map((item) => {
            const active = isClientNavActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                data-social-mobile-pill-item={item.label}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full",
                  active ? "bg-surface-muted text-ink" : "text-ink-2",
                )}
              >
                <Icon className="size-4" strokeWidth={1.33} />
              </Link>
            );
          })}
        </nav>
        <Link
          href={SOCIAL_ROUTES.create}
          data-social-create-fab=""
          aria-label={SOCIAL.create.title}
          className="ml-[var(--space-3)] flex size-12 items-center justify-center rounded-full bg-accent text-accent-contrast"
        >
          <Plus className="size-5" strokeWidth={1.33} />
        </Link>
      </div>
    </div>
  );
}
