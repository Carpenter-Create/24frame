"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

import { PageHeaderBackLink } from "@/components/ui/page-header";
import {
  SETTINGS,
  settingsHeaderBack,
  settingsHubHasInAppReferrer,
} from "@/lib/settings";

// Account-chrome Back — Settings hub lock #515/#520. Prefer in-app
// history; fallback href only when referrer is missing or off-origin.
// Activity and Get Help consume this same leaf. Do not fork a
// lookalike click helper per surface. Callers pass their own
// fallback href (Home for Activity / Help; Settings keeps dashboard).
export function SettingsHubBackLink({
  className,
  href,
  label,
}: {
  className?: string;
  href?: string;
  label?: string;
}) {
  const router = useRouter();
  const back = settingsHeaderBack(SETTINGS.href);

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
      return;
    }
    if (settingsHubHasInAppReferrer(document.referrer, window.location.origin)) {
      event.preventDefault();
      router.back();
    }
  }

  return (
    <PageHeaderBackLink
      href={href ?? back.href}
      label={label ?? back.label}
      className={className}
      onClick={onClick}
    />
  );
}
