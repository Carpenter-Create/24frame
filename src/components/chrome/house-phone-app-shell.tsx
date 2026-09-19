import { cn } from "@/lib/cn";
import { HOUSE_LEAD_SHELL_CLASS } from "@/lib/house-lead-chrome";
import { HOUSE_PAGE_CANVAS_CLASS } from "@/lib/house-shell";
import type { WorkspaceMode } from "@/lib/workspace";
import { HouseLeadScrollToTop } from "./house-lead-scroll-to-top";
import { HousePhoneBottomNav } from "./house-phone-bottom-nav";

// One phone shell primitive. Both Social and Access trees mount this
// so workspace tabs cannot fork. Desktop is unchanged — the bottom
// nav is md:hidden. Hide-on-scroll lives on HousePhoneBottomNav
// (social-tab-bar-scroll) for every workspace that uses this shell.
// HouseLeadScrollToTop bridges the iOS status-bar tap to the nested
// `[data-house-lead-scroll]` scroller so every workspace answers a
// tap the same way (Adam 2026-09-19). Coarse-pointer devices only.

export function HousePhoneAppShell({
  workspace,
  className,
  style,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  workspace: WorkspaceMode;
}) {
  return (
    <div
      data-house-phone-app-shell=""
      className={cn(HOUSE_LEAD_SHELL_CLASS, HOUSE_PAGE_CANVAS_CLASS, className)}
      style={style}
      {...rest}
    >
      <HouseLeadScrollToTop />
      {children}
      <HousePhoneBottomNav workspace={workspace} />
    </div>
  );
}
