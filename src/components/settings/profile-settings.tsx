import { redirect } from "next/navigation";

import { AccountPhotoField, AccountProfileForm } from "@/app/(app)/account/account-profile-form";
import { SettingsDrillRow } from "@/components/settings/settings-drill";
import { SettingsPageLead } from "@/components/settings/settings-page-lead";
import { Card, CardBody } from "@/components/ui/card";
import { ACCOUNT_PHOTO_HREF } from "@/lib/account-avatar";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { menuHostClass } from "@/lib/menu-host";
import {
  SETTINGS,
  SETTINGS_DRILL_LIST_CLASS,
  SETTINGS_PANE_CLASS,
  SETTINGS_SECTION_CLASS,
  settingsPaneTitle,
} from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import { userMenuName } from "@/lib/user-menu";

// Profile pane — account identity only (name / photo / sign-in email
// + Save). Public / Social profile is Social-owned. Not a second
// profile product. Company lives on Organization.
// Mobile: Coinbase drill-in. Photo stays on the index. Name opens a
// dedicated pane. Email is read-only — no fake drill-in.

function profileNameValue(name: string): string {
  return name.trim() ? name : ACCOUNT_PROFILE.emptyValue;
}

export async function ProfileSettings() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const photoUrl = ACCOUNT_PHOTO_HREF;
  const name = userMenuName(ctx.user.name) ?? "";

  return (
    <div data-settings-page="" data-settings-hub="profile" className={SETTINGS_PANE_CLASS}>
      <section data-settings-section="profile" className={SETTINGS_SECTION_CLASS}>
        <SettingsPageLead title={settingsPaneTitle("profile")} pathname={SETTINGS.profileHref} />
        <div
          data-settings-profile-index=""
          data-menu-host="phone"
          data-menu-family="B"
          className={`${menuHostClass("phone")} ${SETTINGS_DRILL_LIST_CLASS}`}
        >
          <AccountPhotoField photoUrl={photoUrl} />
          <SettingsDrillRow
            kind="name"
            label={ACCOUNT_PROFILE.nameLabel}
            value={profileNameValue(name)}
            href={SETTINGS.profileNameHref}
          />
          <SettingsDrillRow
            kind="email"
            label={ACCOUNT_PROFILE.emailLabel}
            value={ctx.user.email}
            readOnly
            helper={ACCOUNT_PROFILE.emailLocked}
          />
        </div>
        <div className={menuHostClass("desktop")} data-menu-host="desktop" data-menu-family="desktop">
          <Card>
            <CardBody>
              <AccountProfileForm
                name={name}
                email={ctx.user.email}
                photoUrl={photoUrl}
              />
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
}
