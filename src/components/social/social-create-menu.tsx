"use client";

import type { ReactElement } from "react";
import Link from "next/link";

import { MenuSurfaceContent, MenuSurfaceItem } from "@/components/chrome/menu-surface";
import { SocialIcon } from "@/components/social/social-icon";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SOCIAL } from "@/lib/social";
import { SOCIAL_CREATE_MENU_INTENTS } from "@/lib/social-create-menu";

export function SocialCreateMenu({
  trigger,
  align = "end",
}: {
  trigger: ReactElement;
  align?: "start" | "center" | "end";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <MenuSurfaceContent
        align={align}
        density="panel"
        data-social-create-menu-surface=""
        aria-label={SOCIAL.create.title}
      >
        {SOCIAL_CREATE_MENU_INTENTS.map((intent) => (
          <MenuSurfaceItem key={intent.id} asChild>
            <Link href={intent.href} data-social-create-intent={intent.id}>
              <SocialIcon name={intent.icon} size={16} className="text-ink-2" />
              {intent.label}
            </Link>
          </MenuSurfaceItem>
        ))}
      </MenuSurfaceContent>
    </DropdownMenu>
  );
}
