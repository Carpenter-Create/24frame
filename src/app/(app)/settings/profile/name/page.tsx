import { redirect } from "next/navigation";

import { AccountNameForm } from "@/app/(app)/account/account-profile-form";
import { SettingsEditPane } from "@/components/settings/settings-drill";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import { userMenuName } from "@/lib/user-menu";

// Name drill-in. Same AccountNameForm SoT as desktop Profile.
// Email is not editable here. Back to Profile.

export default async function SettingsProfileNamePage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  return (
    <SettingsEditPane
      title={ACCOUNT_PROFILE.nameLabel}
      helper={ACCOUNT_PROFILE.nameHelper}
      pathname={SETTINGS.profileNameHref}
      hub="profile"
    >
      <AccountNameForm name={userMenuName(ctx.user.name) ?? ""} labeled={false} />
    </SettingsEditPane>
  );
}
