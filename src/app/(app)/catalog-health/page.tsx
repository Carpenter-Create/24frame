import { redirect } from "next/navigation";

import { ATTENTION_HREF } from "@/lib/findings";

// Former Catalog Health door. Findings live at /attention.
export default function CatalogHealthRedirectPage() {
  redirect(ATTENTION_HREF);
}
