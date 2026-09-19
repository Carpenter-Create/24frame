"use client";

import { useEffect } from "react";
import { X } from "@phosphor-icons/react";

import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

import { cn } from "@/lib/cn";

// Staff Education settings only. Hairline + surface — no drop shadow.
// Outline is king; the drawer is a side job, not a second page.

export function EducationDrawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" data-education-settings-drawer="">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex w-[min(100%,28rem)] flex-col border-l border-hairline bg-surface",
        )}
      >
        <div className="flex items-center justify-between border-b border-hairline px-[var(--space-6)] py-[var(--space-4)]">
          <h2 className="t-body font-medium text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink-3 transition-colors hover:text-ink"
          >
            <X className="h-4 w-4" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-[var(--space-6)] py-[var(--space-6)]">{children}</div>
      </aside>
    </div>
  );
}
