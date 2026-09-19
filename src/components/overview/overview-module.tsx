"use client";

import Link from "next/link";

import { AskAiOpenButton } from "@/components/chrome/ask-ai-overlay";
import { HouseActionArrow } from "@/components/chrome/house-action-arrow";
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
// Trailing header CTA is now a glyph-only HouseActionArrow (Adam
// 2026-09-19). The destination label survives as the arrow's
// aria-label. Ask 24Frame AI stays as an AskAiOpenButton — content
// swaps from the word "Ask …" to the same house arrow. Global
// TextAction is left alone; Dashboard's ranked View-all keeps its
// word + arrow pattern.

export function OverviewModule({
  testId,
  title,
  href,
  cta,
  empty,
  children,
}: {
  testId: string;
  title: string;
  href?: string;
  cta?: string;
  empty: string;
  children?: React.ReactNode;
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
          action.href.startsWith("?ai=") ? (
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
