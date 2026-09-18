// Header workspace lanes. Lives in lib/, not JSX.
// Mercury trigger sits in the shared header-right cluster,
// left of the avatar — not the rail. Trailing cluster is
// switcher + avatar. One switcher. Popover lists only
// accessible lanes. Pills stay in that live unify-lead
// placement — do not move the cluster upper-left.
// Not a page. Not a route. Not an account-menu row. Miss-list
// is Overview | Aggregation | Social | Education. Member
// Education land is Route A /social/courses. Do not send
// members to /education (staff CMS), /account/workspace, or
// /settings/workspace. Staff Manage courses in Settings is a
// separate /education door — not workspace land.

import { USER_MENU } from "@/lib/user-menu";
import {
  WORKSPACE_AGGREGATION_LABEL,
  WORKSPACE_OVERVIEW_LABEL,
  WORKSPACE_SOCIAL_LABEL,
} from "@/lib/product";
import { type WorkspaceMode, workspaceHome } from "@/lib/workspace";

export const WORKSPACE_MENU = {
  title: USER_MENU.workspace,
} as const;

export const WORKSPACE_EDUCATION_LABEL = "Education";

/** Member Education destination. Route A — never staff CMS /education. */
export const WORKSPACE_EDUCATION_HREF = "/social/courses";

export type WorkspaceMenuCandidateId = "overview" | "aggregation" | "social" | "education";

export const WORKSPACE_MENU_CANDIDATES = [
  { id: "overview" as const, label: WORKSPACE_OVERVIEW_LABEL },
  { id: "aggregation" as const, label: WORKSPACE_AGGREGATION_LABEL },
  { id: "social" as const, label: WORKSPACE_SOCIAL_LABEL },
  { id: "education" as const, label: WORKSPACE_EDUCATION_LABEL },
] as const;

export const WORKSPACE_FLYOUT_OPTIONS = [
  { mode: "overview" as const, label: WORKSPACE_OVERVIEW_LABEL },
  { mode: "aggregation" as const, label: WORKSPACE_AGGREGATION_LABEL },
  { mode: "social" as const, label: WORKSPACE_SOCIAL_LABEL },
  { mode: "education" as const, label: WORKSPACE_EDUCATION_LABEL },
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
  const options: WorkspaceMenuOption[] = [];
  for (const candidate of WORKSPACE_MENU_CANDIDATES) {
    if (!workspaceCandidateAccessible(candidate.id)) continue;
    if (candidate.id === "education") {
      options.push({
        mode: "education",
        label: candidate.label,
        href: WORKSPACE_EDUCATION_HREF,
      });
      continue;
    }
    options.push({
      mode: candidate.id,
      label: candidate.label,
      href: workspaceHome(candidate.id),
    });
  }
  return options;
}

export function workspaceModeLabel(mode: WorkspaceMode): string {
  if (mode === "overview") return WORKSPACE_OVERVIEW_LABEL;
  if (mode === "social") return WORKSPACE_SOCIAL_LABEL;
  if (mode === "education") return WORKSPACE_EDUCATION_LABEL;
  return WORKSPACE_AGGREGATION_LABEL;
}
