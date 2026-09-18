import Link from "next/link";

import { HOUSE_FILTER_OFF_CLASS, HOUSE_FILTER_ON_CLASS } from "@/lib/house-shell";
import { cn } from "@/lib/cn";

// URL-driven filter chips (server component, no client JS). Active chip is a solid ink
// pill (greyscale — accent stays reserved). Preserves other params via the hrefFor builder.
export function StatusFilter<T extends string>({
  current,
  options,
  hrefFor,
}: {
  current: T;
  options: { key: T; label: string }[];
  hrefFor: (key: T) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by status">
      {options.map((o) => {
        const active = o.key === current;
        return (
          <Link
            key={o.key}
            href={hrefFor(o.key)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-full px-3 py-1 t-label transition-colors",
              active ? HOUSE_FILTER_ON_CLASS : `${HOUSE_FILTER_OFF_CLASS} hover:text-ink`,
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
