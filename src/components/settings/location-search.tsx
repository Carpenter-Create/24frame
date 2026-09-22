"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearProfileLocation,
  saveProfileLocation,
  searchProfilePlaces,
} from "@/app/(app)/settings/preferences/location/actions";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  composeLocationLabel,
  LOCATION,
  placeKey,
  type LocationPlace,
  type ProfileLocation,
} from "@/lib/location";
import { SETTINGS_CONTENT_MEASURE_CLASS } from "@/lib/settings";

// Location drill. One search field. Results are selectable places.
// Select writes city / region / country. Remove clears all three.
// Phone stacks the label — no truncation.

export function LocationSearch({ initial }: { initial: ProfileLocation }) {
  const router = useRouter();
  const [location, setLocation] = useState(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationPlace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef(0);
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
    router.refresh();
  }

  const showEmpty = query.trim().length >= LOCATION.searchMin && !searching && results.length === 0;

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
      <p
        data-location-current=""
        className={label ? "t-body break-words text-ink" : "t-body break-words text-ink-3"}
      >
        {label || LOCATION.empty}
      </p>
      {label ? (
        <Button
          type="button"
          variant="secondary"
          data-location-clear=""
          disabled={pending}
          onClick={() => {
            void clearLocation();
          }}
          className="w-full justify-start whitespace-normal text-left md:w-auto"
        >
          {LOCATION.clear}
        </Button>
      ) : null}
      <Input
        type="search"
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={results.length > 0 ? "location-results" : undefined}
        aria-autocomplete="list"
        aria-label={LOCATION.searchLabel}
        placeholder={LOCATION.searchPlaceholder}
        value={query}
        disabled={pending}
        autoComplete="off"
        data-location-search=""
        onChange={(event) => {
          onQuery(event.target.value);
        }}
      />
      {showEmpty ? (
        <p data-location-empty="" className="t-body-sm break-words text-ink-3">
          {LOCATION.noMatches}
        </p>
      ) : null}
      {results.length > 0 ? (
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
                className="flex w-full break-words py-[var(--space-3)] text-left t-body whitespace-normal text-ink"
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
