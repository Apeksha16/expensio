import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Get existing subscription
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  const subscribe = async () => {
    if (!isSupported) return;

    try {
      const reg = await navigator.serviceWorker.ready;

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        setSubscription(sub);

        const session = useAuthStore.getState().session;
        if (session?.access_token) {
          await fetch(`${API_URL}/api/v1/push/subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ subscription: sub.toJSON() }),
          });
        }
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  const unsubscribe = async () => {
    if (!isSupported || !subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      const session = useAuthStore.getState().session;
      if (session?.access_token) {
        await fetch(`${API_URL}/api/v1/push/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed: !!subscription,
    subscribe,
    unsubscribe,
  };
}
