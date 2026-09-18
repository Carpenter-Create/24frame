import { HouseLeadChrome } from "@/components/chrome/house-lead-chrome";
import { UserMenu } from "@/components/chrome/user-menu";
import {
  SocialHeaderSearch,
  SocialHeaderSearchPhone,
} from "@/components/social/social-header-search";

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
      search={<SocialHeaderSearch />}
      phoneSearch={<SocialHeaderSearchPhone />}
      accountMenu={<UserMenu email={email} name={name} photoUrl={photoUrl} />}
    />
  );
}
