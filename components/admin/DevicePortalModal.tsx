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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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

  const handleSyncPersons = async () => {
    try {
      setIsSyncing(true);
      setSyncMessage(null);
      const res = await deviceService.syncPersons(device.id);
      setSyncMessage(res.message);
      fetchPortalData();
      if (onSyncSuccess) onSyncSuccess();
    } catch (err: any) {
      alert("Failed to sync persons: " + parseApiError(err));
    } finally {
      setIsSyncing(false);
    }
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
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search person or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 px-3 text-xs bg-white border border-slate-200 rounded-lg w-full sm:w-48 focus:outline-emerald-600"
              />
              <Button
                size="sm"
                onClick={handleSyncPersons}
                disabled={isSyncing}
                className="h-8 rounded-lg text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shrink-0 gap-1.5"
              >
                <Users className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Sync All to HRMS"}</span>
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
                      <th className="py-2.5 px-4 text-right">User Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.employeeNo} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-700">
                          {u.employeeNo}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {u.name}
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
                        <td className="py-2.5 px-4 text-right font-mono text-[11px] text-slate-500">
                          {u.userType || "normal"}
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
                      <th className="py-2.5 px-4">Employee ID</th>
                      <th className="py-2.5 px-4">Punch Time</th>
                      <th className="py-2.5 px-4">Verification Mode</th>
                      <th className="py-2.5 px-4">Punch Type</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data?.recentLogs || []).map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{l.employeeId}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">{new Date(l.punchTime).toLocaleString()}</td>
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            {l.verificationMode === "FACE" ? <ScanFace className="w-3.5 h-3.5 text-purple-600" /> : <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />}
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
      </DialogContent>
    </Dialog>
  );
};
