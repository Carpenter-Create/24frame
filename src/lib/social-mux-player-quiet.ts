// Media Chrome warns "No style sheet found on style tag" when a control's
// connectedCallback runs while that control is still disconnected. mux-player
// does that if playback, stream, poster, muted, preload, or style are set
// before the element is in the document — React applies those during
// createElement, before append. Class and playsinline do not. Append first,
// then assign the rest.

export type QuietMuxTokens = {
  playback: string;
  thumbnail: string;
  storyboard: string;
};

// House tokens from playerStyle. Other CSS names and values never reach setProperty.
export type QuietMuxPlayerStyle = {
  readonly aspectRatio: "auto";
  readonly width: "100%";
  readonly height: "100%";
  readonly objectFit: "cover" | "contain";
  readonly "--controls"?: "none";
};

const QUIET_MUX_PLAYER_STYLE_KEYS = ["aspectRatio", "width", "height", "objectFit", "--controls"] as const;

const QUIET_MUX_PLAYER_STYLE_VALUES = {
  aspectRatio: ["auto"],
  width: ["100%"],
  height: ["100%"],
  objectFit: ["cover", "contain"],
  "--controls": ["none"],
} as const satisfies {
  readonly [K in keyof QuietMuxPlayerStyle]-?: readonly NonNullable<QuietMuxPlayerStyle[K]>[];
};

export type QuietMuxPlayerProps = {
  playbackId: string;
  streamType: "on-demand";
  preload: "metadata";
  poster: string;
  autoPlay: boolean;
  muted: boolean;
  tokens?: QuietMuxTokens;
  style: QuietMuxPlayerStyle;
  onLoadedData?: () => void;
};

export type QuietMuxPlayerElement = {
  isConnected: boolean;
  className: string;
  playbackId: string;
  streamType: string;
  preload: string;
  poster: string;
  muted: boolean;
  autoplay: boolean;
  tokens?: QuietMuxTokens;
  style: { setProperty(name: string, value: string): void };
  setAttribute(name: string, value: string): void;
  addEventListener(type: "loadeddata", listener: () => void): void;
  removeEventListener(type: "loadeddata", listener: () => void): void;
  remove(): void;
};

export type QuietMuxHost = {
  appendChild(player: QuietMuxPlayerElement): void;
};

export const QUIET_MUX_PLAYER_CLASS = "size-full object-cover";

export function cssPropertyName(name: string): string {
  if (name.startsWith("--")) return name;
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function mountQuietMuxPlayer(
  host: QuietMuxHost,
  create: () => QuietMuxPlayerElement,
  props: QuietMuxPlayerProps,
): QuietMuxPlayerElement {
  const player = create();
  player.className = QUIET_MUX_PLAYER_CLASS;
  player.setAttribute("playsinline", "");
  host.appendChild(player);
  assignConnectedMuxPlayer(player, props);
  return player;
}

export function assignConnectedMuxPlayer(
  player: QuietMuxPlayerElement,
  props: QuietMuxPlayerProps,
): void {
  if (!player.isConnected) {
    throw new Error("Mux player fields are assigned after the element is connected");
  }
  player.playbackId = props.playbackId;
  player.streamType = props.streamType;
  player.preload = props.preload;
  player.poster = props.poster;
  player.muted = props.muted;
  player.autoplay = props.autoPlay;
  if (props.tokens) player.tokens = props.tokens;
  applyQuietMuxPlayerStyle(player, props.style);
  if (props.onLoadedData) player.addEventListener("loadeddata", props.onLoadedData);
}

function applyQuietMuxPlayerStyle(player: QuietMuxPlayerElement, style: QuietMuxPlayerStyle): void {
  for (const name of QUIET_MUX_PLAYER_STYLE_KEYS) {
    const value = style[name];
    if (value === undefined) continue;
    if (!(QUIET_MUX_PLAYER_STYLE_VALUES[name] as readonly string[]).includes(value)) continue;
    player.style.setProperty(cssPropertyName(name), value);
  }
}
