import { PageHeader } from "@/components/ui/page-header";
import { CHANNELS_HREF } from "@/lib/channel-card";
import { CHANNELS_PAGE } from "@/lib/vendors-directory";
import { VendorForm } from "../vendor-form";

export default function NewChannelPage() {
  return (
    <>
      <PageHeader
        title="New channel"
        backLink={{ href: CHANNELS_HREF, label: CHANNELS_PAGE.title }}
      />
      <VendorForm />
    </>
  );
}
