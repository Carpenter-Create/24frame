import type { ReactNode } from "react";
import Link from "next/link";

import { StatusChip } from "@/components/layout/status-chip";
import {
  CHANNEL_DETAIL_LAYOUT_CLASS,
  CHANNEL_DETAIL_META_CLASS,
  CHANNEL_DETAIL_RAIL_CLASS,
  CHANNEL_DETAIL_RAIL_PLATE_CLASS,
  CHANNEL_DETAIL_SECTION_TITLE_CLASS,
  CHANNEL_DETAIL_STACK_CLASS,
  CHANNEL_DETAIL_STORY_CLASS,
  CHANNELS_HREF,
} from "@/lib/channel-card";
import { directoryInitials } from "@/lib/staff-directory";
import { VENDOR_MODE_LABELS } from "@/lib/vendors-directory";
import {
  VENDOR_PROFILE,
  VENDOR_PROFILE_FIELD_LABELS,
  vendorEditHref,
  type ChannelTerritory,
  type VendorLicensedTitle,
  type VendorProfileRecord,
} from "@/lib/vendor-profile";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-[var(--space-3)]">
      <h2 className={CHANNEL_DETAIL_SECTION_TITLE_CLASS}>{title}</h2>
      {children}
    </section>
  );
}

function RailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[var(--space-1)]">
      <dt className={CHANNEL_DETAIL_META_CLASS}>{label}</dt>
      <dd className="t-body text-ink">{children}</dd>
    </div>
  );
}

export function ChannelDetail({
  channel,
  overview,
  companyFields,
  territories,
  catalog,
  truncatedNotice,
}: {
  channel: VendorProfileRecord;
  overview: string | null;
  companyFields: readonly { label: string; value: string }[];
  territories: readonly ChannelTerritory[];
  catalog: readonly VendorLicensedTitle[];
  truncatedNotice?: string | null;
}) {
  const contacts: { label: string; value: string }[] = [];
  if (channel.emailTo.length > 0) {
    contacts.push({
      label: VENDOR_PROFILE_FIELD_LABELS.emailTo,
      value: channel.emailTo.join(", "),
    });
  }
  if (channel.emailCc.length > 0) {
    contacts.push({
      label: VENDOR_PROFILE_FIELD_LABELS.emailCc,
      value: channel.emailCc.join(", "),
    });
  }
  const opsNotes = channel.emailTemplate?.trim() || null;

  return (
    <div data-channel-detail="" className={CHANNEL_DETAIL_STACK_CLASS}>
      <div className="flex items-start justify-between gap-[var(--space-4)]">
        <nav className={CHANNEL_DETAIL_META_CLASS} aria-label="Breadcrumb">
          <Link href={CHANNELS_HREF} className="transition-colors hover:text-ink">
            {VENDOR_PROFILE.breadcrumb}
          </Link>
          <span aria-hidden> › </span>
          <span className="text-ink">{channel.name}</span>
        </nav>
        <Link
          href={vendorEditHref(channel.id)}
          className="t-body-sm text-accent transition-colors hover:underline"
        >
          {VENDOR_PROFILE.editVendor}
        </Link>
      </div>

      <div className={CHANNEL_DETAIL_LAYOUT_CLASS}>
        <div data-channel-story="" className={CHANNEL_DETAIL_STORY_CLASS}>
          <header className="flex flex-col gap-[var(--space-2)]">
            <h1 className="t-title text-ink">{channel.name}</h1>
            <p className={CHANNEL_DETAIL_META_CLASS}>
              {VENDOR_MODE_LABELS[channel.deliveryMode]}
              {channel.active ? "" : " · inactive"}
            </p>
          </header>

          {overview ? (
            <Section title={VENDOR_PROFILE.overviewTitle}>
              <p className="t-body text-ink whitespace-pre-wrap">{overview}</p>
            </Section>
          ) : null}

          {opsNotes ? (
            <Section title={VENDOR_PROFILE.opsTitle}>
              <p className="t-body text-ink whitespace-pre-wrap">{opsNotes}</p>
            </Section>
          ) : null}

          <Section title={VENDOR_PROFILE.catalogTitle}>
            {truncatedNotice ? (
              <p className={CHANNEL_DETAIL_META_CLASS}>{truncatedNotice}</p>
            ) : null}
            {catalog.length === 0 ? (
              <p className={CHANNEL_DETAIL_META_CLASS}>{VENDOR_PROFILE.catalogEmpty}</p>
            ) : (
              <ul data-channel-licensed-catalog="" className="flex flex-col">
                {catalog.map((title) => (
                  <li key={title.titleId} className="border-b border-hairline last:border-b-0">
                    <Link
                      href={title.href}
                      className="flex flex-col gap-[2px] py-[var(--space-3)] transition-colors hover:text-accent"
                    >
                      <span className="t-body font-medium text-ink">{title.title}</span>
                      {title.secondary ? (
                        <span className={CHANNEL_DETAIL_META_CLASS}>{title.secondary}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <aside data-channel-rail="" className={CHANNEL_DETAIL_RAIL_CLASS}>
          <div data-channel-rail-plate="" className={CHANNEL_DETAIL_RAIL_PLATE_CLASS}>
            {directoryInitials(channel.name)}
          </div>

          <dl className="flex flex-col gap-[var(--space-4)]">
            <RailField label={VENDOR_PROFILE.statusLabel}>
              <StatusChip
                label={channel.active ? "Active" : "Inactive"}
                tone={channel.active ? "active" : "muted"}
              />
            </RailField>
            <RailField label={VENDOR_PROFILE.deliveryLabel}>
              {VENDOR_MODE_LABELS[channel.deliveryMode]}
            </RailField>
            {contacts.length > 0 ? (
              <div className="flex flex-col gap-[var(--space-3)]">
                <dt className={CHANNEL_DETAIL_SECTION_TITLE_CLASS}>{VENDOR_PROFILE.contactsTitle}</dt>
                {contacts.map((row) => (
                  <RailField key={row.label} label={row.label}>
                    {row.value}
                  </RailField>
                ))}
              </div>
            ) : null}
            {territories.length > 0 ? (
              <div className="flex flex-col gap-[var(--space-2)]">
                <dt className={CHANNEL_DETAIL_SECTION_TITLE_CLASS}>
                  {VENDOR_PROFILE.territoriesTitle}
                </dt>
                <dd className="flex flex-wrap gap-[var(--space-2)]" data-channel-territories="">
                  {territories.map((row) => (
                    <StatusChip key={row.code} label={row.label} tone="neutral" />
                  ))}
                </dd>
              </div>
            ) : null}
            {companyFields.length > 0 ? (
              <div className="flex flex-col gap-[var(--space-3)]">
                <dt className={CHANNEL_DETAIL_SECTION_TITLE_CLASS}>{VENDOR_PROFILE.reservedTitle}</dt>
                {companyFields.map((field) => (
                  <RailField key={`${field.label}:${field.value}`} label={field.label}>
                    {field.value}
                  </RailField>
                ))}
              </div>
            ) : null}
          </dl>
        </aside>
      </div>
    </div>
  );
}
