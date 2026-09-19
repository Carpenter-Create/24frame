"use client";

import { useState } from "react";

import { InlineNotice } from "@/components/ui/inline-notice";
import { cn } from "@/lib/cn";
import {
  NOTIFICATION_PREF_CHANNEL_CLASS,
  NOTIFICATION_PREF_CHANNELS,
  NOTIFICATION_PREF_EVENTS,
  NOTIFICATION_PREF_HEAD_CLASS,
  NOTIFICATION_PREF_MATRIX_CLASS,
  NOTIFICATION_PREF_ROW_CLASS,
  NOTIFICATION_PREF_SWITCH_OFF_CLASS,
  NOTIFICATION_PREF_SWITCH_ON_CLASS,
  NOTIFICATION_PREF_SWITCH_THUMB_CLASS,
  NOTIFICATION_PREF_SWITCH_THUMB_OFF_CLASS,
  NOTIFICATION_PREF_SWITCH_THUMB_ON_CLASS,
  NOTIFICATION_PREF_SWITCH_TRACK_CLASS,
  NOTIFICATION_PREFS,
  isNotificationChannelOn,
  withNotificationPref,
  type NotificationPrefChannel,
  type NotificationPrefEvent,
  type NotificationPrefs,
} from "@/lib/notification-prefs";
import { SETTINGS_SECTION_CLASS } from "@/lib/settings";
import { saveNotificationPref } from "@/app/(app)/settings/preferences/actions";

function PrefSwitch({
  event,
  channel,
  on,
  disabled,
  onToggle,
}: {
  event: NotificationPrefEvent;
  channel: NotificationPrefChannel;
  on: boolean;
  disabled: boolean;
  onToggle: (event: NotificationPrefEvent, channel: NotificationPrefChannel, enabled: boolean) => void;
}) {
  const label = channel === "in_app" ? NOTIFICATION_PREFS.inApp : NOTIFICATION_PREFS.email;
  return (
    <span className={NOTIFICATION_PREF_CHANNEL_CLASS}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`${NOTIFICATION_PREFS.events[event]} ${label}`}
        data-settings-notification-switch={`${event}:${channel}`}
        disabled={disabled}
        onClick={() => {
          onToggle(event, channel, !on);
        }}
        className={cn(
          NOTIFICATION_PREF_SWITCH_TRACK_CLASS,
          on ? NOTIFICATION_PREF_SWITCH_ON_CLASS : NOTIFICATION_PREF_SWITCH_OFF_CLASS,
        )}
      >
        <span
          className={cn(
            NOTIFICATION_PREF_SWITCH_THUMB_CLASS,
            on ? NOTIFICATION_PREF_SWITCH_THUMB_ON_CLASS : NOTIFICATION_PREF_SWITCH_THUMB_OFF_CLASS,
          )}
        />
      </button>
    </span>
  );
}

export function NotificationPreferences({
  initialPrefs,
}: {
  initialPrefs: NotificationPrefs;
}) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onToggle(
    event: NotificationPrefEvent,
    channel: NotificationPrefChannel,
    enabled: boolean,
  ) {
    const previous = prefs;
    setPrefs(withNotificationPref(prefs, event, channel, enabled));
    setSaving(true);
    setError("");
    const res = await saveNotificationPref({ event, channel, enabled });
    setSaving(false);
    if (res.error) {
      setPrefs(previous);
      setError(res.error);
      return;
    }
    if (res.prefs) setPrefs(res.prefs);
  }

  return (
    <section data-settings-section="notifications" className={SETTINGS_SECTION_CLASS}>
      <h3 className="t-section text-ink">{NOTIFICATION_PREFS.title}</h3>
      <p className="t-body-sm text-ink-3">{NOTIFICATION_PREFS.helper}</p>
      <div data-settings-notification-matrix="" className={NOTIFICATION_PREF_MATRIX_CLASS}>
        <div className={NOTIFICATION_PREF_HEAD_CLASS}>
          <span />
          {NOTIFICATION_PREF_CHANNELS.map((channel) => (
            <span key={channel} className={NOTIFICATION_PREF_CHANNEL_CLASS}>
              {channel === "in_app" ? NOTIFICATION_PREFS.inApp : NOTIFICATION_PREFS.email}
            </span>
          ))}
        </div>
        {NOTIFICATION_PREF_EVENTS.map((event) => (
          <div
            key={event}
            data-settings-notification-row={event}
            className={NOTIFICATION_PREF_ROW_CLASS}
          >
            <span>{NOTIFICATION_PREFS.events[event]}</span>
            {NOTIFICATION_PREF_CHANNELS.map((channel) => (
              <PrefSwitch
                key={channel}
                event={event}
                channel={channel}
                on={isNotificationChannelOn(prefs, event, channel)}
                disabled={saving}
                onToggle={onToggle}
              />
            ))}
          </div>
        ))}
      </div>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
    </section>
  );
}
