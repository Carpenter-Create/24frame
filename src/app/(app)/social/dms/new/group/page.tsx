import { SocialDmComposeEmpty, SocialDmComposePicker } from "@/components/social/social-dm-compose-picker";
import { loadDmComposeRoster } from "@/lib/social-dm-compose-roster";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { requireSocialSession } from "@/lib/social-session";

export default async function SocialDmGroupComposePage() {
  const session = await requireSocialSession();
  const profile = await ensureOwnSocialProfile(session.supabase, session.ctx.user);
  if (!profile) return <SocialDmComposeEmpty mode="group" />;
  const people = await loadDmComposeRoster(session.supabase, session.ctx.user.id);
  return <SocialDmComposePicker mode="group" people={people} />;
}
