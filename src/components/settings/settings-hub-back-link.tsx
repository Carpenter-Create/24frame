"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

import { PageHeaderBackLink } from "@/components/ui/page-header";
import {
  SETTINGS,
  settingsHeaderBack,
  settingsHubHasInAppReferrer,
} from "@/lib/settings";

// Hub Back — account chrome from any surface. Prefer in-app history;
// dashboard land only when referrer is missing or off-origin.
export function SettingsHubBackLink({ className }: { className?: string }) {
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
      href={back.href}
      label={back.label}
      className={className}
      onClick={onClick}
    />
  );
}
