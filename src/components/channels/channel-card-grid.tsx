import type { ReactNode } from "react";

import { CHANNEL_GRID_CLASS } from "@/lib/channel-card";

export function ChannelCardGrid({ children }: { children: ReactNode }) {
  return (
    <div data-channels-grid="" className={CHANNEL_GRID_CLASS}>
      {children}
    </div>
  );
}
