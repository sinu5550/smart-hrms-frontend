'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const PWA_DISMISSED_KEY = 'hrms_pwa_banner_dismissed';

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // If the user already permanently dismissed or closed the banner once, never show it again
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(PWA_DISMISSED_KEY)) return;

    // Detect if already installed / running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua);
    if (isAppleDevice) {
      setIsIos(true);
      setShowInstallBanner(true);
      return;
    }

    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            reg.update();
          })
          .catch((err) => {
            console.warn('Service Worker registration failed:', err);
          });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    // Android / Desktop Chrome PWA capture
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also fallback: on mobile/desktop browsers where prompt doesn't fire immediately, show banner after 3 seconds
    const timer = setTimeout(() => {
      if (!localStorage.getItem(PWA_DISMISSED_KEY)) {
        setShowInstallBanner(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleClose = () => {
    // Permanently remember that user closed the popup so it never shows again
    if (typeof window !== 'undefined') {
      localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    }
    setShowInstallBanner(false);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        if (typeof window !== 'undefined') {
          localStorage.setItem(PWA_DISMISSED_KEY, 'true');
        }
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // If browser didn't supply deferredPrompt, instruct user
      alert('To install HRMS App:\n• On Chrome: Click the 3 dots (⋮) and select "Install app" or "Add to Home screen"\n• On Safari: Tap Share button and select "Add to Home Screen"');
      handleClose();
    }
  };

  if (!showInstallBanner) return null;

  return (
    <div className="print:hidden fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-md">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold leading-tight truncate">Install HRMS App</p>
          <p className="text-[10px] text-slate-400 leading-tight truncate">
            {isIos ? "Tap Share and select 'Add to Home Screen'" : "Add to home screen for 1-click access"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!isIos && (
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition shadow-sm cursor-pointer"
          >
            Install
          </button>
        )}
        <button
          onClick={handleClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          title="Don't show again"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
