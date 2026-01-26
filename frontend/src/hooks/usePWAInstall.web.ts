import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Safety check - only run on web
        if (Platform.OS !== 'web' || typeof window === 'undefined') {
            return;
        }

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if running in standalone mode (iOS)
        if ((window.navigator as any).standalone === true) {
            setIsInstalled(true);
            return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const installApp = async (): Promise<boolean> => {
        if (!deferredPrompt) {
            // iOS or already installed
            return false;
        }

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                setIsInstallable(false);
                setDeferredPrompt(null);
                setIsInstalled(true);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error installing PWA:', error);
            return false;
        }
    };

    return {
        isInstallable,
        isInstalled,
        installApp,
    };
};
