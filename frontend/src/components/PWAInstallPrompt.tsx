// Platform-specific export - this file is only used on web
// For native platforms, this will be a no-op component
import React from 'react';
import { Platform } from 'react-native';

// On web, React Native's module resolution will automatically pick up PWAInstallPrompt.web.tsx
// On native, Metro bundler will ignore .web.* files and this wrapper returns null
const PWAInstallPrompt: React.FC = () => {
    // This component is only rendered when Platform.OS === 'web' in App.tsx
    // On native platforms, this code path is never reached due to the Platform.OS check in App.tsx
    // But we provide a safe fallback just in case
    if (Platform.OS !== 'web') {
        return null;
    }

    // On web builds, Metro/Vite will resolve this to PWAInstallPrompt.web.tsx
    // On native builds, Metro will ignore .web.* files, so this require will fail gracefully
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const WebPWAInstallPrompt = require('./PWAInstallPrompt.web').default;
        return <WebPWAInstallPrompt />;
    } catch (e) {
        // This catch handles native builds where .web.* files don't exist
        // It's safe to ignore - the component won't be rendered anyway
        return null;
    }
};

export default PWAInstallPrompt;
