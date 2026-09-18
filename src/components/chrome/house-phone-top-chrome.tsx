import { HouseLeadChrome } from "./house-lead-chrome";

// Phone top chrome is HouseLeadChrome without a workspace pill.
// Desktop trailing switcher · Ask · theme stay on that primitive.
// Do not fork a second header.

export function HousePhoneTopChrome(
  props: React.ComponentProps<typeof HouseLeadChrome>,
) {
  return <HouseLeadChrome {...props} />;
}
