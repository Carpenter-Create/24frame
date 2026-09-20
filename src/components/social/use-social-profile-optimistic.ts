"use client";

import { useSyncExternalStore } from "react";

import {
  getSocialProfileOptimisticServerSnapshot,
  getSocialProfileSaveHopServerSnapshot,
  readSocialProfileOptimistic,
  readSocialProfileSaveHop,
  subscribeSocialProfileOptimistic,
} from "@/lib/social-profile-edit";

export function useSocialProfileOptimistic() {
  return useSyncExternalStore(
    subscribeSocialProfileOptimistic,
    readSocialProfileOptimistic,
    getSocialProfileOptimisticServerSnapshot,
  );
}

export function useSocialProfileSaveHop() {
  return useSyncExternalStore(
    subscribeSocialProfileOptimistic,
    readSocialProfileSaveHop,
    getSocialProfileSaveHopServerSnapshot,
  );
}
