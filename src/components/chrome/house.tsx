"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { X } from "@phosphor-icons/react";

import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

import { accountPhotoSrc } from "@/lib/account-avatar";
import { cn } from "@/lib/cn";
import {
  APP_SHEET_HAIRLINE_CLASS,
  APP_SHEET_HEAD_CLASS,
  APP_SHEET_SURFACE_CLASS,
  CLOSE_44_CLASS,
  HOUSE_EMPTY_CLASS,
  IDENTITY_AVATAR_CLASS,
  IDENTITY_BLOCK_CLASS,
  IDENTITY_EMAIL_CLASS,
  IDENTITY_NAME_CLASS,
  SHEET_GROUP_CLASS,
  SHEET_GROUP_ITEM_CLASS,
  SHEET_GROUP_LABEL_CLASS,
  TEXT_ACTION_CLASS,
} from "@/lib/house-sheet";

// 543:562 Close/44 — live muted 44 circle. Glyph only: Phosphor X Bold 16.
export function Close44({
  label,
  className,
  ...props
}: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      {...props}
      className={cn(CLOSE_44_CLASS, className)}
    >
      <X className="size-4" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
    </button>
  );
}

// 543:563 Text action — 13 Regular Sporty Blue.
export function TextAction({
  href,
  children,
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link href={href} className={cn(TEXT_ACTION_CLASS, className)} {...props}>
      {children}
    </Link>
  );
}

// House empty — the same 15 Regular line as other empties. No icon, no card.
export function HouseEmpty({ children }: { children: ReactNode }) {
  return (
    <p data-house-empty="" className={HOUSE_EMPTY_CLASS}>
      {children}
    </p>
  );
}

// Face bytes, or the existing initial. onError drops a failed img so chrome
// never shows a broken circle. The layout passes ACCOUNT_PHOTO_HREF so the
// route re-signs; a 5-minute S3 GET is not held in the client shell.
export function IdentityPhoto({
  avatarInitial,
  photoUrl,
}: {
  avatarInitial: string;
  photoUrl?: string | null;
}) {
  const face = accountPhotoSrc(photoUrl);
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const broken = Boolean(face && brokenSrc === face);

  if (!face || broken) return avatarInitial;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- same-origin face route; handler signs a short-lived GET
    <img
      src={face}
      alt=""
      className="size-full object-cover"
      onError={() => setBrokenSrc(face)}
    />
  );
}

// 543:565 Identity block — 48 circle, name 15 Regular ink, email 13 tertiary.
// Always render name and email. Real values only — no dashes, no pill well.
export function IdentityBlock({
  avatarInitial,
  photoUrl,
  name,
  email,
  className,
}: {
  avatarInitial: string;
  photoUrl?: string | null;
  name: string;
  email: string;
  className?: string;
}) {
  const face = accountPhotoSrc(photoUrl);
  return (
    <div data-identity-block="" className={cn(IDENTITY_BLOCK_CLASS, className)}>
      <div
        data-identity-avatar=""
        data-identity-photo={face ? "" : undefined}
        className={cn(IDENTITY_AVATAR_CLASS, face ? "overflow-hidden" : null)}
      >
        <IdentityPhoto avatarInitial={avatarInitial} photoUrl={photoUrl} />
      </div>
      <div data-identity-who="" className="flex flex-col items-start gap-[var(--space-2)]">
        <p data-identity-name="" className={IDENTITY_NAME_CLASS}>
          {name}
        </p>
        <p data-identity-email="" className={IDENTITY_EMAIL_CLASS}>
          {email}
        </p>
      </div>
    </div>
  );
}

// 543:570 Group — eyebrow then rows.
export function SheetGroup({
  label,
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-sheet-group="" className={cn(SHEET_GROUP_CLASS, className)}>
      {label ? (
        <p data-sheet-group-label="" className={SHEET_GROUP_LABEL_CLASS}>
          {label}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export function SheetGroupItem({
  href,
  onClick,
  children,
  item,
  pressed,
  label,
}: {
  href?: string | null;
  onClick?: () => void;
  children: ReactNode;
  item?: string;
  pressed?: boolean;
  label?: string;
}) {
  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        data-sheet-group-item={item}
        className={SHEET_GROUP_ITEM_CLASS}
        aria-label={label}
      >
        {children}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        data-sheet-group-item={item}
        className={SHEET_GROUP_ITEM_CLASS}
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }
  return (
    <p data-sheet-group-item={item} className={SHEET_GROUP_ITEM_CLASS}>
      {children}
    </p>
  );
}

// 543:576 App sheet chrome — same sheet as nav, different body.
export function AppSheetSurface({
  className,
  ...props
}: ComponentProps<"div">) {
  return <div className={cn(APP_SHEET_SURFACE_CLASS, className)} {...props} />;
}

export function AppSheetHead({
  className,
  ...props
}: ComponentProps<"div">) {
  return <div className={cn(APP_SHEET_HEAD_CLASS, className)} {...props} />;
}

export function AppSheetHairline({
  className,
  ...props
}: ComponentProps<"div">) {
  return <div className={cn(APP_SHEET_HAIRLINE_CLASS, className)} {...props} />;
}
