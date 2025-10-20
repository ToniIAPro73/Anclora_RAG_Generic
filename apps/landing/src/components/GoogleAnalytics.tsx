'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: Record<string, unknown>) => void;
    dataLayer: unknown[];
  }
}

export function GoogleAnalytics() {
  useEffect(() => {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;

    if (!gaId) {
      console.warn('Google Analytics ID not found');
      return;
    }

    // Load Google Analytics script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize dataLayer
    if (!window.dataLayer) {
      window.dataLayer = [];
    }

    // Initialize gtag
    window.gtag = function(command: string, targetId: string, config?: Record<string, unknown>) {
      window.dataLayer.push([command, targetId, config].filter(item => item !== undefined));
    };

    window.gtag('js', new Date().toISOString());
    window.gtag('config', gaId, {
      page_title: document.title,
      page_location: window.location.href,
    });

    // Track page views
    const handleRouteChange = () => {
      window.gtag('config', gaId, {
        page_title: document.title,
        page_location: window.location.href,
      });
    };

    // Listen for route changes (for SPA navigation)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return null;
}