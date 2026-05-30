import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '../components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Expensio | Sign in',
  description: 'Track, split, and save with Expensio.',
  applicationName: 'Expensio',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Expensio',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8F8FC' },
    { media: '(prefers-color-scheme: dark)', color: '#09090B' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased selection:bg-primary/20">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
