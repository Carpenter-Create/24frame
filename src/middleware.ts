import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Run on everything except static assets, image files, and the web app manifest.
  // The manifest is also on the session-redirect skip list so a direct middleware
  // call cannot turn it into a /login HTML body.
  matcher: [
    "/((?!sentry-tunnel|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
