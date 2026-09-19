import { redirect } from "next/navigation";

import { SecuritySettings, type SecurityEventRow } from "@/components/settings/security-settings";
import type { SecurityEventKind } from "@/lib/security-events";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsSecurityPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  if (!ctx.activeOrg) redirect("/settings");

  const supabase = await createClient();

  const { data: rawEvents } = await supabase
    .from("security_events")
    .select("id, occurred_at, event_kind, actor_user_id, source_label, ip, country")
    .eq("org_id", ctx.activeOrg.id)
    .order("occurred_at", { ascending: false })
    .limit(200);

  const events: SecurityEventRow[] = [];
  if (rawEvents && rawEvents.length > 0) {
    const actorIds = [...new Set(
      rawEvents.map((e) => e.actor_user_id).filter(Boolean) as string[],
    )];

    let nameMap = new Map<string, string>();
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", actorIds);
      if (profiles) {
        nameMap = new Map(profiles.map((p) => [p.id, p.display_name]));
      }
    }

    for (const ev of rawEvents) {
      events.push({
        id: ev.id,
        occurred_at: ev.occurred_at,
        event_kind: ev.event_kind as SecurityEventKind,
        actor_name: ev.actor_user_id ? (nameMap.get(ev.actor_user_id) ?? null) : null,
        source_label: ev.source_label,
        ip: ev.ip,
        country: ev.country,
      });
    }
  }

  return <SecuritySettings events={events} />;
}
