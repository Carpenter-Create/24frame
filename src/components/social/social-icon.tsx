"use client";

import {
  Broadcast,
  Camera,
  CameraRotate,
  CaretLeft,
  CaretRight,
  ChatCircle,
  Check,
  CheckCircle,
  Compass,
  DownloadSimple,
  FilmSlate,
  FilmStrip,
  Heart,
  House,
  Image,
  Link,
  MagnifyingGlass,
  PaperPlaneTilt,
  PencilSimple,
  Play,
  Plus,
  ShareNetwork,
  SquaresFour,
  TextT,
  Trash,
  Tray,
  UploadSimple,
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
  "film-strip": FilmStrip,
  "film-slate": FilmSlate,
  "squares-four": SquaresFour,
  "magnifying-glass": MagnifyingGlass,
  tray: Tray,
  "paper-plane-tilt": PaperPlaneTilt,
  play: Play,
  "share-network": ShareNetwork,
  link: Link,
  "download-simple": DownloadSimple,
  "text-t": TextT,
  "warning-circle": WarningCircle,
  camera: Camera,
  "camera-rotate": CameraRotate,
  "pencil-simple": PencilSimple,
  "check-circle": CheckCircle,
  trash: Trash,
  "upload-simple": UploadSimple,
  "caret-left": CaretLeft,
  "caret-right": CaretRight,
  x: X,
  heart: Heart,
  broadcast: Broadcast,
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
