/**
 * PWA Utility Functions
 * Helper functions for PWA features and native-like behavior
 * 
 * NOTE: These functions are web-only and should not be used in native apps
 */

import { Platform } from 'react-native';

/**
 * Check if the app is running in standalone mode (installed as PWA)
 */
export const isStandalone = (): boolean => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
    
    // Check for standalone mode on various platforms
    return (
        (window.matchMedia('(display-mode: standalone)').matches) ||
        ((window.navigator as any).standalone === true) ||
        document.referrer.includes('android-app://')
    );
};

/**
 * Get the safe area insets for notched devices
 */
export const getSafeAreaInsets = () => {
    if (typeof window === 'undefined') {
        return { top: 0, bottom: 0, left: 0, right: 0 };
    }

    const style = getComputedStyle(document.documentElement);
    
    return {
        top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
        bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
        left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0', 10),
        right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0', 10),
    };
};

/**
 * Prevent default pull-to-refresh behavior
 */
export const preventPullToRefresh = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    let lastTouchY = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e: TouchEvent) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', (e: TouchEvent) => {
        const touchY = e.touches[0].clientY;
        const touchYDelta = touchY - touchStartY;
        lastTouchY = touchY;

        // Prevent pull-to-refresh when scrolling up from the top
        if (window.scrollY === 0 && touchYDelta > 0) {
            e.preventDefault();
        }
    }, { passive: false });
};

/**
 * Hide browser address bar on mobile
 */
export const hideAddressBar = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Only run on mobile devices
    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return;
    }

    // Scroll to top to hide address bar
    window.scrollTo(0, 1);
    
    // Prevent scroll bounce on iOS
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
};

/**
 * Register service worker update notification
 */
export const registerServiceWorkerUpdate = (callback: () => void) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
    }

    (navigator.serviceWorker as ServiceWorkerContainer).addEventListener('controllerchange', () => {
        callback();
    });
};

/**
 * Request persistent storage (for better offline experience)
 */
export const requestPersistentStorage = async (): Promise<boolean> => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('storage' in navigator)) {
        return false;
    }

    try {
        const storage = (navigator as any).storage;
        if (storage && storage.persist) {
            const isPersistent = await storage.persist();
            return isPersistent;
        }
    } catch (error) {
        console.warn('Persistent storage not available:', error);
    }

    return false;
};
