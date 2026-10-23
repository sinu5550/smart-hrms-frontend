'use client';

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, CameraOff, AlertCircle, RefreshCw } from "lucide-react";

interface QRCameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isPaused?: boolean;
}

export const QRCameraScanner: React.FC<QRCameraScannerProps> = ({
  onScanSuccess,
  isPaused = false,
}) => {
  const containerId = "interactive-qr-scanner-region";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanSuccessRef = useRef(onScanSuccess);
  const isPausedRef = useRef(isPaused);
  const [cameraState, setCameraState] = useState<"idle" | "initializing" | "active" | "error" | "denied">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const lastScannedTimestampRef = useRef<number>(0);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    setCameraState("initializing");
    setErrorMessage("");

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      await stopScanner();

      const config = {
        fps: 12,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText: string) => {
          if (isPausedRef.current) return;

          const now = Date.now();
          if (now - lastScannedTimestampRef.current < 2500) return;
          lastScannedTimestampRef.current = now;

          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(80);
          }
          onScanSuccessRef.current(decodedText);
        },
        () => {}
      );

      setCameraState("active");
    } catch (err: unknown) {
      const str = String(err);
      if (str.includes("NotAllowedError") || str.includes("Permission")) {
        setCameraState("denied");
        setErrorMessage("Camera access was denied. Please update browser permissions.");
      } else {
        setCameraState("error");
        setErrorMessage("Unable to access camera hardware. Verify it is not in use elsewhere.");
      }
    }
  }, [stopScanner]);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    isPausedRef.current = isPaused;
  }, [onScanSuccess, isPaused]);

  useEffect(() => {
    const startTimer = window.setTimeout(() => void startScanner(), 0);
    return () => {
      window.clearTimeout(startTimer);
      stopScanner().then(() => {
        if (scannerRef.current) {
          try {
            scannerRef.current.clear();
          } catch {}
          scannerRef.current = null;
        }
      });
    };
  }, [startScanner, stopScanner]);

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
      <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Camera className="w-4 h-4 text-slate-800 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-800">
            Office Wall Scanner
          </span>
        </div>
        <button
          onClick={startScanner}
          disabled={cameraState === "initializing"}
          className="p-1 text-slate-800 hover:text-slate-800 rounded-lg hover:bg-white transition"
          title="Restart Video Stream"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cameraState === "initializing" ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="relative aspect-square w-full bg-black flex items-center justify-center">
        <div id={containerId} className="w-full h-full" />

        {cameraState === "active" && !isPaused && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-dashed border-emerald-500/80 rounded-2xl animate-pulse relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-0.5 -ml-0.5 rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-0.5 -mr-0.5 rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-0.5 -ml-0.5 rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-0.5 -mr-0.5 rounded-br-sm" />
            </div>
          </div>
        )}

        {(cameraState === "error" || cameraState === "denied") && (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <CameraOff className="w-12 h-12 text-rose-500 mb-3" />
            <h4 className="text-sm font-semibold text-slate-800 mb-1">
              {cameraState === "denied" ? "Permission Denied" : "Camera Unavailable"}
            </h4>
            <p className="text-xs text-slate-800 mb-4">{errorMessage}</p>
            <button
              onClick={startScanner}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-lg shadow-emerald-950 transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {isPaused && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
            <p className="text-xs font-semibold text-slate-800">Scanner Standby (Action Modal Open)</p>
          </div>
        )}
      </div>

      <div className="p-3 bg-white/60 border-t border-slate-200 text-center">
        <p className="text-[11px] text-slate-800">Position the office QR code inside the viewfinder</p>
      </div>
    </div>
  );
};
