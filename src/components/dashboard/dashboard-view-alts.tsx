"use client";

import Link from "next/link";
import { ArrowRight, ChartBar, Globe, List } from "@phosphor-icons/react";

import { DASHBOARD_HOME } from "@/lib/dashboard-home";
import type { DashboardRegisterView } from "@/lib/dashboard-register";
import {
  DASHBOARD_VIEW_ALL_CLASS,
  DASHBOARD_VIEW_ALT_BUTTON_CLASS,
  DASHBOARD_VIEW_ALT_BUTTON_ON_CLASS,
  DASHBOARD_VIEW_ALT_CLUSTER_CLASS,
} from "@/lib/dashboard-craft";
import { PHOSPHOR_CHROME_IDLE_WEIGHT, PhosphorChromeIcon } from "@/lib/phosphor-icon";
import { cn } from "@/lib/cn";

const VIEW_ICON = {
  map: Globe,
  list: List,
  bars: ChartBar,
} as const;

const VIEW_LABEL: Record<DashboardRegisterView, string> = {
  map: DASHBOARD_HOME.viewMap,
  list: DASHBOARD_HOME.viewList,
  bars: DASHBOARD_HOME.viewBars,
};

export function DashboardViewAlts({
  modes,
  mode,
  onChange,
}: {
  modes: readonly DashboardRegisterView[];
  mode: DashboardRegisterView;
  onChange: (mode: DashboardRegisterView) => void;
}) {
  return (
    <div
      data-dashboard-view-alts=""
      className={DASHBOARD_VIEW_ALT_CLUSTER_CLASS}
    >
      {modes.map((item) => {
        const on = item === mode;
        return (
          <button
            key={item}
            type="button"
            aria-label={`${VIEW_LABEL[item]} view`}
            aria-pressed={on}
            data-dashboard-view-alt={item}
            onClick={() => onChange(item)}
            className={cn(
              DASHBOARD_VIEW_ALT_BUTTON_CLASS,
              on ? DASHBOARD_VIEW_ALT_BUTTON_ON_CLASS : "text-ink-3",
            )}
          >
            <PhosphorChromeIcon icon={VIEW_ICON[item]} active={on} />
          </button>
        );
      })}
    </div>
  );
}

export function DashboardViewAll({ href }: { href: string }) {
  return (
    <Link href={href} data-dashboard-view-all="" className={DASHBOARD_VIEW_ALL_CLASS}>
      <span>{DASHBOARD_HOME.viewAll}</span>
      <ArrowRight
        data-dashboard-view-all-arrow=""
        className="size-4 shrink-0"
        weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
        aria-hidden
      />
    </Link>
  );
}
