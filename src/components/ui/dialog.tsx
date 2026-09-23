"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

import { Close44 } from "@/components/chrome/house";
import { AppSheetCard, AppSheetFrame, HouseScrim, useHouseDesktop } from "@/components/chrome/house-overlay";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { cn } from "@/lib/cn";
import {
  HOUSE_DIALOG_CONFIRM_CLASS,
  HOUSE_DIALOG_FORM_CLASS,
  HOUSE_DIALOG_PANEL_CLASS,
} from "@/lib/house-overlay";

// HouseDialog — desktop blocking confirm and short form.
// HouseOverlay dual-host lock v1 G4. Phone confirm/form is AppSheet.
// Do not skin this panel into a bottom sheet. Media (xl) stays this
// host at the existing player width — not a fifth overlay.

export const DIALOG_PANEL_CLASS = HOUSE_DIALOG_PANEL_CLASS;

// Ask-AI overlay still consumes this header measure. HouseDialog pad
// lives on the panel (24). Do not retarget the overlay from here.
export const DIALOG_HEADER_CLASS =
  "flex items-center justify-between border-b border-hairline px-5 py-3";

export const HOUSE_DIALOG_HEADER_CLASS =
  "flex items-center justify-between border-b border-hairline pb-[var(--space-4)]";

export const DIALOG_BODY_CLASS = "pt-[var(--space-4)]";

export const DIALOG_FOOTER_CLASS =
  "mt-[var(--space-3)] flex justify-end gap-[var(--space-2)]";

export const DIALOG_SIZES = {
  sm: HOUSE_DIALOG_CONFIRM_CLASS,
  md: HOUSE_DIALOG_FORM_CLASS,
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
  const desktop = useHouseDesktop();
  // Closed dialog keeps its children so SSR still finds the form.
  // Open phone confirm/form moves onto AppSheet. Media (xl) stays
  // this host on every viewport.
  const phoneSheet = open && size !== "xl" && !desktop;
  const showDialog = open && !phoneSheet;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (showDialog && !dialog.open) dialog.showModal();
    if (!showDialog && dialog.open) dialog.close();
  }, [showDialog]);

  return (
    <>
      <dialog
        ref={ref}
        onClose={onClose}
        onClick={(event) => {
          if (event.target === ref.current) onClose();
        }}
        data-house-overlay-host="house-dialog"
        data-dialog-size={size}
        className={cn(
          DIALOG_PANEL_CLASS,
          DIALOG_SIZES[size],
          size !== "xl" && "max-md:hidden",
        )}
      >
        {phoneSheet ? null : (
          <>
            <div className={HOUSE_DIALOG_HEADER_CLASS}>
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
          </>
        )}
      </dialog>
      {phoneSheet && open ? (
        <AppSheetFrame label={title}>
          <HouseScrim label="Close" onClose={onClose} />
          <AppSheetCard>
            <div className="flex items-center justify-between">
              <h2 className="t-body font-medium text-ink">{title}</h2>
              <Close44 label="Close" onClick={onClose} />
            </div>
            {children}
          </AppSheetCard>
        </AppSheetFrame>
      ) : null}
    </>
  );
}

export { Dialog as HouseDialog };
