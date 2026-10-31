'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const PWA_DISMISSED_KEY = 'hrms_pwa_banner_dismissed';

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // If the user already permanently dismissed or closed the banner once, never show it again
    if (typeof window !== 'undefined' && localStorage.getItem(PWA_DISMISSED_KEY)) {
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

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show install prompt if not standalone and not previously dismissed
      if (
        !window.matchMedia('(display-mode: standalone)').matches &&
        !localStorage.getItem(PWA_DISMISSED_KEY)
      ) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleClose = () => {
    // Permanently remember that user closed the popup so it never shows again
    if (typeof window !== 'undefined') {
      localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    }
    setShowInstallBanner(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      if (typeof window !== 'undefined') {
        localStorage.setItem(PWA_DISMISSED_KEY, 'true');
      }
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showInstallBanner) return null;

  return (
    <div className="print:hidden fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-slate-900 text-white p-3.5 rounded-lg shadow-2xl border border-slate-700 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-md bg-emerald-600 flex items-center justify-center shrink-0">
          <Download className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold leading-tight truncate">Install HRMS Mobile App</p>
          <p className="text-[10px] text-slate-400 leading-tight truncate">Add to Home Screen for fast offline punching</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md transition shadow-xs"
        >
          Install
        </button>
        <button
          onClick={handleClose}
          className="p-1 text-slate-400 hover:text-white rounded"
          title="Dismiss forever"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
