// Session-sticky chrome identity. Soft nav re-creates the layout chrome
// promise; without this, AccountMenuSlot resuspends to email="" and the
// avatar paints "?" / a letter over a face that is already known.

import { accountPhotoSrc } from "@/lib/account-avatar";

export type AccountChromeIdentity = {
  email: string;
  name?: string | null;
  photoUrl: string | null;
};

let session: AccountChromeIdentity | null = null;

export function rememberAccountChromeIdentity(
  next: AccountChromeIdentity,
): AccountChromeIdentity {
  session = {
    email: next.email,
    name: next.name,
    photoUrl: accountPhotoSrc(next.photoUrl),
  };
  return session;
}

export function readAccountChromeIdentity(): AccountChromeIdentity | null {
  return session;
}

export function stickyAccountChromeIdentity(partial: {
  email?: string;
  name?: string | null;
  photoUrl?: string | null;
}): AccountChromeIdentity {
  const email = partial.email?.trim() || session?.email || "";
  const name =
    typeof partial.name === "string" && partial.name.trim().length > 0
      ? partial.name
      : session
        ? session.name
        : partial.name;
  const photoUrl = accountPhotoSrc(partial.photoUrl) ?? session?.photoUrl ?? null;
  return { email, name, photoUrl };
}

export function resetAccountChromeIdentityForTests(): void {
  session = null;
}
