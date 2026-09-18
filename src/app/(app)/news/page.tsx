import { redirect } from "next/navigation";

import { NEWS_HREF } from "@/lib/news";

// Former News door. History lives at /home/news (Home-owned).
export default function NewsLegacyRedirectPage() {
  redirect(NEWS_HREF);
}
