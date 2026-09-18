"use client";

import { AskAiOpenButton } from "@/components/chrome/ask-ai-overlay";
import { TextAction } from "@/components/chrome/house";
import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";
import {
  DashboardHomeEmpty,
  DashboardHomePanel,
} from "@/components/dashboard/dashboard-home";
import {
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
} from "@/lib/dashboard-craft";
import { overviewModuleHeaderAction } from "@/lib/overview";

// Shared Home module shell — Social · Education · Industry news · Needs you · AI.
// Net revenue uses the dashboard panel + house period chips, not this shell.
// Header chrome lives inside the grey panel. Do not float a title on page white.

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
            <AskAiOpenButton className={TEXT_ACTION_CLASS} data-overview-ai-ask="">
              {action.label}
            </AskAiOpenButton>
          ) : (
            <TextAction href={action.href}>{action.label}</TextAction>
          )
        ) : null}
      </div>
      {hasBody ? children : <DashboardHomeEmpty>{empty}</DashboardHomeEmpty>}
    </DashboardHomePanel>
  );
}
