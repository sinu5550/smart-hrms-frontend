'use client';

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // Immediately consider data stale so any cache invalidation triggers instant revalidation
            refetchOnMount: true, // Always revalidate fresh data when entering a page or viewing records
            refetchOnReconnect: true, // Auto revalidate when network reconnects
            refetchOnWindowFocus: false, // Keep disabled to prevent unwanted background flickering
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
