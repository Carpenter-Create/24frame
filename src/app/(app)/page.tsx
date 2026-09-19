import { redirect } from "next/navigation";

import { AUTH_DEFAULT_NEXT } from "@/lib/auth-callback-next";

// Signed-in default land is /home (AUTH_DEFAULT_NEXT). `/` hops to
// that SoT — not Aggregation dashboard.
export default function SignedInRootPage() {
  redirect(AUTH_DEFAULT_NEXT);
}
