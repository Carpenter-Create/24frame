"use client";

import { useEffect } from "react";

import {
  AppSheetFrame,
  HouseDrawerFrame,
  HouseOverlayHead,
  useHouseDesktop,
} from "@/components/chrome/house-overlay";

// Staff Education settings. Durable side edit.
// Desktop: HouseDrawer (right 400). Phone: AppSheet full.
// Never a side strip on phone. HouseOverlay dual-host lock v1 G5.

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
  const desktop = useHouseDesktop();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const head = (
    <HouseOverlayHead title={title} closeLabel="Close" onClose={onClose} />
  );

  if (desktop) {
    return (
      <HouseDrawerFrame label={title} onClose={onClose} closeLabel="Close">
        {head}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </HouseDrawerFrame>
    );
  }

  return (
    <AppSheetFrame span="full" label={title}>
      <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-6)] overflow-y-auto p-[var(--space-4)] pb-[max(var(--space-4),env(safe-area-inset-bottom))]">
        {head}
        {children}
      </div>
    </AppSheetFrame>
  );
}
