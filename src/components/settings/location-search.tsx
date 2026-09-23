"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "@phosphor-icons/react";

import {
  clearProfileLocation,
  saveProfileLocation,
  searchProfilePlaces,
} from "@/app/(app)/settings/preferences/location/actions";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import {
  FORM_CONTROL_BOX_CLASS,
  FORM_CONTROL_TEXT_CLASS,
  HOUSE_VOICE_MIC_CLASS,
} from "@/lib/form-control";
import {
  composeLocationLabel,
  LOCATION,
  placeKey,
  type LocationPlace,
  type ProfileLocation,
} from "@/lib/location";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { SETTINGS_CONTENT_MEASURE_CLASS } from "@/lib/settings";

// Location drill. One bar.
// Empty: the bar is the search field.
// Selected: the composed place sits in that same bar, with a trailing
// X that clears city, region, and country and returns to search.
// No second stacked value. No separate remove block.
// Phone wraps the label. No ellipsis.

export function LocationSearch({ initial }: { initial: ProfileLocation }) {
  const router = useRouter();
  const [location, setLocation] = useState(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationPlace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [searching, setSearching] = useState(false);
  const [focusNonce, setFocusNonce] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const label = composeLocationLabel(location.city, location.region, location.country);
  const selectedKey =
    location.city && location.region && location.country
      ? placeKey({ city: location.city, region: location.region, country: location.country })
      : "";

  useEffect(() => {
    const pendingTimer = timer;
    const pendingRequest = request;
    return () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      pendingRequest.current += 1;
    };
  }, []);

  useEffect(() => {
    if (focusNonce === 0 || label) return;
    inputRef.current?.focus();
  }, [focusNonce, label]);

  function onQuery(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    const id = ++request.current;
    const q = value.trim();
    if (q.length < LOCATION.searchMin) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(() => {
      void searchProfilePlaces(q)
        .then((rows) => {
          if (request.current !== id) return;
          setResults(rows);
          setSearching(false);
        })
        .catch(() => {
          if (request.current !== id) return;
          setResults([]);
          setSearching(false);
        });
    }, 200);
  }

  async function selectPlace(place: LocationPlace) {
    setPending(true);
    setError(null);
    const res = await saveProfileLocation(place);
    setPending(false);
    if (res.error || !res.location) {
      setError(res.error ?? LOCATION.saveFailed);
      return;
    }
    setLocation(res.location);
    onQuery("");
    router.refresh();
  }

  async function clearLocation() {
    setPending(true);
    setError(null);
    const res = await clearProfileLocation();
    setPending(false);
    if (res.error || !res.location) {
      setError(res.error ?? LOCATION.clearFailed);
      return;
    }
    setLocation(res.location);
    onQuery("");
    setFocusNonce((nonce) => nonce + 1);
    router.refresh();
  }

  const showResults = label.length === 0 && results.length > 0;
  const showEmpty =
    label.length === 0 && query.trim().length >= LOCATION.searchMin && !searching && results.length === 0;

  return (
    <div
      data-location-search-pane=""
      className={`${SETTINGS_CONTENT_MEASURE_CLASS} flex flex-col gap-[var(--space-4)]`}
    >
      {error ? (
        <InlineNotice tone="error" data-location-error="">
          {error}
        </InlineNotice>
      ) : null}
      <div
        data-location-bar=""
        className={cn(
          FORM_CONTROL_BOX_CLASS,
          "flex items-center gap-[var(--space-2)] focus-within:border-ink-3",
        )}
      >
        {label ? (
          <>
            <span
              data-location-value=""
              className={cn(FORM_CONTROL_TEXT_CLASS, "min-w-0 flex-1 break-words whitespace-normal text-left text-ink")}
            >
              {label}
            </span>
            <button
              type="button"
              data-location-clear=""
              aria-label={LOCATION.clear}
              disabled={pending}
              onClick={() => {
                void clearLocation();
              }}
              className={cn(HOUSE_VOICE_MIC_CLASS, "shrink-0")}
            >
              <X className={PHOSPHOR_CHROME_ICON_CLASS} weight={PHOSPHOR_CHROME_IDLE_WEIGHT} aria-hidden />
            </button>
          </>
        ) : (
          <Input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={showResults}
            aria-controls={showResults ? "location-results" : undefined}
            aria-autocomplete="list"
            aria-label={LOCATION.searchLabel}
            placeholder={LOCATION.searchPlaceholder}
            value={query}
            disabled={pending}
            autoComplete="off"
            variant="bare"
            data-location-search=""
            className="min-w-0 w-full flex-1"
            onChange={(event) => {
              onQuery(event.target.value);
            }}
          />
        )}
      </div>
      {showEmpty ? (
        <p data-location-empty="" className="t-body-sm break-words text-ink-3">
          {LOCATION.noMatches}
        </p>
      ) : null}
      {showResults ? (
        <ul id="location-results" role="listbox" aria-label={LOCATION.searchLabel} data-location-results="" className="flex flex-col">
          {results.map((place) => (
            <li key={placeKey(place)}>
              <button
                type="button"
                role="option"
                aria-selected={placeKey(place) === selectedKey}
                data-location-option=""
                disabled={pending}
                onClick={() => {
                  void selectPlace(place);
                }}
                className="flex w-full break-words whitespace-normal py-[var(--space-3)] text-left t-body text-ink"
              >
                {composeLocationLabel(place.city, place.region, place.country)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
