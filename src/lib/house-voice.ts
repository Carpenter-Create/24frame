export const HOUSE_VOICE = {
  search: "Search by voice",
  dictate: "Dictate",
  listening: "Listening",
  voice: "Voice",
  stop: "Stop",
} as const;

export type HouseVoiceSurface = "search" | "dictate";

export function houseVoiceTranscriptMode(surface: HouseVoiceSurface): "replace" | "append" {
  return surface === "search" ? "replace" : "append";
}

export function houseVoiceLabel(surface: HouseVoiceSurface): string {
  return surface === "search" ? HOUSE_VOICE.search : HOUSE_VOICE.dictate;
}
