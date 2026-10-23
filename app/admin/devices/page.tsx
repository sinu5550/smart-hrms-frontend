'use client';

import React, { useState } from "react";
import {
  useBiometricDevices,
  useBiometricRawLogs,
  useRegisterBiometricDevice,
  useDeleteBiometricDevice,
} from "@/hooks";
import { parseApiError } from "@/services/api";
import { BiometricDevice } from "@/services/device.service";
import {
  Cpu,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Fingerprint,
  Radio,
  Server,
  Activity,
  Clock,
  MapPin,
} from "lucide-react";

export default function BiometricDevicesAdminPage() {
  const { data: devices = [], isLoading: isLoadingDevices } = useBiometricDevices();
  const { data: rawLogs = [], isLoading: isLoadingLogs } = useBiometricRawLogs();
  const registerDeviceMutation = useRegisterBiometricDevice();
  const deleteDeviceMutation = useDeleteBiometricDevice();

  const [activeTab, setActiveTab] = useState<"DEVICES" | "LIVE_STREAM">("DEVICES");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    deviceName: "",
    deviceSerialNumber: "",
    deviceModel: "ZKTeco BioStation 3 / ADMS",
    ipAddress: "192.168.1.201",
    port: 4370,
    locationName: "Main Factory Entrance",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.deviceName.trim() || !form.deviceSerialNumber.trim()) return;

    try {
      setMessage(null);
      await registerDeviceMutation.mutateAsync({
        deviceName: form.deviceName.trim(),
        deviceSerialNumber: form.deviceSerialNumber.trim(),
        deviceModel: form.deviceModel.trim(),
        ipAddress: form.ipAddress.trim() || undefined,
        port: Number(form.port) || 4370,
        locationName: form.locationName.trim() || "Main Gate",
      });

      setForm({
        deviceName: "",
        deviceSerialNumber: "",
        deviceModel: "ZKTeco BioStation 3 / ADMS",
        ipAddress: "192.168.1.201",
        port: 4370,
        locationName: "Main Factory Entrance",
      });
      setIsModalOpen(false);
      setMessage({ type: "success", text: "Biometric machine registered successfully!" });
    } catch (err: any) {
      alert(parseApiError(err));
    }
  };

  const handleDelete = async (dev: BiometricDevice) => {
    if (!confirm(`Are you sure you want to remove device "${dev.deviceName}" (${dev.deviceSerialNumber})?`)) return;
    try {
      await deleteDeviceMutation.mutateAsync(dev.id);
      setMessage({ type: "success", text: `Device "${dev.deviceName}" unlinked.` });
    } catch (err: any) {
      alert(parseApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-emerald-700" />
            Biometric & IoT Hardware Integration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Connect ZKTeco, Hikvision, and RFID attendance machines for real-time punch synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-lg">
            <button
              onClick={() => setActiveTab("DEVICES")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === "DEVICES"
                  ? "bg-white text-emerald-800 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Registered Terminals ({devices.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("LIVE_STREAM")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === "LIVE_STREAM"
                  ? "bg-white text-emerald-800 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Live Punch Ingestion</span>
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Device</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* ================= TAB 1: REGISTERED DEVICES ================= */}
      {activeTab === "DEVICES" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoadingDevices ? (
            <div className="col-span-3 text-center py-12 text-xs text-slate-400">Loading hardware terminals...</div>
          ) : devices.length === 0 ? (
            <div className="col-span-3 bg-white border border-slate-200 rounded-lg p-10 text-center space-y-3">
              <Cpu className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No Biometric Machines Connected</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Register your ZKTeco or ADMS attendance device serial number to start capturing biometric punches automatically.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Machine</span>
              </button>
            </div>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{device.deviceName}</h3>
                      <p className="text-[10px] text-slate-500 font-mono">{device.deviceSerialNumber}</p>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    ONLINE
                  </span>
                </div>

                <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Location:</span>
                    <span className="font-semibold text-slate-700">{device.locationName}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Device IP:</span>
                    <span className="font-mono text-slate-700">{device.ipAddress || "Dynamic / Push Mode"}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Logs Ingested:</span>
                    <span className="font-bold text-emerald-700">{device.totalLogsSynced} punches</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Model: {device.deviceModel}</span>
                  <button
                    onClick={() => handleDelete(device)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                    title="Remove device"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ================= TAB 2: LIVE PUNCH STREAM ================= */}
      {activeTab === "LIVE_STREAM" && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                Live Terminal Ingestion Feed
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time raw biometric logs pushed from terminals into database.
              </p>
            </div>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
              Auto-refreshing every 10s
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5">Employee ID</th>
                  <th className="p-2.5">Device Terminal</th>
                  <th className="p-2.5">Method</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rawLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                      No hardware punches received yet today.
                    </td>
                  </tr>
                ) : (
                  rawLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-2.5 font-mono text-[11px] text-slate-600">
                        {new Date(log.punchTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td className="p-2.5 font-bold text-slate-800">{log.employeeId}</td>
                      <td className="p-2.5 text-slate-600">
                        {log.device?.deviceName || log.deviceSerialNumber}
                      </td>
                      <td className="p-2.5">
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {log.verificationMode}
                        </span>
                      </td>
                      <td className="p-2.5 font-semibold text-slate-700">{log.punchType}</td>
                      <td className="p-2.5 text-right">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          {log.syncStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= REGISTER MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Register Biometric Terminal</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Device Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Factory Gate A"
                  value={form.deviceName}
                  onChange={(e) => setForm({ ...form, deviceName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Serial Number (SN) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ZK982347102"
                  value={form.deviceSerialNumber}
                  onChange={(e) => setForm({ ...form, deviceSerialNumber: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">IP Address (Optional)</label>
                  <input
                    type="text"
                    placeholder="192.168.1.201"
                    value={form.ipAddress}
                    onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Port</label>
                  <input
                    type="number"
                    value={form.port}
                    onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Physical Location</label>
                <input
                  type="text"
                  placeholder="e.g. Floor 2 Turnstile"
                  value={form.locationName}
                  onChange={(e) => setForm({ ...form, locationName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerDeviceMutation.isPending}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {registerDeviceMutation.isPending ? "Connecting..." : "Save Terminal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
