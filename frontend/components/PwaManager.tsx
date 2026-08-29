'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'desktop' | 'android' | 'ios'>('desktop');
  const [isOffline, setIsOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [offlineDismissed, setOfflineDismissed] = useState(false);
  const [isStandaloneApp, setIsStandaloneApp] = useState(false);

  useEffect(() => {
    // 1. Detect device type for default tab in modal
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/iPad|iPhone|iPod/.test(ua)) {
        setActiveDeviceTab('ios');
      } else if (/Android/.test(ua)) {
        setActiveDeviceTab('android');
      } else {
        setActiveDeviceTab('desktop');
      }
    }

    // 2. Register Service Worker for PWA
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration error:', err);
        });
    }

    // 3. Check standalone mode
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone);

    if (isStandalone) {
      setIsStandaloneApp(true);
      return;
    }

    // 4. Handle Android / Desktop Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      const dismissed = sessionStorage.getItem('thoughtshare_pwa_session_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback: Show install prompt if not dismissed in session
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem('thoughtshare_pwa_session_dismissed');
      if (!dismissed && !isStandalone) {
        setShowInstallBanner(true);
      }
    }, 2000);

    const handleAppInstalled = () => {
      setShowInstallBanner(false);
      setShowInstallModal(false);
      setIsStandaloneApp(true);
      sessionStorage.setItem('thoughtshare_pwa_session_dismissed', 'true');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 5. Global Custom Event Listener to trigger install from any button
    const handleGlobalTrigger = () => {
      triggerInstallProcess();
    };
    window.addEventListener('trigger-pwa-install', handleGlobalTrigger);

    // 6. Online / Offline Connectivity Monitor
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
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('trigger-pwa-install', handleGlobalTrigger);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [deferredPrompt]);

  const triggerInstallProcess = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setShowInstallBanner(false);
          setShowInstallModal(false);
          sessionStorage.setItem('thoughtshare_pwa_session_dismissed', 'true');
        }
        setDeferredPrompt(null);
      } catch {
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('thoughtshare_pwa_session_dismissed', 'true');
  };

  if (isStandaloneApp) {
    return null;
  }

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

      {/* Bottom Floating Install Banner */}
      {showInstallBanner && !showInstallModal && (
        <div
          className="pwa-install-card"
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            maxWidth: '380px',
            width: 'calc(100vw - 40px)',
            background: 'var(--paper)',
            border: '1.5px solid var(--ember)',
            borderRadius: '20px',
            padding: '16px 18px',
            boxShadow: '0 16px 40px rgba(200, 109, 52, 0.22)',
            zIndex: 9990,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            backdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <img
            src="/icons/icon-192.png"
            alt="Share Your Thoughts App"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              flexShrink: 0,
              objectFit: 'cover',
              border: '1px solid var(--line)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ display: 'block', fontSize: '0.94rem', color: 'var(--ink)' }}>
              Install App 📲
            </strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
              Add to Home screen for fast offline reading.
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              className="button"
              onClick={triggerInstallProcess}
              style={{ fontSize: '0.80rem', padding: '6px 14px', minHeight: 'auto', whiteSpace: 'nowrap', borderRadius: '16px', fontWeight: 700 }}
            >
              Install 📲
            </button>
            <button
              type="button"
              className="button-ghost"
              onClick={handleDismissBanner}
              style={{ fontSize: '0.74rem', padding: '2px 8px', color: 'var(--muted)' }}
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* Step-by-Step Install Guide Modal (When native prompt is unavailable) */}
      {showInstallModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setShowInstallModal(false)}
        >
          <div
            style={{
              background: 'var(--paper)',
              borderRadius: '24px',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow)',
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src="/icons/icon-192.png"
                  alt="App Icon"
                  style={{ width: '42px', height: '42px', borderRadius: '10px', border: '1px solid var(--line)' }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--ink)' }}>Install Share Your Thoughts</h3>
                  <span style={{ fontSize: '0.80rem', color: 'var(--muted)' }}>Web Application Setup</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                style={{
                  background: 'var(--dark-soft)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: 'var(--ink)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Device Switcher Tabs */}
            <div
              style={{
                display: 'flex',
                background: 'var(--dark-soft)',
                padding: '4px',
                borderRadius: '12px',
                gap: '4px',
                marginBottom: '20px'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveDeviceTab('desktop')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeDeviceTab === 'desktop' ? 'var(--paper)' : 'transparent',
                  color: activeDeviceTab === 'desktop' ? 'var(--ink)' : 'var(--muted)',
                  boxShadow: activeDeviceTab === 'desktop' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                💻 Desktop / PC
              </button>
              <button
                type="button"
                onClick={() => setActiveDeviceTab('android')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeDeviceTab === 'android' ? 'var(--paper)' : 'transparent',
                  color: activeDeviceTab === 'android' ? 'var(--ink)' : 'var(--muted)',
                  boxShadow: activeDeviceTab === 'android' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                🤖 Android
              </button>
              <button
                type="button"
                onClick={() => setActiveDeviceTab('ios')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeDeviceTab === 'ios' ? 'var(--paper)' : 'transparent',
                  color: activeDeviceTab === 'ios' ? 'var(--ink)' : 'var(--muted)',
                  boxShadow: activeDeviceTab === 'ios' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                🍎 iPhone / iPad
              </button>
            </div>

            {/* Instruction Body */}
            {activeDeviceTab === 'desktop' && (
              <div style={{ fontSize: '0.90rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ background: 'var(--ember)', color: '#ffffff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.78rem', fontWeight: 800 }}>1</span>
                  <span>Look at the right side of your <strong>Chrome / Edge address bar (URL bar)</strong>.</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ background: 'var(--ember)', color: '#ffffff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.78rem', fontWeight: 800 }}>2</span>
                  <span>Click the <strong>Install Icon (⊕ or ⬇️)</strong> or click <strong>⋮ (Menu) → &quot;Install Share Your Thoughts&quot;</strong>.</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ background: 'var(--ember)', color: '#ffffff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.78rem', fontWeight: 800 }}>3</span>
                  <span>Click <strong>Install</strong> to add the app directly to your desktop.</span>
                </div>
              </div>
            )}

            {activeDeviceTab === 'android' && (
              <div style={{ fontSize: '0.90rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ background: 'var(--ember)', color: '#ffffff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.78rem', fontWeight: 800 }}>1</span>
                  <span>Tap the <strong>⋮ (3 dots) menu</strong> in top-right corner of Chrome.</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ background: 'var(--ember)', color: '#ffffff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.78rem', fontWeight: 800 }}>2</span>
                  <span>Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ background: 'var(--ember)', color: '#ffffff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.78rem', fontWeight: 800 }}>3</span>
                  <span>Confirm by tapping <strong>Install</strong>.</span>
                </div>
              </div>
            )}

            {activeDeviceTab === 'ios' && (
              <div style={{ fontSize: '0.90rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ background: 'var(--ember)', color: '#ffffff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.78rem', fontWeight: 800 }}>1</span>
                  <span>In Safari, tap the <strong>Share button (📤)</strong> at the bottom bar.</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ background: 'var(--ember)', color: '#ffffff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.78rem', fontWeight: 800 }}>2</span>
                  <span>Scroll down and tap <strong>&quot;Add to Home Screen&quot; (➕)</strong>.</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ background: 'var(--ember)', color: '#ffffff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.78rem', fontWeight: 800 }}>3</span>
                  <span>Tap <strong>Add</strong> in the top right corner.</span>
                </div>
              </div>
            )}

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                type="button"
                className="button"
                onClick={() => setShowInstallModal(false)}
                style={{ width: '100%', borderRadius: '16px' }}
              >
                Got It ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
