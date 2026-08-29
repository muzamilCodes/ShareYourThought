'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [offlineDismissed, setOfflineDismissed] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker (Active ONLY in live production deployment)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const isLocalDev =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.') ||
        window.location.port === '3000';

      if (!isLocalDev && process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration:', err);
          });
      } else {
        // In local development, unregister any stale service workers to prevent 404 chunk cache collisions
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
      }
    }

    // 2. Handle Android / Desktop Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user dismissed recently
      const dismissed = localStorage.getItem('thoughtshare_pwa_dismissed');
      if (!dismissed) {
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Detect iOS Safari standalone mode
    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone;

    if (isIos && !isStandalone) {
      const iosDismissed = sessionStorage.getItem('thoughtshare_ios_guide_dismissed');
      if (!iosDismissed) {
        setTimeout(() => setShowIosGuide(true), 5000);
      }
    }

    // 4. Online / Offline Connectivity Monitor
    const handleOnline = () => {
      setIsOffline(false);
      setOfflineDismissed(false);
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 3500);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setOfflineDismissed(false);
      setShowBackOnline(false);
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setShowInstallBanner(false);
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      console.log('[PWA] User accepted the installation');
    }
    setDeferredPrompt(null);
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('thoughtshare_pwa_dismissed', 'true');
  };

  const handleDismissIosGuide = () => {
    setShowIosGuide(false);
    sessionStorage.setItem('thoughtshare_ios_guide_dismissed', 'true');
  };

  return (
    <>
      {/* Offline Status Warning Pill */}
      {isOffline && !offlineDismissed && (
        <div
          style={{
            position: 'fixed',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1c1c19',
            color: '#fef3c7',
            border: '1px solid #d97706',
            borderRadius: '30px',
            padding: '8px 18px',
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 9999
          }}
        >
          <span>📴 You are currently browsing offline</span>
          <button
            type="button"
            onClick={() => setOfflineDismissed(true)}
            style={{ background: 'transparent', border: 'none', color: '#fef3c7', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Back Online Reconnect Success Pill */}
      {showBackOnline && (
        <div
          style={{
            position: 'fixed',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#064e3b',
            color: '#d1fae5',
            border: '1px solid #10b981',
            borderRadius: '30px',
            padding: '8px 18px',
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <span>⚡ Back online ✓</span>
        </div>
      )}

      {/* Android & Desktop Install Card Prompt */}
      {showInstallBanner && deferredPrompt && (
        <div
          className="pwa-install-card"
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            maxWidth: '360px',
            width: 'calc(100vw - 40px)',
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: '18px',
            padding: '16px 18px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
            zIndex: 9990,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            backdropFilter: 'blur(10px)'
          }}
        >
          <img
            src="/icons/icon.svg"
            alt="ThoughtShare"
            style={{ width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--ink)' }}>
              Install ThoughtShare
            </strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block' }}>
              Add to your home screen for quick access & offline use.
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              className="button"
              onClick={handleInstallClick}
              style={{ fontSize: '0.78rem', padding: '6px 12px', minHeight: 'auto', whiteSpace: 'nowrap' }}
            >
              Install
            </button>
            <button
              type="button"
              className="button-ghost"
              onClick={handleDismissBanner}
              style={{ fontSize: '0.72rem', padding: '2px 8px' }}
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari "Add to Home Screen" Instructions Guide */}
      {showIosGuide && (
        <div
          className="pwa-ios-guide"
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '380px',
            width: 'calc(100vw - 32px)',
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: '18px',
            padding: '16px 18px',
            boxShadow: '0 14px 36px rgba(0,0,0,0.18)',
            zIndex: 9990,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <span style={{ fontSize: '1.6rem' }}>📲</span>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--ink)' }}>
              Install on iPhone / iPad
            </strong>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
              Tap the <strong>Share</strong> icon <span style={{ fontSize: '1rem' }}>⎋</span> at the bottom of Safari, then select <strong>'Add to Home Screen'</strong> ➕.
            </p>
          </div>
          <button
            type="button"
            className="button-ghost"
            onClick={handleDismissIosGuide}
            style={{ fontSize: '0.85rem', padding: '2px 6px', border: 'none' }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
