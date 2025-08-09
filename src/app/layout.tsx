
'use client';

import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import { CookieConsentBanner } from '@/components/cookie-consent-banner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <title>Kadichii</title>
        <meta name="description" content="Visualiza tus tareas con un elegante tablero Kanban." />
        <link rel="icon" href="/logo.png" type="image/png" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
