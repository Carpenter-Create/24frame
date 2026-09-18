import { PRODUCT_NAME } from "@/lib/product";
import { SOCIAL_ROUTES } from "@/lib/social";
import type { createClient } from "@/lib/supabase/server";
import { loadProfilesByIds, type SocialProfileRow } from "@/lib/social-feed";

// Window parse, top-N, and kill-switch helpers measured from donor
// apps/web/app/leaderboard/page.tsx + packages/shared/src/leaderboard.ts.
// Reimplemented here. Do not add the donor shared package.

export const LEADERBOARD_WINDOWS = ["7d", "30d", "all"] as const;
export type LeaderboardWindow = (typeof LEADERBOARD_WINDOWS)[number];
export const DEFAULT_LEADERBOARD_WINDOW: LeaderboardWindow = "7d";
export const LEADERBOARD_TOP_N = 10;

export const LEADERBOARD_WINDOW_LABELS: Record<LeaderboardWindow, string> = {
  "7d": "7 days",
  "30d": "30 days",
  all: "All time",
};

export type LeaderboardKillSwitches = {
  leaderboard_public: boolean;
  gamification_enabled: boolean;
};

export function parseLeaderboardWindow(
  raw: string | string[] | null | undefined,
): LeaderboardWindow {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "30d" || value === "all" || value === "7d") return value;
  return DEFAULT_LEADERBOARD_WINDOW;
}

export function isLeaderboardPublic(
  settings: LeaderboardKillSwitches | null | undefined,
): boolean {
  return !!settings?.leaderboard_public && !!settings?.gamification_enabled;
}

export function leaderboardHref(window: LeaderboardWindow): string {
  return `${SOCIAL_ROUTES.leaderboard}?window=${window}`;
}

export function formatLeaderboardComputedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function formatLeaderboardPct(pct: string | number): string {
  const n = typeof pct === "number" ? pct : Number(pct);
  if (!Number.isFinite(n)) return "0%";
  return `${n.toFixed(2)}%`;
}

export type LeaderboardEntryRow = {
  window: string;
  user_id: string;
  rank: number;
  points: number;
  computed_at: string;
};

export type LevelDistributionRow = {
  level: number;
  member_count: number;
  pct: string | number;
  computed_at: string;
};

export type LeaderboardBoard = {
  window: LeaderboardWindow;
  visible: boolean;
  top: LeaderboardEntryRow[];
  you: LeaderboardEntryRow | null;
  profiles: Map<string, SocialProfileRow>;
  levels: { level: number; title: string | null; member_count: number; pct: string | number }[];
  computedAt: string | null;
};

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export async function loadLeaderboardBoard(
  supabase: ServerClient,
  rawWindow: string | string[] | null | undefined,
  userId: string,
): Promise<LeaderboardBoard> {
  const window = parseLeaderboardWindow(rawWindow);
  const { data: settings } = await supabase
    .from("app_settings")
    .select("leaderboard_public, gamification_enabled")
    .eq("id", true)
    .maybeSingle();

  const visible = isLeaderboardPublic(settings);
  if (!visible) {
    return {
      window,
      visible: false,
      top: [],
      you: null,
      profiles: new Map(),
      levels: [],
      computedAt: null,
    };
  }

  const { data: topRows } = await supabase
    .from("leaderboard_entries")
    .select("window, user_id, rank, points, computed_at")
    .eq("window", window)
    .order("rank", { ascending: true })
    .limit(LEADERBOARD_TOP_N);

  const { data: youRow } = await supabase
    .from("leaderboard_entries")
    .select("window, user_id, rank, points, computed_at")
    .eq("window", window)
    .eq("user_id", userId)
    .maybeSingle();

  const { data: distRows } = await supabase
    .from("level_distribution")
    .select("level, member_count, pct, computed_at")
    .order("level", { ascending: true });

  const { data: levelRows } = await supabase
    .from("levels")
    .select("level, title")
    .order("level", { ascending: true });

  const top = (topRows ?? []) as LeaderboardEntryRow[];
  const you = (youRow as LeaderboardEntryRow | null) ?? null;
  const dist = (distRows ?? []) as LevelDistributionRow[];
  const titles = new Map((levelRows ?? []).map((row) => [row.level, row.title]));

  const profiles = await loadProfilesByIds(supabase, [
    ...new Set([...top.map((row) => row.user_id), ...(you ? [you.user_id] : [])]),
  ]);

  const computedAt =
    top[0]?.computed_at ?? you?.computed_at ?? dist[0]?.computed_at ?? null;

  return {
    window,
    visible: true,
    top,
    you,
    profiles,
    levels: dist.map((row) => ({
      level: row.level,
      title: titles.get(row.level) ?? null,
      member_count: row.member_count,
      pct: row.pct,
    })),
    computedAt,
  };
}

export function leaderboardCopyUsesProductName(text: string): boolean {
  return text.includes(PRODUCT_NAME);
}
