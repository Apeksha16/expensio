import { AppRegistry } from 'react-native';
import App from './App';
import name from './app.json';
import { preventPullToRefresh, hideAddressBar, requestPersistentStorage } from './src/utils/pwaUtils.web';

// Initialize PWA utilities for native-like experience
if (typeof window !== 'undefined') {
    // Prevent pull-to-refresh
    preventPullToRefresh();
    
    // Hide address bar on mobile
    hideAddressBar();
    
    // Request persistent storage for better offline experience
    requestPersistentStorage().then((isPersistent) => {
        if (isPersistent) {
            console.log('✅ Persistent storage granted');
        }
    });
    
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event: TouchEvent) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Register service worker update handler
    if ('serviceWorker' in navigator) {
        let refreshing = false;
        (navigator.serviceWorker as ServiceWorkerContainer).addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    }
}

// Register the app
AppRegistry.registerComponent(name.name, () => App);

const rootTag = document.getElementById('root');
console.log('Root tag:', rootTag);

if (rootTag) {
    // Mount the app
    AppRegistry.runApplication(name.name, {
        initialProps: {},
        rootTag: rootTag,
    });
    console.log('AppRegistry.runApplication called for', name.name);
} else {
    console.error('Root tag not found!');
}
