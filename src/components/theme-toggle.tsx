"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import {
  HOUSE_HEADER_TRAILING_DESKTOP_CLASS,
  HOUSE_HEADER_TRAILING_PHONE_CLASS,
  HOUSE_PHONE_CHROME_ICON_WEIGHT,
} from "@/lib/house-phone-shell";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import {
  applyResolvedTheme,
  preferenceFromStorage,
  resolveTheme,
  subscribeThemePreference,
  themeFromRoot,
  themePreferenceSnapshot,
  themeToggleLabel,
  toggleDocumentTheme,
  type Theme,
  type ThemePreference,
} from "@/lib/theme";

// gc-theme preference for the Theme page. Header sun/moon flips the
// resolved mode and exits Auto. ThemeSync keeps Auto aligned with
// the OS. No second store.

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return themeFromRoot(document.documentElement);
}

function getServerSnapshot(): Theme {
  return "light";
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function getPreferenceServerSnapshot(): ThemePreference {
  return "light";
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(
    subscribeThemePreference,
    themePreferenceSnapshot,
    getPreferenceServerSnapshot,
  );
}

// Keeps Auto in sync with the OS after first paint. The no-flash script
// already applied the resolved class. Light/dark writes do not listen.
export function ThemeSync() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      let storage: Storage | null = null;
      try {
        storage = localStorage;
      } catch {
        storage = null;
      }
      const preference = preferenceFromStorage(storage);
      if (preference !== "auto") return;
      applyResolvedTheme(resolveTheme("auto", media.matches), document.documentElement);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return null;
}

export function ThemeGlyph() {
  // Sun while the resolved mode is dark (tap → light). Moon while
  // light (tap → dark). Phone 24 / desktop 20 — the header trailing
  // SoT. The stored value after a tap is explicit.
  const showSun = useTheme() === "dark";
  const Glyph = showSun ? Sun : Moon;
  const glyph = showSun ? "sun" : "moon";

  return (
    <>
      <Glyph
        data-theme-glyph={glyph}
        className={HOUSE_HEADER_TRAILING_PHONE_CLASS}
        weight={HOUSE_PHONE_CHROME_ICON_WEIGHT}
        aria-hidden="true"
      />
      <Glyph
        data-theme-glyph={glyph}
        className={HOUSE_HEADER_TRAILING_DESKTOP_CLASS}
        weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
        aria-hidden="true"
      />
    </>
  );
}

export function ThemeToggle() {
  const theme = useTheme();

  return (
    <button
      type="button"
      data-theme-toggle=""
      aria-label={themeToggleLabel(theme)}
      aria-pressed={theme === "dark"}
      onClick={() => {
        toggleDocumentTheme();
      }}
      className={HOUSE_THEME_TOGGLE_CLASS}
    >
      <ThemeGlyph />
    </button>
  );
}
