"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

import { PageHeaderBackLink } from "@/components/ui/page-header";
import {
  SETTINGS,
  settingsHeaderBack,
  settingsHubHasInAppHistory,
} from "@/lib/settings";

// Hub Back — account chrome from any surface. Prefer in-app history;
// dashboard land only when this tab has nowhere to go back.
export function SettingsHubBackLink({ className }: { className?: string }) {
  const router = useRouter();
  const back = settingsHeaderBack(SETTINGS.href);

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
      return;
    }
    if (settingsHubHasInAppHistory(window.history.length)) {
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
