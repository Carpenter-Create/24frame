import { HouseLeadChrome } from "./house-lead-chrome";

// Phone top chrome is HouseLeadChrome without a workspace pill.
// Trailing is search (when needed) · 24Frame AI · bell · avatar.
// Desktop trailing switcher · theme stay on that primitive. Ask
// is the same header control, immediately left of the bell.
// Do not fork a second header.

export function HousePhoneTopChrome(
  props: React.ComponentProps<typeof HouseLeadChrome>,
) {
  return <HouseLeadChrome {...props} />;
}
