import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store/auth-store';
import { db } from '../utils/indexeddb';
import { useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : 'http://localhost:3001/api/v1';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const session = useAuthStore((state) => state.session);
  const queryClient = useQueryClient();

  // Process offline queue
  const syncQueue = useCallback(async () => {
    if (!isOnline || !session?.access_token || isSyncing) return;

    setIsSyncing(true);
    try {
      const pendingMutations = await db.mutations
        .where('status')
        .equals('pending')
        .sortBy('createdAt');

      if (pendingMutations.length === 0) return;

      console.log(`[Sync] Found ${pendingMutations.length} pending mutations. Syncing...`);

      const CHUNK_SIZE = 50;
      let currentIndex = 0;
      let hasSuccessfulSync = false;

      while (currentIndex < pendingMutations.length) {
        if (!navigator.onLine) {
          console.warn('[Sync] Network dropped mid-sync. Aborting remaining chunks.');
          break;
        }

        const chunk = pendingMutations.slice(currentIndex, currentIndex + CHUNK_SIZE);

        try {
          const response = await fetch(`${API_URL}/sync/bulk`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ mutations: chunk }),
          });

          if (!response.ok) {
            throw new Error(`Bulk sync chunk failed with status ${response.status}`);
          }

          interface SyncResult {
            id: string;
            status: 'success' | 'failed';
            error?: string;
          }
          const resData = (await response.json()) as { success: boolean; results: SyncResult[] };

          if (!resData.success || !resData.results) {
            throw new Error('Bulk sync payload invalid');
          }

          const successfulIds = resData.results
            .filter((r) => r.status === 'success')
            .map((r) => r.id);
          const failedResults = resData.results.filter((r) => r.status === 'failed');

          // 1. Delete successful mutations
          if (successfulIds.length > 0) {
            await db.mutations.bulkDelete(successfulIds);
            hasSuccessfulSync = true;
          }

          // 2. Handle failed mutations
          if (failedResults.length > 0) {
            for (const failure of failedResults) {
              const mut = chunk.find((m) => m.id === failure.id);
              if (mut) {
                const newRetryCount = (mut.retryCount || 0) + 1;
                if (newRetryCount >= 3) {
                  await db.mutations.update(mut.id, {
                    status: 'failed',
                    retryCount: newRetryCount,
                  });
                  console.error(`[Sync] Mutation ${mut.id} permanently failed: ${failure.error}`);
                } else {
                  await db.mutations.update(mut.id, { retryCount: newRetryCount });
                }
              }
            }
          }

          console.log(`[Sync] Successfully synced chunk ${currentIndex / CHUNK_SIZE + 1}.`);
          currentIndex += CHUNK_SIZE;
        } catch (chunkErr) {
          console.error(`[Sync] Failed to process chunk starting at ${currentIndex}:`, chunkErr);
          break; // Stop processing further chunks if one fails (usually network issue)
        }
      }

      // Invalidate relevant queries only if something succeeded
      if (hasSuccessfulSync) {
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['budgets'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
      }

      console.log(`[Sync] Finished processing queue.`);
    } catch (err) {
      console.error('[Sync] Failed to process queue', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, session?.access_token, queryClient, isSyncing]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        syncQueue();
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Attempt to sync on startup if online
      if (navigator.onLine) {
        syncQueue();
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [syncQueue]);

  return { isOnline, isSyncing, syncQueue };
}
