'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';
import { ReactNode, useState, useEffect } from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';

function OfflineSyncHandler() {
  useOfflineSync();
  return null;
}

export default function QueryProvider({ children }: { children: ReactNode }) {
  // Use useState to ensure QueryClient is not shared between users or reconstructed during hot-reloads
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const [persister, setPersister] = useState<any>(null);

  useEffect(() => {
    // Only run on client
    if (typeof window !== 'undefined') {
      const idbPersister = createAsyncStoragePersister({
        storage: {
          getItem: async (key) => {
            const val = await get(key);
            return val || null;
          },
          setItem: async (key, value) => {
            await set(key, value);
          },
          removeItem: async (key) => {
            await del(key);
          },
        },
      });
      setPersister(idbPersister);
    }
  }, []);

  if (!persister) {
    // Render standard provider while initializing persister to avoid SSR hydration mismatch
    return (
      <QueryClientProvider client={queryClient}>
        <OfflineSyncHandler />
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 48 }} // 48 hours
    >
      <OfflineSyncHandler />
      {children}
    </PersistQueryClientProvider>
  );
}
