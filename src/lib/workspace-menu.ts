// Account-menu Workspace. Lives in lib/, not JSX.
// Desktop: second 264 surface, gap 8 left of the parent — same
// geometry as Appearance 613:888. Mobile is a same-sheet drill-in.
// Open Workspace replaces the list face; house 16 tertiary Back
// returns to main. Desktop flyout has no Back. Not a page. Not a
// route. Not a header chip.
// Miss-list is Aggregation | Social | Education. Education product
// is HOLD — list it only when an Education destination already
// exists. Do not invent /education, /account/workspace, or
// /settings/workspace.

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

export const WORKSPACE_EDUCATION_LABEL = "Education";

/** Existing Education destination only. Null while the product is HOLD. */
export const WORKSPACE_EDUCATION_HREF: string | null = null;

export type WorkspaceMenuCandidateId = "aggregation" | "social" | "education";

export const WORKSPACE_MENU_CANDIDATES = [
  { id: "aggregation" as const, label: WORKSPACE_AGGREGATION_LABEL },
  { id: "social" as const, label: WORKSPACE_SOCIAL_LABEL },
  { id: "education" as const, label: WORKSPACE_EDUCATION_LABEL },
] as const;

export const WORKSPACE_FLYOUT_OPTIONS = [
  { mode: "aggregation" as const, label: WORKSPACE_AGGREGATION_LABEL },
  { mode: "social" as const, label: WORKSPACE_SOCIAL_LABEL },
] as const;

export type WorkspaceMenuOption = {
  mode: WorkspaceMode;
  label: string;
  href: string;
};

export function workspaceCandidateAccessible(id: WorkspaceMenuCandidateId): boolean {
  if (id === "education") return WORKSPACE_EDUCATION_HREF !== null;
  return true;
}

export function availableWorkspaceOptions(): readonly WorkspaceMenuOption[] {
  return WORKSPACE_MENU_CANDIDATES.flatMap((candidate) => {
    if (!workspaceCandidateAccessible(candidate.id) || candidate.id === "education") {
      return [];
    }
    return [
      {
        mode: candidate.id,
        label: candidate.label,
        href: workspaceHome(candidate.id),
      },
    ];
  });
}

export function workspaceModeLabel(mode: WorkspaceMode): string {
  return mode === "social" ? WORKSPACE_SOCIAL_LABEL : WORKSPACE_AGGREGATION_LABEL;
}
