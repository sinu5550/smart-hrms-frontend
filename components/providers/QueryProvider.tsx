'use client';

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes stale time: Instant instant navigation & switching across pages without re-fetching
            gcTime: 1000 * 60 * 30, // 30 minutes in memory cache retention
            refetchOnMount: false, // Serve from cache immediately when navigating across pages (super fast experience)
            refetchOnReconnect: true, // Auto revalidate when network reconnects
            refetchOnWindowFocus: false, // Keep disabled to prevent unwanted background flickering
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
