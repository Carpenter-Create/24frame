"use client";

import { useEffect } from "react";

import { persistDashboardSeen } from "@/lib/dashboard-visit";

export function DashboardVisitStamp({ nowIso }: { nowIso: string }) {
  useEffect(() => {
    persistDashboardSeen(new Date(nowIso));
  }, [nowIso]);
  return null;
}
