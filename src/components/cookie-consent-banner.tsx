
'use client';
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import Link from 'next/link';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent === null) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-secondary text-secondary-foreground p-4 shadow-lg">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-center md:text-left">
          Utilizamos cookies para mejorar tu experiencia en nuestro sitio. Para más detalles, consulta nuestra{' '}
          <Link href="/privacy-policy" className="underline hover:text-primary">Política de Privacidad</Link>.
        </p>
        <div className="flex gap-2">
          <Button onClick={handleAccept} size="sm">Aceptar</Button>
          <Button onClick={handleDecline} variant="outline" size="sm">Rechazar</Button>
        </div>
      </div>
    </div>
  );
}
