import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react({
            // Include react-native-vector-icons in JSX transformation
            include: [
                /\.(jsx|js|tsx|ts)$/,
                /react-native-vector-icons\/.*\.js$/,
                /node_modules\/react-native-vector-icons\/.*\.js$/,
            ],
            babel: {
                plugins: [
                    // You might need this if you use react-native-reanimated or similar
                ],
            },
        }),
        VitePWA({
            registerType: 'autoUpdate',
            strategies: 'generateSW',
            injectRegister: 'script',
            // Disable file analysis completely
            disable: false,
            workbox: {
                // Completely disable file pre-caching - only use runtime caching
                // This prevents the buildEnd hook from analyzing any source files
                globPatterns: [],
                globIgnores: ['**/*'],
                // Don't analyze files at all - skip manifest generation from files
                additionalManifestEntries: [],
                // Skip dependency analysis
                skipWaiting: true,
                clientsClaim: true,
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                            cacheableResponse: { statuses: [0, 200] }
                        }
                    },
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache',
                            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }
                        }
                    }
                ]
            },
            manifest: {
                name: 'Expensio - Expense Manager',
                short_name: 'Expensio',
                description: 'Master your finances with style.',
                theme_color: '#0F172A',
                background_color: '#0F172A',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/',
                start_url: '/',
                icons: [
                    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
                ]
            }
        })
    ],
    resolve: {
        extensions: [
            '.web.tsx',
            '.web.ts',
            '.web.jsx',
            '.web.js',
            '.tsx',
            '.ts',
            '.jsx',
            '.js',
        ],
        alias: {
            'react-native': 'react-native-web',
            'react-native-linear-gradient': 'react-native-web-linear-gradient',
            '@react-native-google-signin/google-signin': '/Users/pranavkatiyar/Documents/FULLSTACK/expensio/frontend/src/mocks/google-signin.ts',
            // Alias react-native-vector-icons to a web-compatible version
            'react-native-vector-icons/Ionicons': '/Users/pranavkatiyar/Documents/FULLSTACK/expensio/frontend/src/mocks/vector-icons.tsx',
            // Mock for codegenNativeComponent used by react-native-safe-area-context
            'react-native-web/Libraries/Utilities/codegenNativeComponent': '/Users/pranavkatiyar/Documents/FULLSTACK/expensio/frontend/src/mocks/codegenNativeComponent.ts',
        },
    },


    optimizeDeps: {
        include: ['react-native-vector-icons/Ionicons'],
        esbuildOptions: {
            resolveExtensions: [
                '.web.js',
                '.web.jsx',
                '.web.ts',
                '.web.tsx',
                '.js',
                '.jsx',
                '.ts',
                '.tsx',
            ],
            loader: {
                '.js': 'jsx',
            },
        },
        exclude: ['react-native-vector-icons/lib/create-icon-set'],
    },
    build: {
        minify: false,
        commonjsOptions: {
            include: [/react-native-vector-icons/, /node_modules/],
            transformMixedEsModules: true,
        },
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
    },
    ssr: {
        noExternal: ['react-native-vector-icons'],
    },
    define: {
        global: 'window',
    },
});
