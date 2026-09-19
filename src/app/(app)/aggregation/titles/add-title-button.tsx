"use client";

import { useState } from "react";
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
export function AddTitleButton({
  orgId,
  appearance = "labeled",
}: {
  orgId: string;
  appearance?: "labeled" | "icon";
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
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
      <Dialog open={open} onClose={() => setOpen(false)} title="Add a title">
        <AddTitleForm
          orgId={orgId}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Dialog>
    </>
  );
}
