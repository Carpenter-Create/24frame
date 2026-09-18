"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import {
  HOUSE_PHONE_BOTTOM_NAV,
  HOUSE_PHONE_BOTTOM_NAV_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_ICON_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_ITEM_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_ROW_CLASS,
  HOUSE_PHONE_WORKSPACE_TABS,
  housePhoneWorkspaceSelected,
  persistHousePhoneWorkspace,
} from "@/lib/house-phone-shell";
import { PhosphorChromeIcon } from "@/lib/phosphor-icon";
import { resolveWorkspaceMode } from "@/lib/workspace";

export function HousePhoneBottomNav({
  workspace,
}: {
  workspace: ReturnType<typeof resolveWorkspaceMode>;
}) {
  const pathname = usePathname();

  return (
    <nav
      data-house-phone-bottom-nav=""
      aria-label={HOUSE_PHONE_BOTTOM_NAV.label}
      className={HOUSE_PHONE_BOTTOM_NAV_CLASS}
    >
      <div data-house-phone-bottom-nav-pill="" className={HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS}>
        <div className={HOUSE_PHONE_BOTTOM_NAV_ROW_CLASS}>
          {HOUSE_PHONE_WORKSPACE_TABS.map((tab) => {
            const active = housePhoneWorkspaceSelected(tab.id, pathname, workspace);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                prefetch
                aria-current={active ? "page" : undefined}
                data-house-phone-bottom-nav-item={tab.id}
                onClick={() => persistHousePhoneWorkspace(tab.id)}
                className={cn(
                  HOUSE_PHONE_BOTTOM_NAV_ITEM_CLASS,
                  active ? "font-medium text-accent" : "font-normal text-ink-2",
                )}
              >
                <PhosphorChromeIcon
                  icon={tab.icon}
                  active={active}
                  className={HOUSE_PHONE_BOTTOM_NAV_ICON_CLASS}
                />
                <span className="max-w-full truncate">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
