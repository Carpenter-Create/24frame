import Link from "next/link";

import { cn } from "@/lib/cn";
import {
  SOCIAL_CATEGORY_LABELS,
  socialHomeLensHref,
  type SocialCategoryLabel,
} from "@/lib/social-categories";
import { SOCIAL_PILL_ACTIVE_CLASS, SOCIAL_PILL_CLASS, SOCIAL_PILL_IDLE_CLASS } from "@/lib/social-chrome";

// Home-only topic row. Re-tap of the active pill returns All.
// Explore / Create / Messages / Profile must not mount this.

export function SocialLensRow({ active }: { active: SocialCategoryLabel }) {
  return (
    <div data-social-lenses="" className="overflow-x-auto">
      <div className="flex w-max gap-[var(--space-2)] pb-[var(--space-3)]">
        {SOCIAL_CATEGORY_LABELS.map((label) => {
          const current = label === active;
          return (
            <Link
              key={label}
              href={socialHomeLensHref(label, active)}
              data-social-lens={label}
              data-social-lens-active={current ? "" : undefined}
              className={cn(SOCIAL_PILL_CLASS, current ? SOCIAL_PILL_ACTIVE_CLASS : SOCIAL_PILL_IDLE_CLASS)}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
