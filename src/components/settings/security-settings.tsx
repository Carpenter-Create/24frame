import { HouseEmpty } from "@/components/chrome/house";
import { cn } from "@/lib/cn";
import {
  SECURITY_EVENT_LABELS,
  SECURITY_HISTORY_COLUMNS,
  SECURITY_PAGE,
  SECURITY_PILL_BASE_CLASS,
  SECURITY_PILL_CLASSES,
  securityEventPillTone,
  type SecurityEventKind,
} from "@/lib/security-events";
import {
  SETTINGS_PANE_CLASS,
  SETTINGS_PANE_TITLE_CLASS,
  SETTINGS_SECTION_CLASS,
} from "@/lib/settings";

export type SecurityEventRow = {
  id: string;
  occurred_at: string;
  event_kind: SecurityEventKind;
  actor_name: string | null;
  source_label: string | null;
  ip: string | null;
  country: string | null;
};

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function formatEventDate(iso: string): string {
  try {
    return DATE_FMT.format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatIp(ip: string | null, country: string | null): string {
  if (!ip) return "—";
  if (country) return `${ip} (${country})`;
  return ip;
}

export function SecuritySettings({ events }: { events: SecurityEventRow[] }) {
  return (
    <div data-settings-page="" data-settings-hub="security" className={SETTINGS_PANE_CLASS}>
      <section data-settings-section="security" className={SETTINGS_SECTION_CLASS}>
        <h1 className={SETTINGS_PANE_TITLE_CLASS}>{SECURITY_PAGE.title}</h1>
        <p className="t-body-sm text-ink-3">{SECURITY_PAGE.subtitle}</p>
        {events.length === 0 ? (
          <HouseEmpty>{SECURITY_PAGE.emptyState}</HouseEmpty>
        ) : (
          <div className="overflow-x-auto">
            <table data-security-history="" className="w-full text-left">
              <thead>
                <tr className="border-b border-hairline">
                  {SECURITY_HISTORY_COLUMNS.map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap px-[var(--space-3)] py-[var(--space-3)] t-body-sm font-medium text-ink-3"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const tone = securityEventPillTone(ev.event_kind);
                  return (
                    <tr
                      key={ev.id}
                      className="border-b border-hairline last:border-b-0"
                    >
                      <td className="whitespace-nowrap px-[var(--space-3)] py-[var(--space-3)] t-body-sm text-ink">
                        {formatEventDate(ev.occurred_at)}
                      </td>
                      <td className="px-[var(--space-3)] py-[var(--space-3)] t-body-sm text-ink">
                        {ev.actor_name ?? "—"}
                      </td>
                      <td className="px-[var(--space-3)] py-[var(--space-3)]">
                        <span
                          className={cn(
                            SECURITY_PILL_BASE_CLASS,
                            SECURITY_PILL_CLASSES[tone],
                          )}
                        >
                          {SECURITY_EVENT_LABELS[ev.event_kind]}
                        </span>
                      </td>
                      <td className="px-[var(--space-3)] py-[var(--space-3)] t-body-sm text-ink-2">
                        {ev.source_label ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-[var(--space-3)] py-[var(--space-3)] t-body-sm text-ink-2">
                        {formatIp(ev.ip, ev.country)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
