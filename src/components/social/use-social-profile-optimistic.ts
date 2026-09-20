"use client";

import { useSyncExternalStore } from "react";

import {
  getSocialProfileOptimisticServerSnapshot,
  readSocialProfileOptimistic,
  subscribeSocialProfileOptimistic,
} from "@/lib/social-profile-edit";

export function useSocialProfileOptimistic() {
  return useSyncExternalStore(
    subscribeSocialProfileOptimistic,
    readSocialProfileOptimistic,
    getSocialProfileOptimisticServerSnapshot,
  );
}
