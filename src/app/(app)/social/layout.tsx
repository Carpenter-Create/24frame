import { loadSocialSession } from "@/lib/social-session";

// Sync Social segment layout. Stays mounted across /social/* so the
// destination page swaps without tearing down this boundary. Warms the
// request-cached session so Home ↔ Explore ↔ Messages ↔ Profile ↔ Edit
// reuse one auth+client promise instead of starting it in the page.
export default function SocialLayout({ children }: { children: React.ReactNode }) {
  void loadSocialSession();
  return children;
}
