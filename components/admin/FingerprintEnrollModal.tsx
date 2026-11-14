'use client';

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { deviceService, BiometricDevice } from "@/services/device.service";
import { Employee } from "@/services/employee.service";
import {
  Fingerprint,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Radio,
  AlertCircle,
  ShieldCheck,
  Cpu,
  User,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";

interface Props {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FingerprintItem {
  cardReaderNo: number;
  fingerPrintID: number;
  fingerType: string;
  fingerData?: string;
}

export function FingerprintEnrollModal({ employee, isOpen, onClose, onSuccess }: Props) {
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fingerprints, setFingerprints] = useState<FingerprintItem[]>([]);
  const [terminalEmployeeNo, setTerminalEmployeeNo] = useState<string>("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  // Live polling / listening state
  const [isListening, setIsListening] = useState(false);
  const [listenSeconds, setListenSeconds] = useState(0);
  const [targetSlot, setTargetSlot] = useState<number>(1);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialCountRef = useRef<number>(0);

  // Load devices on modal open
  useEffect(() => {
    if (isOpen) {
      setActionMessage(null);
      setIsListening(false);
      setAvatarError(false);
      deviceService
        .getAll()
        .then((devs) => {
          setDevices(devs);
          const online = devs.find((d) => d.status === "ONLINE") || devs[0];
          if (online) {
            setSelectedDeviceId(online.id);
          }
        })
        .catch(() => {});
    } else {
      stopListening();
    }
    return () => stopListening();
  }, [isOpen]);

  // Load fingerprints whenever employee or device changes
  useEffect(() => {
    if (isOpen && employee && selectedDeviceId) {
      fetchFingerprints();
    }
  }, [isOpen, employee?.id, selectedDeviceId]);

  const fetchFingerprints = async (silent = false) => {
    if (!employee || !selectedDeviceId) return;
    if (!silent) setLoading(true);
    try {
      const res = await deviceService.getEmployeeFingerprints(selectedDeviceId, employee.id);
      if (res.success) {
        setFingerprints(res.fingerprints || []);
        setTerminalEmployeeNo(res.terminalEmployeeNo || "");

        // Determine next available slot (1-10)
        const enrolledSlots = new Set((res.fingerprints || []).map((f) => f.fingerPrintID));
        for (let i = 1; i <= 10; i++) {
          if (!enrolledSlots.has(i)) {
            setTargetSlot(i);
            break;
          }
        }
      }
    } catch (err: any) {
      if (!silent) {
        setActionMessage({
          type: "error",
          text: err.response?.data?.message || err.message || "Failed to query fingerprints from terminal.",
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const stopListening = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setIsListening(false);
    setListenSeconds(0);
  };

  const startListening = async () => {
    if (!employee || !selectedDeviceId) return;
    setActionMessage(null);
    setIsListening(true);
    setListenSeconds(60);
    initialCountRef.current = fingerprints.length;

    // First prompt terminal (ensures employee name & ID are registered on device)
    try {
      await deviceService.promptEmployeeFingerprint(selectedDeviceId, employee.id);
    } catch {}

    // Countdown timer
    countdownTimerRef.current = setInterval(() => {
      setListenSeconds((prev) => {
        if (prev <= 1) {
          stopListening();
          setActionMessage({
            type: "info",
            text: "Listening timed out. You can click 'Start Live Enrollment' again anytime.",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Active polling every 2.5s to detect newly registered fingerprint
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await deviceService.getEmployeeFingerprints(selectedDeviceId, employee.id);
        if (res.success && Array.isArray(res.fingerprints)) {
          setFingerprints(res.fingerprints);
          if (res.fingerprints.length > initialCountRef.current) {
            // New fingerprint detected!
            stopListening();
            setActionMessage({
              type: "success",
              text: `🎉 Success! New fingerprint enrolled and synced from terminal. Total enrolled: ${res.fingerprints.length}.`,
            });
            onSuccess(); // Refresh parent directory
          }
        }
      } catch {}
    }, 2500);
  };

  const handleDeleteFingerprint = async (fingerPrintId: number) => {
    if (!employee || !selectedDeviceId) return;
    if (!confirm(`Are you sure you want to remove Fingerprint #${fingerPrintId} from the biometric device?`)) return;

    setDeletingId(fingerPrintId);
    setActionMessage(null);
    try {
      const res = await deviceService.deleteEmployeeFingerprint(selectedDeviceId, employee.id, fingerPrintId);
      if (res.success) {
        setFingerprints(res.fingerprints || []);
        setActionMessage({
          type: "success",
          text: `Fingerprint #${fingerPrintId} was deleted from the device.`,
        });
        onSuccess();
      }
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to remove fingerprint.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (!employee) return null;

  const currentDevice = devices.find((d) => d.id === selectedDeviceId);
  const enrolledSlots = new Set(fingerprints.map((f) => f.fingerPrintID));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-0 overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
              <Fingerprint className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Biometric Fingerprint Management
              </DialogTitle>
              <p className="text-xs text-emerald-100 font-medium">
                Live hardware synchronization with Hikvision MinMoe Terminal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Employee & Device Info Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 overflow-hidden flex items-center justify-center flex-shrink-0 text-emerald-800 font-bold relative">
                {employee.avatarUrl && !avatarError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={employee.avatarUrl}
                    alt={employee.fullName}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span className="text-sm font-bold text-emerald-800">
                    {employee.fullName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800 text-sm truncate">{employee.fullName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                    {employee.employeeId}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium truncate">
                    {employee.department?.name || "General"}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-600 font-mono mt-1 font-semibold">
                  Hardware ID: {terminalEmployeeNo || employee.employeeId?.replace(/[^a-zA-Z0-9]/g, "")}
                </p>
              </div>
            </div>

            {/* Device Selector Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  Target Device
                </label>
                {currentDevice && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    ONLINE (ISUP)
                  </span>
                )}
              </div>
              <div className="mt-2">
                <Select
                  value={selectedDeviceId}
                  onValueChange={(val) => setSelectedDeviceId(val)}
                  disabled={loading || isListening}
                  triggerClassName="w-full text-xs font-semibold bg-white border-slate-300 rounded-lg h-9"
                  options={devices.map((d) => ({
                    value: d.id,
                    label: `${d.deviceName} (${d.deviceModel || "Hikvision Terminal"})`,
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Alert Message Banner */}
          {actionMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
                actionMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : actionMessage.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              {actionMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
              {actionMessage.type === "error" && <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
              {actionMessage.type === "info" && <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />}
              <span>{actionMessage.text}</span>
            </div>
          )}

          {/* Live Enrollment Radar / Action Section */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-400/50 scale-105 animate-bounce"
                      : "bg-white text-emerald-600 border border-emerald-200 shadow-sm"
                  }`}
                >
                  <Fingerprint className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Enroll Fingerprint on Device
                    {isListening && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800 animate-pulse">
                        Listening ({listenSeconds}s)
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isListening
                      ? "Hardware sensor waiting! Have employee press finger 3 times on the terminal."
                      : "Click below to open live detection session for this employee."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isListening ? (
                  <Button
                    type="button"
                    onClick={stopListening}
                    variant="outline"
                    className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold h-9 rounded-xl w-full sm:w-auto"
                  >
                    Cancel Listening
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={startListening}
                    disabled={loading || !selectedDeviceId}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-4 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 w-full sm:w-auto"
                  >
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    Start Live Enrollment
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => fetchFingerprints()}
                  disabled={loading || isListening}
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold h-9 px-3 rounded-xl"
                  title="Refresh status from hardware"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Instruction Steps when active */}
            {isListening && (
              <div className="mt-4 pt-4 border-t border-emerald-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="bg-white/80 backdrop-blur rounded-xl p-2.5 border border-emerald-100 flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <span className="text-[11px] font-medium text-slate-700">
                    Stand in front of <strong>{currentDevice?.deviceName || "Terminal"}</strong>
                  </span>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-xl p-2.5 border border-emerald-100 flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <span className="text-[11px] font-medium text-slate-700">
                    Place finger on scanner <strong>3 times</strong> (Press & Lift)
                  </span>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-xl p-2.5 border border-emerald-100 flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                    3
                  </span>
                  <span className="text-[11px] font-medium text-slate-700">
                    HRMS auto-detects and confirms instantly!
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Enrolled Fingerprints List / Slots */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Terminal Fingerprint Slots ({fingerprints.length} Registered)
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Hikvision Max Capacity: 10 Fingers per user
              </span>
            </div>

            {loading && fingerprints.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                Querying biometric hardware slots...
              </div>
            ) : fingerprints.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">No Fingerprint Registered</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click <strong>&quot;Start Live Enrollment&quot;</strong> above to enroll this employee&apos;s first finger.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fingerprints.map((fp) => (
                  <div
                    key={fp.fingerPrintID}
                    className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between shadow-sm transition hover:border-emerald-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-emerald-500/30">
                        #{fp.fingerPrintID}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          Fingerprint #{fp.fingerPrintID}
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Type: {fp.fingerType || "Normal"} • Reader {fp.cardReaderNo || 1}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFingerprint(fp.fingerPrintID)}
                      disabled={deletingId === fp.fingerPrintID}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 p-0 rounded-lg transition"
                      title="Remove from terminal"
                    >
                      {deletingId === fp.fingerPrintID ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Changes sync automatically with device portal and attendance monitoring.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs font-semibold h-9 px-4 rounded-xl border-slate-300"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
