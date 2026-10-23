'use client';

import React, { useState, useEffect, useMemo } from "react";
import {
  BreakType,
} from "@/services/attendance.service";
import { parseApiError } from "@/services/api";
import { useMyTodayAttendance, useAttendanceActions } from "@/hooks";
import { QRCameraScanner } from "@/components/attendance/QRCameraScanner";
import { getCurrentGpsPosition } from "@/lib/geofence";
import {
  Clock,
  Coffee,
  CheckCircle2,
  LogOut,
  ChevronRight,
  Sparkles,
  WifiOff,
  MapPin,
} from "lucide-react";

const formatSecondsToHMS = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
};

export default function MobileAttendancePortal() {
  const { data: statusData, isLoading } = useMyTodayAttendance();
  const attendanceActions = useAttendanceActions();

  const [activeModal, setActiveModal] = useState<"NONE" | "CONFIRM_CHECKIN" | "SELECT_BREAK" | "IP_RESTRICTED">("NONE");
  const [selectedBreakType, setSelectedBreakType] = useState<BreakType>("LUNCH");
  const [stagedQrSecret, setStagedQrSecret] = useState<string>("");
  const [apiErrorMessage, setApiErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [liveWorkSeconds, setLiveWorkSeconds] = useState<number>(0);
  const [liveBreakSeconds, setLiveBreakSeconds] = useState<number>(0);

  const activeRecord = statusData?.attendance;
  const currentState = activeRecord?.currentState;

  const currentOpenBreak = useMemo(() => {
    return activeRecord?.breaks?.find((b) => b.endTime === null) || null;
  }, [activeRecord]);

  useEffect(() => {
    if (!activeRecord) return;

    const interval = setInterval(() => {
      const now = Date.now();

      if (currentState === "CHECKED_IN") {
        const checkInMs = new Date(activeRecord.checkInTime).getTime();
        const totalBreaksMs = (activeRecord.totalBreakMinutes || 0) * 60 * 1000;
        const workMs = Math.max(0, now - checkInMs - totalBreaksMs);
        setLiveWorkSeconds(Math.floor(workMs / 1000));
      } else if (currentState === "ON_BREAK" && currentOpenBreak) {
        const breakStartMs = new Date(currentOpenBreak.startTime).getTime();
        setLiveBreakSeconds(Math.max(0, Math.floor((now - breakStartMs) / 1000)));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRecord, currentState, currentOpenBreak]);

  const handleQrDetected = (secret: string) => {
    setStagedQrSecret(secret);

    if (!statusData?.checkedIn) {
      setActiveModal("CONFIRM_CHECKIN");
    } else if (currentState === "ON_BREAK") {
      executeEndBreak();
    }
  };

  const handleApiAction = async (actionFn: () => Promise<unknown>) => {
    try {
      setIsSubmitting(true);
      setApiErrorMessage("");
      await actionFn();
      setActiveModal("NONE");
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      if (parsed.includes("Office Wi-Fi") || parsed.includes("outside office parameters")) {
        setApiErrorMessage(parsed);
        setActiveModal("IP_RESTRICTED");
      } else {
        alert(parsed);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeCheckIn = async () => {
    let gpsCoords = undefined;
    try {
      const pos = await getCurrentGpsPosition();
      gpsCoords = { latitude: pos.latitude, longitude: pos.longitude };
    } catch (e) {
      console.warn("GPS capture skipped or denied:", e);
    }

    handleApiAction(() =>
      attendanceActions.checkIn.mutateAsync({
        qrSecret: stagedQrSecret,
        latitude: gpsCoords?.latitude,
        longitude: gpsCoords?.longitude,
        address: gpsCoords ? "GPS Verified Mobile Punch" : "Office Terminal",
      })
    );
  };

  const executeStartBreak = () => {
    handleApiAction(() => attendanceActions.startBreak.mutateAsync(selectedBreakType));
  };

  const executeEndBreak = () => {
    handleApiAction(() => attendanceActions.endBreak.mutateAsync());
  };

  const executeCheckOut = async () => {
    if (!confirm("Are you sure you want to clock out for today?")) return;
    let gpsCoords = undefined;
    try {
      const pos = await getCurrentGpsPosition();
      gpsCoords = { latitude: pos.latitude, longitude: pos.longitude };
    } catch (e) {
      console.warn("GPS capture skipped or denied:", e);
    }

    handleApiAction(() =>
      attendanceActions.checkOut.mutateAsync(
        gpsCoords
          ? {
              latitude: gpsCoords.latitude,
              longitude: gpsCoords.longitude,
              address: "GPS Verified Checkout",
            }
          : undefined
      )
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-800 text-xs tracking-wide">Syncing session...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-800 flex flex-col items-center p-4 max-w-md mx-auto relative pb-20">
      <header className="w-full flex items-center justify-between py-4 border-b border-slate-200/80 mb-6">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-1.5">
            Attendance <Sparkles className="w-4 h-4 text-slate-800" />
          </h1>
          <p className="text-xs text-slate-800">Office Network Verification Mode</p>
        </div>

        {currentState === "CHECKED_IN" && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-slate-800 text-slate-800 border border-emerald-200">
            Working
          </span>
        )}
        {currentState === "ON_BREAK" && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-700 border border-amber-200 animate-pulse">
            On {currentOpenBreak?.breakType} Break
          </span>
        )}
        {currentState === "CHECKED_OUT" && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-slate-800">
            Shift Ended
          </span>
        )}
      </header>

      {currentState === "CHECKED_OUT" && (
        <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-xl space-y-4 my-auto">
          <div className="w-16 h-16 text-slate-800/60 border border-emerald-200 text-slate-800 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Shift Concluded</h2>
            <p className="text-xs text-slate-800 mt-1">Attendance logs committed.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <p className="text-[10px] uppercase font-semibold text-slate-800">Total Work</p>
              <p className="text-lg font-bold text-slate-800 mt-1">
                {Math.floor((activeRecord?.totalWorkMinutes || 0) / 60)}h {(activeRecord?.totalWorkMinutes || 0) % 60}m
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <p className="text-[10px] uppercase font-semibold text-slate-800">Total Breaks</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{activeRecord?.totalBreakMinutes || 0}m</p>
            </div>
          </div>
        </div>
      )}

      {currentState !== "CHECKED_OUT" && (
        <div className="w-full space-y-6">
          {statusData?.checkedIn && (
            <section className="bg-white/90 border border-slate-200 rounded-2xl p-5 shadow-lg">
              {currentState === "CHECKED_IN" ? (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-800 mb-1">
                    <Clock className="w-3.5 h-3.5 text-slate-800" />
                    <span>Net Shift Duration</span>
                  </div>
                  <h3 className="text-3xl font-black tracking-wider text-slate-800 font-mono">
                    {formatSecondsToHMS(liveWorkSeconds)}
                  </h3>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-800 px-3 py-2 bg-white rounded-lg">
                    <span>Breaks: {activeRecord?.breaks?.length || 0}</span>
                    <span>Total Break: {activeRecord?.totalBreakMinutes || 0}m</span>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1.5 text-xs text-amber-400 mb-1">
                    <Coffee className="w-3.5 h-3.5 animate-bounce" />
                    <span>Active Break ({currentOpenBreak?.breakType})</span>
                  </div>
                  <h3 className="text-3xl font-black tracking-wider text-amber-400 font-mono animate-pulse">
                    {formatSecondsToHMS(liveBreakSeconds)}
                  </h3>
                  <p className="text-[11px] text-slate-800 mt-2">
                    Scan the QR code again to resume shift
                  </p>
                </div>
              )}
            </section>
          )}

          <QRCameraScanner
            onScanSuccess={handleQrDetected}
            isPaused={activeModal !== "NONE"}
          />

          {currentState === "CHECKED_IN" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveModal("SELECT_BREAK")}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100/80 text-xs font-semibold transition"
              >
                <Coffee className="w-4 h-4 text-amber-600" /> Take a Break
              </button>
              <button
                onClick={executeCheckOut}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100/80 text-xs font-semibold transition"
              >
                <LogOut className="w-4 h-4 text-rose-600" /> Clock Out
              </button>
            </div>
          )}
        </div>
      )}

      {activeModal === "CONFIRM_CHECKIN" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 text-slate-800 text-slate-800 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Ready to Check In?</h3>
              <p className="text-xs text-slate-800 mt-1">
                Authorized office QR signature verified.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setActiveModal("NONE")}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={executeCheckIn}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition active:scale-[0.99]"
              >
                {isSubmitting ? "Registering..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "SELECT_BREAK" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-800">Select Break Category</h3>
            </div>
            <div className="space-y-2">
              {(["LUNCH", "PRAYER", "TEA_COFFEE", "PERSONAL", "EMERGENCY"] as BreakType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedBreakType(type)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition ${
                    selectedBreakType === type
                      ? "border-amber-500 bg-amber-50 text-amber-800 font-semibold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{type.replace("_", " ")}</span>
                  {selectedBreakType === type && <ChevronRight className="w-4 h-4 text-amber-600" />}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setActiveModal("NONE")}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={executeStartBreak}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs font-semibold text-white transition active:scale-[0.99]"
              >
                {isSubmitting ? "Starting..." : "Start Break"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "IP_RESTRICTED" && (
        <div className="fixed inset-0 bg-rose-50 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200/80 rounded-2xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-rose-950/80 text-rose-700 border border-rose-200 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <WifiOff className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Attendance Blocked</h3>
              <p className="text-xs text-rose-700 mt-2 font-medium">
                {apiErrorMessage || "You must be connected to the official Office Wi-Fi network."}
              </p>
              <p className="text-[11px] text-slate-800 mt-2 leading-relaxed">
                Please connect your device to the designated office network router and try again.
              </p>
            </div>
            <button
              onClick={() => setActiveModal("NONE")}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition active:scale-[0.99]"
            >
              Acknowledged
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
