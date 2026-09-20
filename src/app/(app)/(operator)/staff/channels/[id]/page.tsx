import { notFound } from "next/navigation";

import { ChannelDetail } from "@/components/channels/channel-detail";
import { createClient } from "@/lib/supabase/server";
import { UNPAGINATED_MAX, rangeFor, splitProbe } from "@/lib/list-bounds";
import {
  VENDOR_PROFILE,
  asVendorDeliveryPlacement,
  asVendorProfileRecord,
  channelCompanyRailFields,
  channelOverviewText,
  channelTerritories,
  vendorLicensedTitles,
} from "@/lib/vendor-profile";

export default async function ChannelProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: vn }, deliveryProbe] = await Promise.all([
    supabase
      .from("vendors")
      .select(
        "id, name, delivery_mode, email_to, email_cc, email_template, company_info, active",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("deliveries")
      .select("title_id, territory, status, titles(title, catalog_id)")
      .eq("vendor_id", id)
      .range(...rangeFor(UNPAGINATED_MAX + 1)),
  ]);
  const channel = asVendorProfileRecord(vn);
  if (!channel) notFound();

  const { rows: deliveryRows, truncated } = splitProbe(deliveryProbe.data, UNPAGINATED_MAX);
  const placements = deliveryRows
    .map(asVendorDeliveryPlacement)
    .filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <ChannelDetail
      channel={channel}
      overview={channelOverviewText(channel.companyInfo)}
      companyFields={channelCompanyRailFields(channel.companyInfo)}
      territories={channelTerritories(placements)}
      catalog={vendorLicensedTitles(placements)}
      truncatedNotice={truncated ? VENDOR_PROFILE.catalogTruncated(String(UNPAGINATED_MAX)) : null}
    />
  );
}
