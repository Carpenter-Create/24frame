"use client";

// House standard for in-page search (Titles / Queue / Deliveries / Messages).
// Visual SoT is the lead search pill: Phosphor MagnifyingGlass Bold +
// HOUSE_LEAD_SEARCH_PILL_CLASS + HOUSE_SEARCH_PILL_CLASS + Input bare.
// Behavior is URL-driven debounce (`?q=`), not a GET form. Do not CSS-patch
// a lucide lookalike. Social / Education header twins stay a follow PR —
// they share this pill contract but keep workspace-specific GET / phone
// treatments (SocialIcon vs Phosphor, explore vs courses action).

import { useEffect, useId, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { HOUSE_LEAD_SEARCH_PILL_CLASS } from "@/lib/house-lead-chrome";
import { HOUSE_SEARCH_PILL_CLASS } from "@/lib/house-shell";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

export function HousePageSearch({
  placeholder,
  hint,
  inputId,
}: {
  placeholder: string;
  /** Visual-only kbd hint. Not a command palette. */
  hint?: string;
  inputId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const generatedId = useId();
  const fieldId = inputId ?? generatedId;
  const [value, setValue] = useState(params.get("q") ?? "");

  useEffect(() => {
    const id = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      const trimmed = value.trim();
      if (trimmed) sp.set("q", trimmed);
      else sp.delete("q");
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 250);
    return () => clearTimeout(id);
    // Only re-run when the typed value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <form
      data-house-page-search=""
      role="search"
      onSubmit={(event) => event.preventDefault()}
      className={cn(HOUSE_LEAD_SEARCH_PILL_CLASS, HOUSE_SEARCH_PILL_CLASS)}
    >
      <MagnifyingGlass
        className="size-4 shrink-0 text-ink-3"
        weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
        aria-hidden
      />
      <label className="sr-only" htmlFor={fieldId}>
        {placeholder}
      </label>
      <Input
        variant="bare"
        id={fieldId}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 placeholder:text-ink-3"
      />
      {hint ? (
        <span
          aria-hidden
          data-search-hint=""
          className="pointer-events-none shrink-0 rounded-[var(--radius-sm)] border border-hairline bg-surface px-1.5 py-0.5 text-[length:var(--text-xs)] text-ink-3"
        >
          {hint}
        </span>
      ) : null}
    </form>
  );
}
