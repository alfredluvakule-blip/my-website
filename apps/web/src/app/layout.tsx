import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Perfusio — CPB Perfusion Record',
  description: 'Hospital-grade cardiopulmonary bypass perfusion recording and monitoring.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#12609b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
