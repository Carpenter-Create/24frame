"use client";

import type { ComponentProps } from "react";
import { ArrowRight } from "@phosphor-icons/react";

import { cn } from "@/lib/cn";
import {
  PHOSPHOR_CHROME_ICON_CLASS,
  PHOSPHOR_CHROME_IDLE_WEIGHT,
} from "@/lib/phosphor-icon";

// House blue outbound / action arrow — same Phosphor ArrowRight Bold
// 16 + text-accent as Dashboard View all. Glyph only; no Read / Open
// / Visit. External Industry news cards use this without words.
// In-app View all may keep its text and reuse this glyph.

export const HOUSE_ACTION_ARROW_CLASS = `${PHOSPHOR_CHROME_ICON_CLASS} text-accent`;

export function HouseActionArrow({
  className,
  ...props
}: Omit<ComponentProps<typeof ArrowRight>, "weight" | "aria-hidden">) {
  return (
    <ArrowRight
      data-house-action-arrow=""
      className={cn(HOUSE_ACTION_ARROW_CLASS, className)}
      weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
      aria-hidden
      {...props}
    />
  );
}
