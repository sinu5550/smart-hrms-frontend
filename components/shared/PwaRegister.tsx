'use client';

import { useEffect, useState } from 'react';
import { Download, X, Share2, PlusSquare, Smartphone } from 'lucide-react';

const PWA_DISMISSED_KEY = 'hrms_pwa_banner_dismissed';

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect if already installed / running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // Detect iOS / Apple device
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isAppleDevice) {
      setIsIos(true);
    }

    // Register Service Worker for both Android and iOS
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

    // If banner was dismissed earlier, do not pop banner automatically
    if (localStorage.getItem(PWA_DISMISSED_KEY)) return;

    // Android / Desktop Chrome PWA capture
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Fallback timer to show banner on supported devices
    const timer = setTimeout(() => {
      if (!localStorage.getItem(PWA_DISMISSED_KEY)) {
        setShowInstallBanner(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    }
    setShowInstallBanner(false);
    setShowIosGuide(false);
  };

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

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
      setShowIosGuide(true);
    }
  };

  if (!showInstallBanner && !showIosGuide) return null;

  return (
    <>
      {/* Floating Bottom Install Banner */}
      {showInstallBanner && !showIosGuide && (
        <div className="print:hidden fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-md">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight truncate">Install HRMS App</p>
              <p className="text-[10px] text-slate-400 leading-tight truncate">
                {isIos ? "Tap to see how to install on iPhone/iPad" : "Add to home screen for 1-click access"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition shadow-sm cursor-pointer"
            >
              Install
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Don't show again"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Step-by-Step Installation Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Apple (iOS) Install Guide</h3>
                  <p className="text-[11px] text-slate-500">iPhone / iPad এ অ্যাপ ইনস্টল করার নিয়ম</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  ১
                </span>
                <div>
                  <strong className="text-slate-800">Safari ব্রাউজার ওপেন করুন:</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">Apple ডিভাইস শুধুমাত্র Safari ব্রাউজার থেকেই ফুল অ্যাপ মোডে ইনস্টল গ্রহণ করে।</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  ২
                </span>
                <div>
                  <strong className="text-slate-800 flex items-center gap-1.5">
                    Safari-র নিচে <Share2 className="w-3.5 h-3.5 text-blue-600" /> Share বাটনে চাপ দিন
                  </strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">স্ক্রিনের নিচে থাকা শেয়ার আইকনে ট্যাপ করুন।</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  ৩
                </span>
                <div>
                  <strong className="text-slate-800 flex items-center gap-1.5">
                    <PlusSquare className="w-3.5 h-3.5 text-emerald-600" /> Add to Home Screen সিলেক্ট করুন
                  </strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">শেয়ার মেনু থেকে স্ক্রল করে 'Add to Home Screen' চাপ দিন এবং উপরে ডানদিকের 'Add' বাটনে ট্যাপ করুন।</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowIosGuide(false);
                handleClose();
              }}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              বুঝেছি / Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
