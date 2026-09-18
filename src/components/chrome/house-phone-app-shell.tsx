import { cn } from "@/lib/cn";
import { HOUSE_LEAD_SHELL_CLASS } from "@/lib/house-lead-chrome";
import { HOUSE_PAGE_CANVAS_CLASS } from "@/lib/house-shell";
import type { WorkspaceMode } from "@/lib/workspace";
import { HousePhoneBottomNav } from "./house-phone-bottom-nav";

// One phone shell primitive. Both Social and Access trees mount this
// so workspace tabs cannot fork. Desktop is unchanged — the bottom
// nav is md:hidden.

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
      {children}
      <HousePhoneBottomNav workspace={workspace} />
    </div>
  );
}
