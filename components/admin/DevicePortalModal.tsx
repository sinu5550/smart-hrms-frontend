'use client';

import React, { useEffect, useState } from "react";
import { deviceService, BiometricDevice, BiometricRawLog } from "@/services/device.service";
import { parseApiError } from "@/services/api";
import {
  Server,
  Fingerprint,
  ScanFace,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  X,
  Users,
  Clock,
  ShieldCheck,
  AlertCircle,
  Video,
  UploadCloud,
  UserPlus,
  Edit2,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useEmployees } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";

interface DevicePortalModalProps {
  device: BiometricDevice;
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: () => void;
}

export const DevicePortalModal: React.FC<DevicePortalModalProps> = ({
  device,
  isOpen,
  onClose,
  onSyncSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    device: BiometricDevice;
    isTerminalReachable: boolean;
    totalTerminalUsers: number;
    terminalUsers: Array<{
      employeeNo: string;
      name: string;
      userType: string;
      hasFingerprint: boolean;
      numOfFP: number;
      hasFace: boolean;
      numOfFace: number;
    }>;
    recentLogs: BiometricRawLog[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"PERSONS" | "LIVE_PUNCHES" | "SYSTEM">("PERSONS");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const res = await deviceService.getDevicePortal(device.id);
      setData(res);
    } catch (err: any) {
      console.error("Portal load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPortalData();
    }
  }, [isOpen, device.id]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: "danger" | "warning" | "info" | "success" | "sync";
    badge?: string;
    isLoading?: boolean;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "sync",
    onConfirm: () => {},
  });

  const handleSyncPersons = () => {
    setConfirmModal({
      isOpen: true,
      title: "Sync All Persons to HRMS",
      description: `Pull all registered employees, face IDs, and fingerprints from "${device.deviceName}" into your employee directory?`,
      confirmText: "Sync Persons",
      variant: "sync",
      badge: "Hikvision MinMoe",
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          setIsSyncing(true);
          const res = await deviceService.syncPersons(device.id);
          setSyncMessage(res.message);
          fetchPortalData();
          queryClient.invalidateQueries({ queryKey: ["employees"] });
          if (onSyncSuccess) onSyncSuccess();
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err: any) {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
          alert("Failed to sync persons: " + parseApiError(err));
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  const { data: dbEmployees = [] } = useEmployees();
  const queryClient = useQueryClient();
  const [isPushingModalOpen, setIsPushingModalOpen] = useState(false);
  const [selectedPushEmployeeId, setSelectedPushEmployeeId] = useState("");
  const [isPushing, setIsPushing] = useState(false);

  // Edit person on device state
  const [editingPerson, setEditingPerson] = useState<{
    employeeNo: string;
    name: string;
  } | null>(null);
  const [editName, setEditName] = useState("");
  const [isUpdatingPerson, setIsUpdatingPerson] = useState(false);

  const handleOpenEditPerson = (u: { employeeNo: string; name: string }) => {
    setEditingPerson(u);
    setEditName(u.name);
  };

  const handleSavePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson || !editName.trim()) return;

    try {
      setIsUpdatingPerson(true);
      const res = await deviceService.updatePerson(device.id, {
        employeeNo: editingPerson.employeeNo,
        name: editName.trim(),
      });
      setSyncMessage(res.message);
      setEditingPerson(null);
      fetchPortalData();
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      if (onSyncSuccess) onSyncSuccess();
    } catch (err: any) {
      alert("Failed to update person on device: " + parseApiError(err));
    } finally {
      setIsUpdatingPerson(false);
    }
  };

  const handleDeletePerson = (u: any) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Person from ${device.deviceName}`,
      description: `Are you sure you want to delete "${u.name}" (ID: ${u.employeeNo}) from this Hikvision terminal? All biometric templates (faces & fingerprints) for this person on the hardware will be permanently wiped.`,
      confirmText: "Delete from Device",
      variant: "danger",
      badge: "Hardware ISAPI",
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          const res = await deviceService.deletePerson(device.id, u.employeeNo);
          setSyncMessage(res.message);
          fetchPortalData();
          queryClient.invalidateQueries({ queryKey: ["employees"] });
          queryClient.invalidateQueries({ queryKey: ["attendance"] });
          if (onSyncSuccess) onSyncSuccess();
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err: any) {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
          alert("Failed to delete person from device: " + parseApiError(err));
        }
      },
    });
  };

  const handlePushEmployee = async (employeeId: string, employeeName: string) => {
    try {
      setIsPushing(true);
      const res = await deviceService.pushEmployee(device.id, { employeeId });
      alert(`Success: ${res.message}`);
      setIsPushingModalOpen(false);
      setSelectedPushEmployeeId("");
      fetchPortalData();
      if (onSyncSuccess) onSyncSuccess();
    } catch (err: any) {
      alert("Failed to push employee to device: " + parseApiError(err));
    } finally {
      setIsPushing(false);
    }
  };

  const handlePushAllMissing = () => {
    // Find DB employees that are not yet on the terminal
    const terminalEmpNos = new Set((data?.terminalUsers || []).map((u) => u.employeeNo.trim()));
    const missing = dbEmployees.filter((emp) => {
      const cleanEmpId = emp.employeeId.trim();
      const stripped = cleanEmpId.replace(/-/g, "");
      return !terminalEmpNos.has(stripped) && !terminalEmpNos.has(cleanEmpId);
    });

    if (missing.length === 0) {
      alert("All active HRMS employees are already registered on this device!");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Push Missing Employees to Terminal",
      description: `Found ${missing.length} employee(s) in HRMS who are not yet on this Hikvision device. Push all of them now?`,
      confirmText: `Push ${missing.length} Employees`,
      variant: "sync",
      badge: "HRMS to Device",
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          let pushedCount = 0;
          for (const m of missing) {
            try {
              await deviceService.pushEmployee(device.id, { employeeId: m.employeeId });
              pushedCount++;
            } catch (e) {
              console.warn(`Could not push ${m.employeeId}:`, e);
            }
          }
          alert(`Successfully pushed ${pushedCount} of ${missing.length} employee(s) to ${device.deviceName}!`);
          fetchPortalData();
          if (onSyncSuccess) onSyncSuccess();
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err: any) {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
          alert("Error during bulk push: " + parseApiError(err));
        }
      },
    });
  };

  const [isSyncingPunches, setIsSyncingPunches] = useState(false);

  const handleSyncPunches = () => {
    setConfirmModal({
      isOpen: true,
      title: "Pull All Machine Punches",
      description: `Pull the latest punch verification logs (Face scans, Fingerprints, Cards) from "${device.deviceName}" and auto-record attendance?`,
      confirmText: "Pull Punches",
      variant: "sync",
      badge: "AcsEvent Logs",
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          setIsSyncingPunches(true);
          setSyncMessage(null);
          const res = await deviceService.syncPunches(device.id);
          setSyncMessage(res.message);
          fetchPortalData();
          queryClient.invalidateQueries({ queryKey: ["attendance"] });
          if (onSyncSuccess) onSyncSuccess();
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err: any) {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
          alert("Failed to sync punches: " + parseApiError(err));
        } finally {
          setIsSyncingPunches(false);
        }
      },
    });
  };

  if (!isOpen) return null;

  const terminalUsers = data?.terminalUsers || [];
  const filteredUsers = terminalUsers.filter((u) => {
    const q = searchTerm.toLowerCase().trim();
    return !q || u.name.toLowerCase().includes(q) || u.employeeNo.toLowerCase().includes(q);
  });

  const totalWithFP = terminalUsers.filter((u) => u.hasFingerprint).length;
  const totalWithFace = terminalUsers.filter((u) => u.hasFace).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-4xl p-0 overflow-hidden rounded-2xl bg-slate-50 border border-slate-200">
        {/* Header Bar */}
        <div className="p-5 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
                  {device.deviceName} Portal
                </DialogTitle>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    data?.isTerminalReachable
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${data?.isTerminalReachable ? "bg-emerald-600 animate-pulse" : "bg-rose-600"}`} />
                  {data?.isTerminalReachable ? "LIVE ONLINE" : "OFFLINE / UNREACHABLE"}
                </span>
              </div>
              <DialogDescription className="text-xs text-slate-500 font-mono mt-0.5">
                IP: {device.ipAddress || "Dynamic"} · Model: {device.deviceModel} · S/N: {device.deviceSerialNumber}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPortalData}
              disabled={loading}
              className="h-8 rounded-lg text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Sync alert banner */}
        {syncMessage && (
          <div className="px-5 py-2.5 bg-emerald-100/70 border-b border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-between">
            <span>{syncMessage}</span>
            <button onClick={() => setSyncMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">×</button>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 pb-0">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Terminal Persons</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-slate-900 mt-1">{terminalUsers.length}</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Fingerprint Enrolled</span>
              <Fingerprint className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-emerald-700 mt-1">
              {totalWithFP} <span className="text-xs font-normal text-slate-400">/ {terminalUsers.length}</span>
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Face Enrolled</span>
              <ScanFace className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xl font-bold text-purple-700 mt-1">
              {totalWithFace} <span className="text-xs font-normal text-slate-400">/ {terminalUsers.length}</span>
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Punches</span>
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xl font-bold text-slate-900 mt-1">{device.totalLogsSynced}</p>
          </div>
        </div>

        {/* Tab Controls & Actions */}
        <div className="px-5 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab("PERSONS")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "PERSONS" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Registered Persons ({terminalUsers.length})
            </button>
            <button
              onClick={() => setActiveTab("LIVE_PUNCHES")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "LIVE_PUNCHES" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Recent Hardware Punches
            </button>
            <button
              onClick={() => setActiveTab("SYSTEM")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "SYSTEM" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hardware Info
            </button>
          </div>

          {activeTab === "PERSONS" && (
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <input
                type="text"
                placeholder="Search person or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 px-3 text-xs bg-white border border-slate-200 rounded-lg w-full sm:w-44 focus:outline-emerald-600"
              />
              <Button
                size="sm"
                onClick={() => setIsPushingModalOpen(true)}
                className="h-8 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shrink-0 gap-1.5"
                title="Send an HRMS employee into this Hikvision device"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Push Employee to Device</span>
              </Button>
              <Button
                size="sm"
                onClick={handlePushAllMissing}
                variant="outline"
                className="h-8 rounded-lg text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-50 shrink-0 gap-1.5"
                title="Push all HRMS employees who are not registered on this device"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Auto-Push Missing</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSyncPersons}
                disabled={isSyncing}
                className="h-8 rounded-lg text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shrink-0 gap-1.5"
                title="Pull persons registered on machine into HRMS"
              >
                <Users className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Pull from Machine"}</span>
              </Button>
            </div>
          )}

          {activeTab === "LIVE_PUNCHES" && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                size="sm"
                onClick={handleSyncPunches}
                disabled={isSyncingPunches}
                className="h-8 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shrink-0 gap-1.5 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPunches ? "animate-spin" : ""}`} />
                <span>{isSyncingPunches ? "Pulling..." : "Pull All Machine Punches"}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Tab 1: Terminal Persons with Green/Gray indicators */}
        {activeTab === "PERSONS" && (
          <div className="p-5 pt-3">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs max-h-[360px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-700 mb-2" />
                  Connecting to Hikvision terminal ISAPI...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No registered persons found on this terminal.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Terminal ID</th>
                      <th className="py-2.5 px-4">Person Name</th>
                      <th className="py-2.5 px-4 text-center">Fingerprint Status</th>
                      <th className="py-2.5 px-4 text-center">Face Recognition</th>
                      <th className="py-2.5 px-4 text-center">User Type</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.employeeNo} className="hover:bg-slate-50/60 transition group">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-700">
                          {u.employeeNo}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{u.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {u.hasFingerprint ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title={`Enrolled Fingerprints: ${u.numOfFP}`}>
                              <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Enrolled ({u.numOfFP})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-400 border border-slate-200" title="No fingerprint enrolled on device">
                              <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                              <span>Not Enrolled</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {u.hasFace ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200" title="Face template registered">
                              <ScanFace className="w-3.5 h-3.5 text-purple-600" />
                              <span>Enrolled</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-400 border border-slate-200" title="No face registered on device">
                              <ScanFace className="w-3.5 h-3.5 text-slate-400" />
                              <span>No Face</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-[11px] text-slate-500">
                          {u.userType || "normal"}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditPerson(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition border border-slate-200 shadow-2xs"
                              title={`Edit Person Name on ${device.deviceName}`}
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeletePerson(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 transition border border-slate-200 shadow-2xs"
                              title={`Delete ${u.name} (${u.employeeNo}) from ${device.deviceName}`}
                            >
                              <Trash2 className="w-3 h-3 text-rose-500" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Recent Raw Punches */}
        {activeTab === "LIVE_PUNCHES" && (
          <div className="p-5 pt-3">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs max-h-[360px] overflow-y-auto">
              {(data?.recentLogs || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No punch logs recorded for this terminal yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Employee</th>
                      <th className="py-2.5 px-4">Punch Time</th>
                      <th className="py-2.5 px-4">Verification Mode</th>
                      <th className="py-2.5 px-4">Punch Type</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data?.recentLogs || []).map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900 text-xs">
                            {l.employeeName || l.employeeId}
                          </div>
                          {l.employeeName && (
                            <div className="font-mono text-[11px] text-slate-400">
                              {l.employeeId}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">{new Date(l.punchTime).toLocaleString()}</td>
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            {l.verificationMode === "FACE" || l.verificationMode === "FACE_SCAN" ? (
                              <ScanFace className="w-3.5 h-3.5 text-purple-600" />
                            ) : (
                              <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            {l.verificationMode}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-emerald-700">{l.punchType}</td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {l.syncStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Hardware Diagnostics */}
        {activeTab === "SYSTEM" && (
          <div className="p-5 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Network Configuration</h4>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">IP Address:</span>
                <span className="font-mono font-semibold text-slate-800">{device.ipAddress}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">ISAPI / HTTPS Port:</span>
                <span className="font-mono font-semibold text-slate-800">443 / {device.port}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Username:</span>
                <span className="font-mono font-semibold text-slate-800">{device.username || "admin"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Auth Scheme:</span>
                <span className="font-mono font-semibold text-emerald-700">HTTP Digest (MD5)</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Device Specification</h4>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Terminal Model:</span>
                <span className="font-semibold text-slate-800">{device.deviceModel}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Serial Number:</span>
                <span className="font-mono font-semibold text-slate-800">{device.deviceSerialNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Physical Location:</span>
                <span className="font-semibold text-slate-800">{device.locationName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Device Status:</span>
                <span className="font-bold text-emerald-700">{device.status}</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Hikvision MinMoe Terminals communicate via secure local network ISAPI.
          </p>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs font-semibold">
            Close Portal
          </Button>
        </div>

        {/* Reusable Cute Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmText={confirmModal.confirmText}
          variant={confirmModal.variant}
          badge={confirmModal.badge}
          isLoading={confirmModal.isLoading}
        />

        {/* Modal: Select an HRMS Employee to push to this device */}
        {isPushingModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in-0 zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Push Employee to Machine</h3>
                    <p className="text-[11px] text-slate-400">Target Terminal: {device.deviceName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPushingModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 block">
                  Select Employee from HRMS Directory:
                </label>
                <select
                  value={selectedPushEmployeeId}
                  onChange={(e) => setSelectedPushEmployeeId(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-medium"
                >
                  <option value="">-- Choose an employee --</option>
                  {dbEmployees.map((emp) => (
                    <option key={emp.id} value={emp.employeeId}>
                      {emp.fullName} ({emp.employeeId})
                    </option>
                  ))}
                </select>

                <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  ℹ️ Once pushed, this employee profile will be registered on the Hikvision terminal with door access rights. The employee can then enroll their face or fingerprint directly at the machine.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPushingModalOpen(false)}
                  disabled={isPushing}
                  className="h-9 px-4 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedPushEmployeeId || isPushing}
                  onClick={() => {
                    const emp = dbEmployees.find((e) => e.employeeId === selectedPushEmployeeId);
                    if (emp) handlePushEmployee(emp.employeeId, emp.fullName);
                  }}
                  className="h-9 px-4 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-2xs transition cursor-pointer"
                >
                  {isPushing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending to Terminal...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Push to Terminal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Person Modal */}
        {editingPerson && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Edit Terminal Person</h3>
                    <p className="text-[11px] text-slate-500">
                      Sync name directly to {device.deviceName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPerson(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePerson} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Terminal ID (Machine Key)
                  </label>
                  <Input
                    disabled
                    value={editingPerson.employeeNo}
                    className="font-mono bg-slate-100 text-slate-600 cursor-not-allowed text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Biometric templates (Face/Fingerprints) on the hardware are anchored to this ID.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Person Name *
                  </label>
                  <Input
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. KAMRUL"
                    maxLength={32}
                    className="text-xs font-medium text-slate-800 focus:border-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Displayed on the terminal screen during face & fingerprint verification.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingPerson}
                    onClick={() => setEditingPerson(null)}
                    className="h-9 px-3.5 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!editName.trim() || isUpdatingPerson}
                    className="h-9 px-4 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 shadow-2xs"
                  >
                    {isUpdatingPerson ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Hardware...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Update Device & HRMS</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
