'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './query-client.config';
import { useState } from 'react';

interface TanStackQueryProviderProps {
  children: React.ReactNode;
}

export function TanStackQueryProvider({ children }: TanStackQueryProviderProps) {
  // Create a new QueryClient instance for each request to avoid sharing state
  const [client] = useState(() => queryClient);

  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
