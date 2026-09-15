"use client";

import Link from "next/link";
import { useState } from "react";

import { socialChecklistIncomplete, type SocialChecklistItem } from "@/lib/social-home";
import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_ACTION_QUIET_CLASS,
  SOCIAL_CHECKLIST_CLASS,
  SOCIAL_CHECKLIST_ROW_CLASS,
  SOCIAL_CHECKLIST_ROW_LAST_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_NAV } from "@/lib/social-icons";
import { SocialIcon } from "./social-icon";

export function SocialOnboardingChecklist({ items }: { items: readonly SocialChecklistItem[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !socialChecklistIncomplete(items)) return null;

  const done = items.filter((item) => item.done).length;

  return (
    <section
      data-social-checklist=""
      className={SOCIAL_CHECKLIST_CLASS}
    >
      <div className="flex items-center justify-between gap-[var(--space-4)]">
        <div className="flex flex-col gap-1">
          <h2 className="t-body font-medium text-ink">{SOCIAL.checklist.title}</h2>
          <p className="t-body-sm text-ink-2">
            {done} of {items.length} {SOCIAL.checklist.progress}
          </p>
        </div>
        <button
          type="button"
          data-social-checklist-dismiss=""
          className="t-body-sm text-ink-2"
          onClick={() => setDismissed(true)}
        >
          {SOCIAL.checklist.dismiss}
        </button>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          data-social-checklist-progress=""
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.max(done === 0 ? 2 : 0, (done / items.length) * 100)}%` }}
        />
      </div>
      <ul className="flex flex-col">
        {items.map((item, index) => (
          <li
            key={item.id}
            className={index < items.length - 1 ? SOCIAL_CHECKLIST_ROW_CLASS : SOCIAL_CHECKLIST_ROW_LAST_CLASS}
          >
            <Link
              href={item.href}
              data-social-checklist-item={item.id}
              data-social-checklist-done={item.done ? "" : undefined}
              className="flex items-center justify-between gap-[var(--space-3)]"
            >
              <span className="flex items-center gap-[var(--space-3)]">
                <span className="flex size-5 items-center justify-center rounded-[4px] border-[1.5px] border-hairline">
                  <SocialIcon name="check" size={SOCIAL_ICON_SIZE_NAV} className="text-ink-3" />
                </span>
                <span className="t-body-sm text-ink">{item.label}</span>
              </span>
              {item.done ? null : <span className={SOCIAL_ACTION_QUIET_CLASS}>{item.cta}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
