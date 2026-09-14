"use client";

import { signOut } from "@/app/actions";
import { accountPhotoSrc } from "@/lib/account-avatar";
import { userMenuAvatarInitial, userMenuName } from "@/lib/user-menu";
import { DesktopAccountMenu, MobileAccountMenu } from "./account-sheet";

export function onUserMenuLogOut(): void {
  void signOut();
}

export function UserMenuIdentity({
  email,
  name,
  photoUrl,
}: {
  email: string;
  name?: string | null;
  photoUrl?: string | null;
}) {
  const displayName = userMenuName(name);
  const initial = userMenuAvatarInitial(email);
  const face = accountPhotoSrc(photoUrl);

  return (
    <div
      data-user-menu-identity=""
      className="flex items-center gap-[var(--space-4)]"
    >
      <div
        data-user-menu-avatar=""
        data-identity-photo={face ? "" : undefined}
        className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted t-body font-normal text-ink-2"
      >
        {face ? (
          // eslint-disable-next-line @next/next/no-img-element -- short-lived signed GET from the private avatars bucket
          <img src={face} alt="" className="size-full object-cover" />
        ) : (
          initial
        )}
      </div>
      <div className="min-w-0">
        {displayName ? (
          <div data-user-menu-name="" className="truncate t-body font-normal text-ink">
            {displayName}
          </div>
        ) : null}
        <div data-user-menu-email="" className="truncate t-body-sm text-ink-3">
          {email}
        </div>
      </div>
    </div>
  );
}

export function UserMenu({
  email,
  name,
  photoUrl,
}: {
  email: string;
  name?: string | null;
  photoUrl?: string | null;
}) {
  return (
    <>
      <MobileAccountMenu email={email} name={name} photoUrl={photoUrl} />
      <DesktopAccountMenu email={email} name={name} photoUrl={photoUrl} />
    </>
  );
}
