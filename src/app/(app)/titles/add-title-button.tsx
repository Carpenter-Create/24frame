"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { TITLES_ADD_ICON_CLASS, TITLES_CATALOG } from "@/lib/titles-catalog";
import { AddTitleForm } from "./add-title-form";

// The catalog's one Sporty Blue CTA → modal with the existing AddTitleForm.
// Phone: header + (house 44). Desktop: labeled filled pill. On success the
// dialog closes and the server component re-renders (router.refresh) so the
// new title appears in the catalog.
// Phone and desktop each mount this control and CSS-hide the inactive host.
// Dialog is portaled to body — a showModal() ancestor that goes display:none
// keeps the document inert with no visible dialog.
export function AddTitleButton({
  orgId,
  appearance = "labeled",
}: {
  orgId: string;
  appearance?: "labeled" | "icon";
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const dialog = (
    <Dialog open={open} onClose={() => setOpen(false)} title="Add a title">
      <AddTitleForm
        orgId={orgId}
        onSuccess={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </Dialog>
  );

  return (
    <>
      {appearance === "icon" ? (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          data-add-title=""
          data-add-title-icon=""
          aria-label={TITLES_CATALOG.addTitle}
          className={TITLES_ADD_ICON_CLASS}
        >
          <Plus
            className={PHOSPHOR_CHROME_ICON_CLASS}
            weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
            aria-hidden
          />
        </Button>
      ) : (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          data-add-title=""
          data-add-title-labeled=""
        >
          {TITLES_CATALOG.addTitle}
        </Button>
      )}
      {typeof document !== "undefined" ? createPortal(dialog, document.body) : dialog}
    </>
  );
}
