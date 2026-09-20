import { QueryClient } from "@tanstack/react-query";

import { SOCIAL_QUERY_STALE_MS } from "@/lib/social-cache-keys";

// One SoT QueryClient factory. Social profile / counts / follow use this
// staleTime (30–60s). Do not construct a second default set elsewhere.

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: SOCIAL_QUERY_STALE_MS,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
