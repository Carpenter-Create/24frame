import Link from "next/link";

import { BrandEmblem } from "./brand-emblem";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { cn } from "@/lib/cn";
import {
  HOUSE_LEAD_CHROME_CLASS,
  HOUSE_LEAD_LOGO_CLASS,
  HOUSE_LEAD_SEARCH_DESKTOP_CLASS,
  HOUSE_LEAD_SEARCH_PHONE_CLASS,
  HOUSE_LEAD_SLOT_CLASS,
} from "@/lib/house-lead-chrome";
import { PRODUCT_NAME } from "@/lib/product";
import { workspaceHome, type WorkspaceMode } from "@/lib/workspace";
import {
  APP_HEADER_LEADING_CLASS,
  APP_HEADER_TRAILING_CLUSTER_CLASS,
  APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS,
  APP_HEADER_WORKSPACE_PILL_HOST_CLASS,
} from "@/lib/workspace-switcher";

export function HouseLeadChrome({
  workspace,
  settingsPage = false,
  logoVisible = "desktop",
  leadingNav,
  search,
  phoneSearch,
  afterLead,
  accountMenu,
}: {
  workspace: WorkspaceMode;
  settingsPage?: boolean;
  logoVisible?: "always" | "desktop";
  leadingNav?: React.ReactNode;
  search?: React.ReactNode;
  phoneSearch?: React.ReactNode;
  afterLead?: React.ReactNode;
  accountMenu: React.ReactNode;
}) {
  const social = workspace === "social";
  const education = workspace === "education" && !settingsPage;

  return (
    <header
      data-app-header=""
      data-house-lead-chrome=""
      data-house-full-width-top=""
      data-social-top-bar={social ? "" : undefined}
      className={HOUSE_LEAD_CHROME_CLASS}
      style={{ height: "var(--header-height)" }}
    >
      <div data-app-header-leading="" className={APP_HEADER_LEADING_CLASS}>
        {leadingNav}
        <div
          data-house-lead=""
          data-app-header-brand-search=""
          data-social-header-lead={social ? "" : undefined}
          className={cn(
            logoVisible === "always" ? "flex" : "hidden md:flex",
            HOUSE_LEAD_SLOT_CLASS,
          )}
        >
          <Link
            href={workspaceHome(workspace)}
            prefetch={social ? true : undefined}
            aria-label={PRODUCT_NAME}
            data-brand-emblem=""
            className={HOUSE_LEAD_LOGO_CLASS}
          >
            <BrandEmblem />
          </Link>
          {search ? (
            <div
              data-house-lead-search=""
              data-education-header-search-host={education ? "desktop" : undefined}
              className={HOUSE_LEAD_SEARCH_DESKTOP_CLASS}
            >
              {search}
            </div>
          ) : null}
        </div>
        <div
          data-app-header-workspace-pill=""
          className={APP_HEADER_WORKSPACE_PILL_HOST_CLASS}
        >
          <WorkspaceSwitcher current={workspace} tone="pill" />
        </div>
        {phoneSearch ? (
          <div
            data-social-header-actions={social ? "" : undefined}
            data-education-header-search-host={education ? "phone" : undefined}
            className={education ? HOUSE_LEAD_SEARCH_PHONE_CLASS : undefined}
          >
            {phoneSearch}
          </div>
        ) : null}
        {afterLead}
      </div>
      <div data-app-header-trailing="" className={APP_HEADER_TRAILING_CLUSTER_CLASS}>
        <div
          data-app-header-workspace-desktop=""
          className={APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS}
        >
          <WorkspaceSwitcher current={workspace} presentation="pills" />
        </div>
        {accountMenu}
      </div>
    </header>
  );
}
