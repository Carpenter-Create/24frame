import Link from "next/link";
import type { ReactNode } from "react";

import { SOCIAL_ACTION_CLASS, SOCIAL_ACTION_SECONDARY_CLASS, SOCIAL_EMPTY_PANEL_CLASS } from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_EMPTY, type SocialPhosphorIconName } from "@/lib/social-icons";
import { SocialIcon } from "./social-icon";

export function SocialEmpty({
  icon,
  eyebrow,
  title,
  hint,
  action,
  secondary,
  children,
}: {
  icon: SocialPhosphorIconName;
  eyebrow?: string;
  title: string;
  hint?: string;
  action?: { href: string; label: string };
  secondary?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <div data-social-empty="" className={SOCIAL_EMPTY_PANEL_CLASS}>
      <SocialIcon name={icon} size={SOCIAL_ICON_SIZE_EMPTY} className="text-ink-2" />
      <div className="flex flex-col items-center gap-[var(--space-2)]">
        {eyebrow ? (
          <p className="text-[length:var(--text-title)] font-semibold text-ink">{eyebrow}</p>
        ) : null}
        <p className="t-body font-semibold text-ink">{title}</p>
        {hint ? <p className="t-body-sm text-ink-2">{hint}</p> : null}
      </div>
      {action || secondary ? (
        <div className="flex flex-wrap items-center justify-center gap-[var(--space-2)]">
          {action ? (
            <Link href={action.href} className={SOCIAL_ACTION_CLASS}>
              {action.label}
            </Link>
          ) : null}
          {secondary ? (
            <Link href={secondary.href} className={SOCIAL_ACTION_SECONDARY_CLASS}>
              {secondary.label}
            </Link>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
