import { redirect } from "next/navigation";

import { SettingsPageLead } from "@/components/settings/settings-page-lead";
import { Card, CardBody } from "@/components/ui/card";
import {
  SETTINGS,
  SETTINGS_PANE_CLASS,
  SETTINGS_SECTION_CLASS,
  settingsPaneTitle,
} from "@/lib/settings";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { getOrgContext } from "@/lib/supabase/context";
import { userMenuName } from "@/lib/user-menu";
import { AccountProfileForm } from "@/app/(app)/account/account-profile-form";

// Profile pane — account identity only (name / photo / sign-in email
// + Save). Public / Social profile is Social-owned. Not a second
// profile product. Company lives on Organization.
export async function ProfileSettings() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const photoUrl = await signedAvatarUrl(ctx.user.id);

  return (
    <div data-settings-page="" data-settings-hub="profile" className={SETTINGS_PANE_CLASS}>
      <section data-settings-section="profile" className={SETTINGS_SECTION_CLASS}>
        <SettingsPageLead title={settingsPaneTitle("profile")} pathname={SETTINGS.profileHref} />
        <Card>
          <CardBody>
            <AccountProfileForm
              name={userMenuName(ctx.user.name) ?? ""}
              email={ctx.user.email}
              photoUrl={photoUrl}
            />
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
