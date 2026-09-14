import Link from "next/link";

import { socialChecklistIncomplete, type SocialChecklistItem } from "@/lib/social-home";
import { SOCIAL } from "@/lib/social";

export function SocialOnboardingChecklist({ items }: { items: readonly SocialChecklistItem[] }) {
  if (!socialChecklistIncomplete(items)) return null;

  return (
    <section
      data-social-checklist=""
      className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius)] border border-hairline p-[var(--space-4)]"
    >
      <h2 className="t-body font-medium text-ink">{SOCIAL.checklist.title}</h2>
      <ul className="flex flex-col gap-[var(--space-2)]">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              data-social-checklist-item={item.id}
              data-social-checklist-done={item.done ? "" : undefined}
              className="flex items-center justify-between t-body-sm text-ink"
            >
              <span>{item.label}</span>
              <span className="text-ink-3">{item.done ? "Done" : ""}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
