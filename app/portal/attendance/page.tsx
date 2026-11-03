'use client';

import React, { useState, useEffect, useMemo } from "react";
import {
  BreakType,
} from "@/services/attendance.service";
import { parseApiError } from "@/services/api";
import { useMyTodayAttendance, useAttendanceActions } from "@/hooks";
import { useShifts } from "@/hooks/useShifts";
import { useRosterShiftRequests, useCreateRosterShiftRequest } from "@/hooks/useDepartments";
import { QRCameraScanner } from "@/components/attendance/QRCameraScanner";
import { Select } from "@/components/ui/select";
import { getCurrentGpsPosition } from "@/lib/geofence";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import {
  Clock,
  Coffee,
  CheckCircle2,
  LogOut,
  ChevronRight,
  Sparkles,
  WifiOff,
  MapPin,
  ShieldAlert,
  ArrowRight,
  CalendarDays,
  Layers,
} from "lucide-react";

const formatSecondsToHMS = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
};

export default function MobileAttendancePortal() {
  const { user } = useAuth();
  const { data: statusData, isLoading } = useMyTodayAttendance();
  const attendanceActions = useAttendanceActions();

  const isOwner = Boolean(
    user?.email &&
    user?.organization?.ownerEmail &&
    user.email.toLowerCase() === user.organization.ownerEmail.toLowerCase()
  );

  const [activeModal, setActiveModal] = useState<"NONE" | "CONFIRM_CHECKIN" | "CONFIRM_CHECKOUT" | "SCAN_CHECKOUT" | "SELECT_BREAK" | "IP_RESTRICTED">("NONE");
  const [selectedBreakType, setSelectedBreakType] = useState<BreakType>("LUNCH");
  const [stagedQrSecret, setStagedQrSecret] = useState<string>("");
  const [apiErrorMessage, setApiErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [liveWorkSeconds, setLiveWorkSeconds] = useState<number>(0);
  const [liveBreakSeconds, setLiveBreakSeconds] = useState<number>(0);

  // Roster Shift Change Application state
  const { data: availableShifts = [] } = useShifts();
  const { data: myShiftRequests = [] } = useRosterShiftRequests();
  const createShiftRequestMutation = useCreateRosterShiftRequest();
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [targetShiftId, setTargetShiftId] = useState("");
  const [shiftRequestDate, setShiftRequestDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [shiftRequestReason, setShiftRequestReason] = useState("");
  const [shiftSuccessMsg, setShiftSuccessMsg] = useState<string | null>(null);

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
    } else if (currentState === "CHECKED_IN" && activeModal === "SCAN_CHECKOUT") {
      setActiveModal("CONFIRM_CHECKOUT");
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
    setIsSubmitting(true);
    let gpsCoords = undefined;
    try {
      const posPromise = getCurrentGpsPosition();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("GPS_TIMEOUT")), 1500)
      );
      const pos = await Promise.race([posPromise, timeoutPromise]);
      gpsCoords = { latitude: pos.latitude, longitude: pos.longitude };
    } catch (e) {
      console.warn("GPS quick capture skipped or timed out:", e);
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

  const promptCheckOutQr = () => {
    setStagedQrSecret("");
    setActiveModal("SCAN_CHECKOUT");
  };

  const executeCheckOut = async () => {
    setIsSubmitting(true);
    let gpsCoords = undefined;
    try {
      const posPromise = getCurrentGpsPosition();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("GPS_TIMEOUT")), 1500)
      );
      const pos = await Promise.race([posPromise, timeoutPromise]);
      gpsCoords = { latitude: pos.latitude, longitude: pos.longitude };
    } catch (e) {
      console.warn("GPS quick capture skipped or timed out:", e);
    }

    handleApiAction(() =>
      attendanceActions.checkOut.mutateAsync({
        qrSecret: stagedQrSecret,
        latitude: gpsCoords?.latitude,
        longitude: gpsCoords?.longitude,
        address: gpsCoords ? "GPS Verified Checkout" : "Office Terminal",
      })
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

  const isAttendanceExempt = isOwner || statusData?.isExempt || Boolean(user?.attendanceExempt);

  // If user is Owner or exempted by Owner/Authorized HR, they are exempt from daily attendance punching
  if (isAttendanceExempt) {
    return (
      <main className="min-h-screen bg-white text-slate-800 flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center space-y-4 pb-20">
        <div className="w-16 h-16 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <Sparkles className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            {isOwner ? "Workspace Owner" : "Attendance Exempted"}
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Attendance Exempted</h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {isOwner
              ? "As the Organization Owner, you are permanent and exempt from punch-in/out requirements. HR officers and employees are tracked in real-time."
              : "The Organization Owner has exempted you from daily attendance punch-in/out requirements. Your presence is pre-approved."}
          </p>
        </div>

        <div className="pt-2 w-full space-y-2">
          {isOwner && (
            <Link
              href="/admin/attendance"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>Monitor Employee Attendance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
          <Link
            href="/portal/profile"
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition flex items-center justify-center"
          >
            View My Profile
          </Link>
        </div>
      </main>
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

      {/* Roster Employee Shift & Off-Day Banner */}
      {statusData?.rosterDetails?.isRosterEmployee && (
        <section className="w-full mb-4 bg-gradient-to-r from-purple-50 to-indigo-50/60 border border-purple-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              <span className="text-[11px] font-bold text-purple-900 tracking-wider uppercase">My Roster Duty Schedule</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-200/80 text-purple-900">
              Roster Staff
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/90 border border-purple-100 rounded-xl p-2.5 flex flex-col justify-between">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span className="font-semibold text-slate-700">Assigned Shift</span>
              </div>
              <p className="font-bold text-slate-900 truncate">{statusData.rosterDetails.shiftName}</p>
              <p className="text-[11px] font-mono font-medium text-purple-700 mt-0.5">
                {statusData.rosterDetails.startTime} - {statusData.rosterDetails.endTime}
              </p>
            </div>

            <div className="bg-white/90 border border-purple-100 rounded-xl p-2.5 flex flex-col justify-between">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
                <CalendarDays className="w-3.5 h-3.5 text-purple-600" />
                <span className="font-semibold text-slate-700">Designated Off-Days</span>
              </div>
              {statusData.rosterDetails.offDays && statusData.rosterDetails.offDays.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {statusData.rosterDetails.offDays.map((d) => (
                    <span
                      key={d}
                      className="px-1.5 py-0.5 bg-purple-100 text-purple-900 font-extrabold rounded text-[10px]"
                    >
                      {d.slice(0, 3)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic mt-0.5">None assigned yet</p>
              )}
            </div>
          </div>

          {/* Action to Request Shift Change for Next Day */}
          <div className="mt-3 pt-3 border-t border-purple-200/70 flex items-center justify-between">
            <span className="text-[11px] text-purple-950 font-medium">Need to change your shift timing?</span>
            <button
              onClick={() => {
                setTargetShiftId("");
                setShiftSuccessMsg(null);
                setIsShiftModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold shadow-xs active:scale-95 transition flex items-center gap-1 cursor-pointer"
            >
              <Clock className="w-3 h-3" />
              <span>Apply for Shift Change</span>
            </button>
          </div>

          {/* Recent Pending/Approved Request Status Indicator */}
          {myShiftRequests.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              {myShiftRequests.slice(0, 2).map((req) => (
                <div
                  key={req.id}
                  className="px-2.5 py-1.5 rounded-lg bg-white/80 border border-purple-100 flex items-center justify-between text-[11px]"
                >
                  <div className="truncate mr-2">
                    <span className="font-semibold text-slate-800">
                      {new Date(req.effectiveDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}:
                    </span>{" "}
                    <span className="text-purple-700 font-medium">{req.targetShift?.shiftName}</span>{" "}
                    <span className="text-slate-500 font-mono">({req.targetShift?.startTime} - {req.targetShift?.endTime})</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      req.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : req.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800 animate-pulse"
                    }`}
                  >
                    {req.status === "APPROVED" ? "Approved & Applied" : req.status === "REJECTED" ? "Rejected" : "Pending Dept Head"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {currentState === "CHECKED_OUT" && (
        <div className="w-full bg-white border border-slate-200 rounded-lg p-6 text-center shadow-xl space-y-4 my-auto">
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
            {(activeRecord?.overtimeMinutes || 0) > 0 && (
              <div className="bg-indigo-50/80 p-3 rounded-xl border border-indigo-200 col-span-2 text-center">
                <p className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">Overtime Approved</p>
                <p className="text-xl font-black text-indigo-800 mt-0.5">
                  +{Math.floor(activeRecord!.overtimeMinutes! / 60)}h {activeRecord!.overtimeMinutes! % 60}m
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {currentState !== "CHECKED_OUT" && (
        <div className="w-full space-y-6">
          {statusData?.checkedIn && (
            <section className="bg-white/90 border border-slate-200 rounded-lg p-5 shadow-lg">
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
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-1.5 text-xs text-amber-600 mb-1">
                    <Coffee className="w-3.5 h-3.5 animate-bounce" />
                    <span className="font-semibold">Active Break ({currentOpenBreak?.breakType?.replace("_", " ")})</span>
                  </div>
                  <h3 className="text-3xl font-black tracking-wider text-amber-600 font-mono animate-pulse">
                    {formatSecondsToHMS(liveBreakSeconds)}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Take your time. Tap below whenever you are ready to resume your shift.
                  </p>
                  <button
                    onClick={executeEndBreak}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? "Resuming..." : "End Break & Resume Work"}</span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* QR Camera Scanner: Only shown initially when NOT checked in */}
          {!statusData?.checkedIn && (
            <div className="space-y-2">
              <div className="text-center pb-1">
                <p className="text-xs font-bold text-slate-700">Scan Office QR to Clock In</p>
                <p className="text-[11px] text-slate-400">Align your camera with the official Office QR poster</p>
              </div>
              <QRCameraScanner
                onScanSuccess={handleQrDetected}
                isPaused={activeModal !== "NONE"}
              />
            </div>
          )}

          {currentState === "CHECKED_IN" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveModal("SELECT_BREAK")}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100/80 text-xs font-semibold transition"
              >
                <Coffee className="w-4 h-4 text-amber-600" /> Take a Break
              </button>
              <button
                onClick={promptCheckOutQr}
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
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-sm p-6 text-center space-y-4">
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
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-sm p-6 space-y-4">
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

      {/* MODAL: SCAN OFFICE QR TO CHECK OUT */}
      {activeModal === "SCAN_CHECKOUT" && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Scan Office QR to Clock Out</h3>
              </div>
              <button
                onClick={() => setActiveModal("NONE")}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                &times;
              </button>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Please point your camera at the official Office QR code sign before leaving.
            </p>
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <QRCameraScanner
                onScanSuccess={handleQrDetected}
                isPaused={false}
              />
            </div>
            <button
              onClick={() => setActiveModal("NONE")}
              className="w-full py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM CLOCK OUT AFTER QR DETECTED */}
      {activeModal === "CONFIRM_CHECKOUT" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-sm p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 border border-rose-200 rounded-full flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Clock Out for Today?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Office QR verified. Your daily shift and work hours will be recorded.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setActiveModal("NONE")}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={executeCheckOut}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white transition active:scale-[0.99]"
              >
                {isSubmitting ? "Ending Shift..." : "Confirm Clock Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "IP_RESTRICTED" && (
        <div className="fixed inset-0 bg-rose-50 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200/80 rounded-lg w-full max-w-sm p-6 text-center space-y-4 shadow-2xl">
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

      {/* MODAL: APPLY FOR ROSTER SHIFT CHANGE */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Roster Shift Change Request</h3>
                  <p className="text-[11px] text-slate-500">Apply to change duty timing for tomorrow / upcoming day</p>
                </div>
              </div>
              <button
                onClick={() => setIsShiftModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-base"
              >
                &times;
              </button>
            </div>

            {shiftSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                {shiftSuccessMsg}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Effective Date</label>
                <input
                  type="date"
                  value={shiftRequestDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setShiftRequestDate(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Select when you want this new shift to take effect.</p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Shift Schedule *</label>
                <Select
                  value={targetShiftId}
                  onValueChange={setTargetShiftId}
                  options={availableShifts.map((s) => ({
                    value: s.id,
                    label: `${s.shiftName} (${s.startTime} - ${s.endTime})`,
                  }))}
                  placeholder="Select desired shift"
                  triggerClassName="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason (Optional)</label>
                <textarea
                  value={shiftRequestReason}
                  onChange={(e) => setShiftRequestReason(e.target.value)}
                  placeholder="Reason for changing shift (e.g. medical, transport, personal requirement)..."
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 leading-tight">
                Notice: This application will be submitted directly to your Department Head. Once approved by the Department Head, your shift will be updated automatically.
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!targetShiftId || createShiftRequestMutation.isPending}
                onClick={async () => {
                  if (!targetShiftId) return;
                  try {
                    await createShiftRequestMutation.mutateAsync({
                      targetShiftId,
                      effectiveDate: shiftRequestDate,
                      reason: shiftRequestReason,
                    });
                    setShiftSuccessMsg("Application submitted to Department Head successfully.");
                    setTimeout(() => {
                      setIsShiftModalOpen(false);
                      setShiftSuccessMsg(null);
                    }, 1500);
                  } catch (err) {
                    alert(parseApiError(err));
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-xs font-bold text-white shadow-xs active:scale-95 transition"
              >
                {createShiftRequestMutation.isPending ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
