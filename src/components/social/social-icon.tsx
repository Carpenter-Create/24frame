"use client";

import {
  Camera,
  CaretLeft,
  CaretRight,
  ChatCircle,
  Check,
  Compass,
  Heart,
  House,
  Image,
  Plus,
  User,
  Users,
  WarningCircle,
  X,
  type Icon,
} from "@phosphor-icons/react";

import type { SocialPhosphorIconName } from "@/lib/social-icons";

const ICONS: Record<SocialPhosphorIconName, Icon> = {
  house: House,
  compass: Compass,
  plus: Plus,
  "chat-circle": ChatCircle,
  user: User,
  check: Check,
  image: Image,
  users: Users,
  "warning-circle": WarningCircle,
  camera: Camera,
  "caret-left": CaretLeft,
  "caret-right": CaretRight,
  x: X,
  heart: Heart,
};

export function SocialIcon({
  name,
  active = false,
  size = 20,
  className,
}: {
  name: SocialPhosphorIconName;
  active?: boolean;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[name];
  return (
    <Icon
      data-social-icon={name}
      data-social-icon-active={active ? "" : undefined}
      className={className}
      size={size}
      weight={active ? "fill" : "bold"}
    />
  );
}
