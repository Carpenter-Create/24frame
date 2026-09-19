import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardBody } from "@/components/ui/card";
import {
  SETTINGS,
  SETTINGS_PANE_CLASS,
  SETTINGS_PANE_TITLE_CLASS,
  SETTINGS_QUIET_ROW_CLASS,
  SETTINGS_SECTION_CLASS,
  settingsPaneTitle,
} from "@/lib/settings";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { getOrgContext } from "@/lib/supabase/context";
import { userMenuName } from "@/lib/user-menu";
import { AccountProfileForm } from "@/app/(app)/account/account-profile-form";

// Profile pane — identity + sign-in already in product. Edit public
// profile deep-links to the existing Social editor. Not a second
// profile product. Company lives on Organization.
export async function ProfileSettings() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const photoUrl = await signedAvatarUrl(ctx.user.id);

  return (
    <div data-settings-page="" data-settings-hub="profile" className={SETTINGS_PANE_CLASS}>
      <section data-settings-section="profile" className={SETTINGS_SECTION_CLASS}>
        <h1 className={SETTINGS_PANE_TITLE_CLASS}>{settingsPaneTitle("profile")}</h1>
        <Card>
          <CardBody>
            <AccountProfileForm
              name={userMenuName(ctx.user.name) ?? ""}
              email={ctx.user.email}
              photoUrl={photoUrl}
            />
          </CardBody>
        </Card>
        <Link
          href={SETTINGS.editPublicProfileHref}
          data-settings-edit-public-profile=""
          className={SETTINGS_QUIET_ROW_CLASS}
        >
          {SETTINGS.editPublicProfile}
        </Link>
      </section>
    </div>
  );
}
