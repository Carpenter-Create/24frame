"use client";

import type { ReactNode } from "react";

import { menuHostClass, type MenuHostShape } from "@/lib/menu-host";

// One dual host. Phone child and desktop child do not share a grammar.
// `slot` is the header cluster (contents — the child stays the flex item).
// `branch` is a page section (real box). Do not paint a third sheet here.

export function MenuDualHost({
  phone,
  desktop,
  shape = "branch",
}: {
  phone: ReactNode;
  desktop: ReactNode;
  shape?: Extract<MenuHostShape, "branch" | "slot">;
}) {
  return (
    <>
      <div data-menu-host="phone" data-menu-host-shape={shape} className={menuHostClass("phone", shape)}>
        {phone}
      </div>
      <div
        data-menu-host="desktop"
        data-menu-host-shape={shape}
        className={menuHostClass("desktop", shape)}
      >
        {desktop}
      </div>
    </>
  );
}
