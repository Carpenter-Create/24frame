"use client";

import Link from "next/link";

import { AskAiOpenButton } from "@/components/chrome/ask-ai-overlay";
import { HouseActionArrow } from "@/components/chrome/house-action-arrow";
import { TextAction } from "@/components/chrome/house";
import {
  DashboardHomeEmpty,
  DashboardHomePanel,
} from "@/components/dashboard/dashboard-home";
import {
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
} from "@/lib/dashboard-craft";
import {
  overviewModuleHeaderAction,
  OVERVIEW_MODULE_ARROW_CLASS,
} from "@/lib/overview";

// Shared Home module shell — Social · Education · Industry news · Needs you · AI.
// Net revenue uses the dashboard panel + house period chips, not this shell.
// Header chrome lives inside the grey panel. Do not float a title on page white.
// Trailing header CTA is a glyph-only HouseActionArrow (Adam
// 2026-09-19). The destination label survives as the arrow's
// aria-label. Ask 24Frame AI stays as an AskAiOpenButton — content
// swaps from the word "Ask …" to the same house arrow.
//
// Industry news is the one Home exception (Adam interrupt 2026-09-19):
// NewsRail passes `trailingText` so the module keeps the "View all"
// words in the trailing slot — text TextAction, not the glyph. Every
// other Home gray module (Net revenue · Social · Education · Ask
// 24Frame AI · Needs you) trails with the arrow. Global TextAction
// and DashboardViewAll are untouched.

export function OverviewModule({
  testId,
  title,
  href,
  cta,
  empty,
  children,
  trailingText = false,
}: {
  testId: string;
  title: string;
  href?: string;
  cta?: string;
  empty: string;
  children?: React.ReactNode;
  /** News-only opt-in — keeps the "View all" words in the trailing
   *  slot instead of swapping to the glyph. Do not spread. */
  trailingText?: boolean;
}) {
  const hasBody = Boolean(children);
  const action = overviewModuleHeaderAction(title, href, cta);
  return (
    <DashboardHomePanel aria-label={title} data-overview-module={testId}>
      <div className={`flex items-center justify-between ${DASHBOARD_RELATED_GAP_CLASS} ${DASHBOARD_CARD_PAD_LIST}`}>
        <p data-overview-module-label="" className={DASHBOARD_SECTION_TITLE_CLASS}>
          {title}
        </p>
        {action ? (
          trailingText ? (
            <TextAction href={action.href} data-overview-module-text="">
              {action.label}
            </TextAction>
          ) : action.href.startsWith("?ai=") ? (
            <AskAiOpenButton
              aria-label={action.label}
              data-overview-ai-ask=""
              data-overview-module-arrow=""
              className={OVERVIEW_MODULE_ARROW_CLASS}
            >
              <HouseActionArrow />
            </AskAiOpenButton>
          ) : (
            <Link
              href={action.href}
              aria-label={action.label}
              data-overview-module-arrow=""
              className={OVERVIEW_MODULE_ARROW_CLASS}
            >
              <HouseActionArrow />
            </Link>
          )
        ) : null}
      </div>
      {hasBody ? children : <DashboardHomeEmpty>{empty}</DashboardHomeEmpty>}
    </DashboardHomePanel>
  );
}
