"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  applyResolvedTheme,
  preferenceFromStorage,
  resolveTheme,
  subscribeThemePreference,
  themePreferenceSnapshot,
  type ThemePreference,
} from "@/lib/theme";

// gc-theme preference for the shared Theme picker. ThemeSync keeps
// Auto aligned with the OS. No second store. Header sun/moon is
// gone — Auto changes only in AppearanceThemePicker.

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
