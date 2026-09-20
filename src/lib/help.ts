// Get Help stack. Avatar-menu door + /help index. Copy lives here,
// not in JSX.
// Adam 2026-09-19: Get Help is chrome-level account surface — same
// family as /activity and Settings. Route stays /help. Never nest
// under /education/help. Account chrome: no workspace thumb, no
// Education pill, no product rail (Education / TEAM / Manage
// courses stay off). Get Help / Give feedback stay off Settings
// hub chrome. Rows reuse the house Settings inset-group SoT
// (SettingsGroupList + SettingsDrillRow) — not a second Settings
// hub and not bare text on the canvas. Give feedback is
// /help/feedback — blank now, form later on this same route. No
// help-center URL SoT and no support mailto SoT — stub panes, not
// a support product. Do not invent articles, a help desk, or
// /account/feedback.
// Index Back consumes SettingsHubBackLink — history when the
// referrer is in-app; Home /home only as cold-open fallback.
// Never hard-link Aggregation.

import { HOME_ROOT } from "@/lib/workspace";
import {
  SETTINGS_DRILL_ROW_CLASS,
  SETTINGS_EDIT_HELPER_CLASS,
  SETTINGS_GROUP_CLASS,
  SETTINGS_PANE_CLASS,
  SETTINGS_PANE_TITLE_CLASS,
  SETTINGS_SECTION_CLASS,
} from "@/lib/settings";
import { USER_MENU } from "@/lib/user-menu";

export const HELP = {
  title: USER_MENU.help,
  href: USER_MENU.helpHref,
  back: "Back",
  homeHref: HOME_ROOT,
  helper: "Help center, support, and feedback.",
  center: "Help center",
  centerHref: "/help/center",
  centerEmpty: "Help center is empty.",
  support: "Contact support",
  supportHref: "/help/support",
  supportEmpty: "Contact support is empty.",
  feedback: "Give feedback",
  feedbackHref: "/help/feedback",
  feedbackHelper: "The form is coming.",
  feedbackEmpty: "Feedback is empty.",
} as const;

export const HELP_ABSENT = [
  "FAQ",
  "support@",
  "Phone",
  "Job",
  "articles",
  "Help desk",
] as const;

export type HelpStackKind = "center" | "support" | "feedback";

export type HelpStackItem = {
  kind: HelpStackKind;
  label: (typeof HELP)["center"] | (typeof HELP)["support"] | (typeof HELP)["feedback"];
  href: (typeof HELP)["centerHref"] | (typeof HELP)["supportHref"] | (typeof HELP)["feedbackHref"];
};

export const HELP_STACK: readonly HelpStackItem[] = [
  { kind: "center", label: HELP.center, href: HELP.centerHref },
  { kind: "support", label: HELP.support, href: HELP.supportHref },
  { kind: "feedback", label: HELP.feedback, href: HELP.feedbackHref },
];

export const HELP_PAGE_CLASS = SETTINGS_PANE_CLASS;
export const HELP_SECTION_CLASS = SETTINGS_SECTION_CLASS;
export const HELP_STACK_CLASS = SETTINGS_GROUP_CLASS;
export const HELP_ROW_CLASS = SETTINGS_DRILL_ROW_CLASS;
export const HELP_TITLE_CLASS = SETTINGS_PANE_TITLE_CLASS;
export const HELP_HELPER_CLASS = SETTINGS_EDIT_HELPER_CLASS;

export function isHelpPath(pathname: string): boolean {
  return pathname === HELP.href || pathname.startsWith(`${HELP.href}/`);
}

export function helpHeaderBack(pathname: string | null | undefined): {
  href: string;
  label: string;
} {
  if (!pathname || pathname === HELP.href) {
    return { href: HELP.homeHref, label: HELP.back };
  }
  return { href: HELP.href, label: HELP.title };
}
