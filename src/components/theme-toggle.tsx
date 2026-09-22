"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

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
import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import { HOUSE_HEADER_TRAILING_ICON_CLASS } from "@/lib/house-phone-shell";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

// Reads the live `.dark` class on <html>. Light is the default base; the
// no-flash script in layout.tsx applies a stored `gc-theme` before paint.
//
// State is read straight from the DOM via useSyncExternalStore (no setState in
// an effect): a MutationObserver on <html>'s class keeps the glyph in sync,
// and getServerSnapshot returns "light" to match SSR (the class is only added
// on the client), avoiding hydration mismatch.

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

export function ThemeGlyph({ className = PHOSPHOR_CHROME_ICON_CLASS }: { className?: string }) {
  // Veritytuner IA only: sun while dark (tap → light), moon while
  // light (tap → dark). House Phosphor Bold fill — not a stroke SVG.
  const showSun = useTheme() === "dark";
  const Glyph = showSun ? Sun : Moon;

  return (
    <Glyph
      data-theme-glyph={showSun ? "sun" : "moon"}
      className={className}
      weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
      aria-hidden="true"
    />
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
      <ThemeGlyph className={HOUSE_HEADER_TRAILING_ICON_CLASS} />
    </button>
  );
}
