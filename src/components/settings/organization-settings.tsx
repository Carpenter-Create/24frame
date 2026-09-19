import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { Card, CardBody } from "@/components/ui/card";
import { SETTINGS, SETTINGS_PANE_CLASS, SETTINGS_SECTION_CLASS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { CompanyProfileForm } from "@/app/(app)/account/company-profile-form";

// Organization pane — company Settings surface (moved from Aggregation).
// Team / invite / roles are out of scope this PR. This section hosts
// Team next. HouseEmpty when there is no org. Not a CMS.
export async function OrganizationSettings() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  let canEditCompany = false;
  if (ctx.activeOrg) {
    const supabase = await createClient();
    const { data: canEdit } = await supabase.rpc("member_can", {
      p_uid: ctx.user.id,
      p_org: ctx.activeOrg.id,
      p_capability: "manage_settings",
    });
    canEditCompany = canEdit === true;
  }

  return (
    <div data-settings-page="" data-settings-hub="organization" className={SETTINGS_PANE_CLASS}>
      <section data-settings-section="organization" className={SETTINGS_SECTION_CLASS}>
        <h1 className="t-section text-ink">{SETTINGS.title}</h1>
        <h2 className="t-section text-ink">{SETTINGS.organization}</h2>
        {ctx.activeOrg ? (
          <section
            data-settings-section="company"
            className={SETTINGS_SECTION_CLASS}
          >
            <h3 className="t-section text-ink">{SETTINGS.company}</h3>
            <Card>
              <CardBody>
                <CompanyProfileForm
                  orgId={ctx.activeOrg.id}
                  name={ctx.activeOrg.name}
                  canEdit={canEditCompany}
                />
              </CardBody>
            </Card>
          </section>
        ) : (
          <HouseEmpty>{SETTINGS.organizationEmpty}</HouseEmpty>
        )}
      </section>
    </div>
  );
}
