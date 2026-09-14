// Account-menu Workspace. Lives in lib/, not JSX.
// Desktop: second 264 surface, gap 8 left of the parent — same
// geometry as Appearance 613:888. Mobile is a same-sheet drill-in.
// Open Workspace replaces the list face; house 16 tertiary Back
// returns to main. Not a page. Not a route. Not a header chip.
// Education product is HOLD — list it only when an Education
// destination already exists. Do not invent /education,
// /account/workspace, or /settings/workspace.

import { USER_MENU } from "@/lib/user-menu";
import {
  WORKSPACE_AGGREGATION_LABEL,
  WORKSPACE_SOCIAL_LABEL,
} from "@/lib/product";
import { type WorkspaceMode, workspaceHome } from "@/lib/workspace";

export const WORKSPACE_MENU = {
  title: USER_MENU.workspace,
  back: "Back",
} as const;

export const WORKSPACE_FLYOUT_OPTIONS = [
  { mode: "aggregation" as const, label: WORKSPACE_AGGREGATION_LABEL },
  { mode: "social" as const, label: WORKSPACE_SOCIAL_LABEL },
] as const;

export const WORKSPACE_EDUCATION_LABEL = "Education";

/** Existing Education destination only. Null while the product is HOLD. */
export const WORKSPACE_EDUCATION_HREF: string | null = null;

export type WorkspaceMenuOption = {
  mode: WorkspaceMode;
  label: string;
  href: string;
};

export function availableWorkspaceOptions(): readonly WorkspaceMenuOption[] {
  // Education stays off until WORKSPACE_EDUCATION_HREF points at a
  // real existing route. Do not invent a third workspace product.
  return WORKSPACE_FLYOUT_OPTIONS.map((option) => ({
    mode: option.mode,
    label: option.label,
    href: workspaceHome(option.mode),
  }));
}

export function workspaceModeLabel(mode: WorkspaceMode): string {
  return mode === "social" ? WORKSPACE_SOCIAL_LABEL : WORKSPACE_AGGREGATION_LABEL;
}
