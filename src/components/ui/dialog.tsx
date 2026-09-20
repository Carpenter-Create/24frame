"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

import { HOUSE_FORM_SELECT_SHEET_PHONE_MENU_CLASS } from "@/lib/house-form-select";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

import { cn } from "@/lib/cn";

// Minimal premium modal on the native <dialog> element: focus trap, Esc-to-close, and
// a11y come free — no Radix dep. Backdrop click closes. `size` widens it for media
// (the video player) without touching the default form width.
//
// `h-fit` is the confirm-air lock: `m-auto` without it stretches the panel to the
// viewport (tall empty body). `overflow-visible` lets the house form Select
// Listbox paint past the panel — UA dialog overflow would clip it.
// Footer chrome is DialogFooter — not a per-surface gap.

export const DIALOG_PANEL_CLASS =
  "m-auto h-fit overflow-visible rounded-[var(--radius-lg)] border border-hairline bg-surface p-0 text-ink shadow-[var(--elevation)] backdrop:bg-black/40 backdrop:backdrop-blur-sm";

export const DIALOG_HEADER_CLASS =
  "flex items-center justify-between border-b border-hairline px-5 py-3";

export const DIALOG_BODY_CLASS = "px-5 py-3";

export const DIALOG_FOOTER_CLASS =
  "mt-[var(--space-3)] flex justify-end gap-[var(--space-2)]";

export const DIALOG_SIZES = {
  sm: "w-[min(92vw,22rem)]",
  md: "w-[min(92vw,32rem)]",
  xl: "w-[min(94vw,56rem)]",
} as const;

// Soft bottom sheet on phone. Desktop stays the centered card.
// Invite uses this. Do not fork a Team-Invite overlay.
export const DIALOG_SHEET_CLASS = cn(
  "max-md:mx-0 max-md:mb-0 max-md:mt-auto max-md:w-full max-md:max-w-none max-md:rounded-b-none max-md:border-x-0 max-md:border-b-0 max-md:pb-[env(safe-area-inset-bottom)]",
  HOUSE_FORM_SELECT_SHEET_PHONE_MENU_CLASS,
);

export function DialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn(DIALOG_FOOTER_CLASS, className)} {...props} />;
}

export function Dialog({
  open,
  onClose,
  title,
  size = "md",
  presentation = "dialog",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: keyof typeof DIALOG_SIZES;
  presentation?: "dialog" | "sheet";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on the backdrop (the dialog element itself)
      }}
      data-dialog-size={size}
      data-dialog-presentation={presentation}
      className={cn(
        DIALOG_PANEL_CLASS,
        DIALOG_SIZES[size],
        presentation === "sheet" && DIALOG_SHEET_CLASS,
      )}
    >
      <div className={DIALOG_HEADER_CLASS}>
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
      <div className={DIALOG_BODY_CLASS}>{children}</div>
    </dialog>
  );
}
