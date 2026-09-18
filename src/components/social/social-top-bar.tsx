import { HouseLeadChrome } from "@/components/chrome/house-lead-chrome";
import { HouseLeadSearch } from "@/components/chrome/house-lead-search";
import { UserMenu } from "@/components/chrome/user-menu";

export function SocialTopBar({
  email,
  name,
  photoUrl,
}: {
  email: string;
  name?: string | null;
  photoUrl?: string | null;
}) {
  return (
    <HouseLeadChrome
      workspace="social"
      logoVisible="always"
      search={<HouseLeadSearch tone="live" />}
      trailingSearch={<HouseLeadSearch tone="live" presentation="icon" />}
      accountMenu={<UserMenu email={email} name={name} photoUrl={photoUrl} />}
    />
  );
}
