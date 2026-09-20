"use client";

import { Suspense, use, useEffect, useState, type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";
import type { AppShellChrome } from "@/lib/app-shell-chrome";
import { HOUSE_LEAD_SHELL_CLASS } from "@/lib/house-lead-chrome";
import { HOUSE_PAGE_CANVAS_CLASS } from "@/lib/house-shell";
import type { WorkspaceMode } from "@/lib/workspace";
import { HouseLeadScrollToTop } from "./house-lead-scroll-to-top";
import { HousePhoneBottomNav } from "./house-phone-bottom-nav";

// One phone shell primitive. Both Social and Access trees mount this
// so dest docks cannot fork. Desktop is unchanged — the bottom
// nav is md:hidden. Hide-on-scroll lives on HousePhoneBottomNav
// (social-tab-bar-scroll) for every workspace that uses this shell.
// HouseLeadScrollToTop bridges the iOS status-bar tap to the nested
// `[data-house-lead-scroll]` scroller so every workspace answers a
// tap the same way (Adam 2026-09-19). Coarse-pointer devices only.
// Staff dests resolve from chrome — layout never passes isGcStaff.

export function HousePhoneAppShell({
  chrome,
  workspace,
  isGcStaff = false,
  homeOwned = false,
  accountChrome = false,
  coProductions = false,
  className,
  style,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  chrome?: Promise<AppShellChrome>;
  workspace: WorkspaceMode;
  isGcStaff?: boolean;
  homeOwned?: boolean;
  accountChrome?: boolean;
  coProductions?: boolean;
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
      <PhoneDockSlot
        chrome={chrome}
        workspace={workspace}
        isGcStaff={isGcStaff}
        homeOwned={homeOwned}
        accountChrome={accountChrome}
        coProductions={coProductions}
      />
    </div>
  );
}

function peekChromeStaff(chrome?: Promise<AppShellChrome>): boolean | undefined {
  if (!chrome) return undefined;
  const tagged = chrome as Promise<AppShellChrome> & {
    status?: string;
    value?: AppShellChrome;
  };
  if (tagged.status === "fulfilled" && tagged.value) return tagged.value.isGcStaff;
  return undefined;
}

function PhoneDockSlot({
  chrome,
  workspace,
  isGcStaff,
  homeOwned,
  accountChrome,
  coProductions,
}: {
  chrome?: Promise<AppShellChrome>;
  workspace: WorkspaceMode;
  isGcStaff: boolean;
  homeOwned: boolean;
  accountChrome: boolean;
  coProductions: boolean;
}) {
  const peeked = peekChromeStaff(chrome);
  const [staff, setStaff] = useState(peeked ?? isGcStaff);
  // One HousePhoneBottomNav stays mounted. A Suspense fallback dock
  // remounted on chrome resolve and dropped hide-on-scroll / dest
  // lighting / prefetch. Peek a fulfilled thenable so staff dests
  // paint in the same pass (renderToStaticMarkup / cached chrome).
  return (
    <>
      {chrome ? (
        <Suspense fallback={null}>
          <PhoneDockFromChrome chrome={chrome} onStaff={setStaff} />
        </Suspense>
      ) : null}
      <HousePhoneBottomNav
        workspace={workspace}
        isGcStaff={peeked ?? (chrome ? staff : isGcStaff)}
        homeOwned={homeOwned}
        accountChrome={accountChrome}
        coProductions={coProductions}
      />
    </>
  );
}

function PhoneDockFromChrome({
  chrome,
  onStaff,
}: {
  chrome: Promise<AppShellChrome>;
  onStaff: (isGcStaff: boolean) => void;
}) {
  const data = use(chrome);
  useEffect(() => {
    onStaff(data.isGcStaff);
  }, [data.isGcStaff, onStaff]);
  return null;
}
