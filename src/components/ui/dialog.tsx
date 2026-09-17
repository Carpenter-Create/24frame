"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";

// Minimal premium modal on the native <dialog> element: focus trap, Esc-to-close, and
// a11y come free — no Radix dep. Backdrop click closes. `size` widens it for media
// (the video player) without touching the default form width.
//
// `h-fit` is the confirm-air lock: `m-auto` without it stretches the panel to the
// viewport (tall empty body). Footer chrome is DialogFooter — not a per-surface gap.

export const DIALOG_PANEL_CLASS =
  "m-auto h-fit rounded-[var(--radius-lg)] border border-hairline bg-surface p-0 text-ink shadow-[var(--elevation)] backdrop:bg-black/40 backdrop:backdrop-blur-sm";

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
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: keyof typeof DIALOG_SIZES;
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
      className={cn(DIALOG_PANEL_CLASS, DIALOG_SIZES[size])}
    >
      <div className={DIALOG_HEADER_CLASS}>
        <h2 className="t-body font-medium text-ink">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-ink-3 transition-colors hover:text-ink"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
      <div className={DIALOG_BODY_CLASS}>{children}</div>
    </dialog>
  );
}
