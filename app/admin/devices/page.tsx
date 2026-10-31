'use client';

import React, { useState } from "react";
import {
  useBiometricDevices,
  useBiometricRawLogs,
  useRegisterBiometricDevice,
  useDeleteBiometricDevice,
  useOfficeNetworks,
  useAddOfficeNetwork,
  useDeleteOfficeNetwork,
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
  ScanFace,
  QrCode,
  ShieldCheck,
  Printer,
  Download,
  Copy,
  ExternalLink,
  Video,
  Eye,
  EyeOff,
  KeyRound,
  Users,
} from "lucide-react";
import { deviceService } from "@/services/device.service";
import { OrganizationService } from "@/services/organization.service";
import { useAuth } from "@/components/auth/AuthProvider";
import { DevicePortalModal } from "@/components/admin/DevicePortalModal";
import { ConfirmModal, ConfirmationVariant } from "@/components/ui/ConfirmModal";
import { useQueryClient } from "@tanstack/react-query";

export default function BiometricDevicesAdminPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isOwnerOrAdmin = user?.role === "ADMIN" || user?.role === "PLATFORM_ADMIN" || user?.email === user?.organization?.ownerEmail;
  const userPerms = Array.isArray(user?.permissions) ? user.permissions : [];

  const canManageDevices = isOwnerOrAdmin || userPerms.includes("devices.manage");
  const canManageWifi = isOwnerOrAdmin || userPerms.includes("devices.wifi");
  const canManageQr = isOwnerOrAdmin || userPerms.includes("devices.qr") || userPerms.includes("devices.view");
  const canViewDevices = isOwnerOrAdmin || userPerms.includes("devices.view");

  const { data: devices = [], isLoading: isLoadingDevices } = useBiometricDevices();
  const { data: rawLogs = [], isLoading: isLoadingLogs } = useBiometricRawLogs();
  const { data: networks = [], isLoading: isLoadingNetworks } = useOfficeNetworks();

  const registerDeviceMutation = useRegisterBiometricDevice();
  const deleteDeviceMutation = useDeleteBiometricDevice();
  const addNetworkMutation = useAddOfficeNetwork();
  const deleteNetworkMutation = useDeleteOfficeNetwork();

  const [activeTab, setActiveTab] = useState<"DEVICES" | "WIFI_NETWORKS" | "QR_POSTER" | "LIVE_STREAM">("DEVICES");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);

  // QR Code Generation state
  const [qrData, setQrData] = useState<{
    organization: { id: string; name: string; slug: string; employeePrefix: string; logoUrl?: string | null };
    officeNetworks: Array<{ id: string; locationName: string; allowedPublicIp: string }>;
    primaryIp: string;
    qrPayload: string;
    qrDataUrl: string;
    staticOfficeSecret: string;
  } | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const loadQrCode = async () => {
    try {
      setIsLoadingQr(true);
      const res = await deviceService.getQrCode();
      setQrData(res);
    } catch (err: any) {
      alert("Failed to generate QR code: " + parseApiError(err));
    } finally {
      setIsLoadingQr(false);
    }
  };

  const handlePrintQr = () => {
    window.print();
  };

  const [form, setForm] = useState({
    deviceName: "Hikvision Main Gate",
    deviceSerialNumber: "",
    deviceModel: "Hikvision MinMoe (Face & Fingerprint Terminal)",
    ipAddress: "192.168.68.69",
    port: 80,
    username: "admin",
    password: "",
    locationName: "Main Entrance",
  });

  const [activePreviewDevice, setActivePreviewDevice] = useState<BiometricDevice | null>(null);
  const [portalDevice, setPortalDevice] = useState<BiometricDevice | null>(null);
  const [snapshotTimestamp, setSnapshotTimestamp] = useState<number>(Date.now());
  const [isLiveStreamPlaying, setIsLiveStreamPlaying] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Live snapshot refresh timer (every 1 second when modal is open)
  React.useEffect(() => {
    if (!activePreviewDevice || !isLiveStreamPlaying) return;
    const interval = setInterval(() => {
      setSnapshotTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [activePreviewDevice, isLiveStreamPlaying]);

  const [wifiForm, setWifiForm] = useState({
    locationName: "HQ Office Wi-Fi",
    allowedPublicIp: "",
    subnetMask: "255.255.255.0",
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
        port: Number(form.port) || 80,
        username: form.username.trim() || "admin",
        password: form.password.trim() || undefined,
        locationName: form.locationName.trim() || "Main Gate",
      });

      setForm({
        deviceName: "Hikvision Main Gate",
        deviceSerialNumber: "",
        deviceModel: "Hikvision MinMoe (Face & Fingerprint Terminal)",
        ipAddress: "192.168.68.69",
        port: 80,
        username: "admin",
        password: "",
        locationName: "Main Entrance",
      });
      setIsModalOpen(false);
      setMessage({ type: "success", text: "Biometric attendance terminal registered successfully!" });
    } catch (err: any) {
      alert(parseApiError(err));
    }
  };

  const handleAddWifi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wifiForm.allowedPublicIp.trim()) return;

    try {
      setMessage(null);
      await addNetworkMutation.mutateAsync({
        locationName: wifiForm.locationName.trim(),
        allowedPublicIp: wifiForm.allowedPublicIp.trim(),
        subnetMask: wifiForm.subnetMask.trim() || undefined,
      });

      setWifiForm({
        locationName: "HQ Office Wi-Fi",
        allowedPublicIp: "",
        subnetMask: "255.255.255.0",
      });
      setIsWifiModalOpen(false);
      setMessage({ type: "success", text: "Office Wi-Fi IP location registered successfully!" });
    } catch (err: any) {
      alert(parseApiError(err));
    }
  };

  // Reusable confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmationVariant;
    badge?: string;
    isLoading?: boolean;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    variant: "info",
    onConfirm: () => {},
  });

  const handleDelete = (dev: BiometricDevice) => {
    setConfirmModal({
      isOpen: true,
      title: "Remove Biometric Device",
      description: `Are you sure you want to remove "${dev.deviceName}" (S/N: ${dev.deviceSerialNumber})? This will unlink it from attendance logging.`,
      confirmText: "Remove Device",
      variant: "danger",
      badge: "Warning",
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          await deleteDeviceMutation.mutateAsync(dev.id);
          setMessage({ type: "success", text: `Device "${dev.deviceName}" unlinked successfully.` });
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err: any) {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
          alert(parseApiError(err));
        }
      },
    });
  };

  const [syncingPersonsId, setSyncingPersonsId] = useState<string | null>(null);

  const handleSyncPersons = (dev: BiometricDevice) => {
    if (!dev.ipAddress) {
      alert("Device IP is required to sync persons from Hikvision.");
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: "Sync Persons from Terminal",
      description: `Pull all registered employees, face IDs, and fingerprints from "${dev.deviceName}" (${dev.ipAddress}) into the HRM Software employee list?`,
      confirmText: "Start Sync",
      variant: "sync",
      badge: "Hikvision MinMoe",
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          setSyncingPersonsId(dev.id);
          setMessage(null);
          const res = await deviceService.syncPersons(dev.id);
          setMessage({
            type: "success",
            text: res.message || `Successfully synced ${res.totalFound} persons (${res.importedCount} added, ${res.updatedCount} updated).`,
          });
          queryClient.invalidateQueries({ queryKey: ["employees"] });
          queryClient.invalidateQueries({ queryKey: ["devices"] });
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err: any) {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
          alert("Failed to sync persons: " + parseApiError(err));
        } finally {
          setSyncingPersonsId(null);
        }
      },
    });
  };

  const handleDeleteWifi = (id: string, ip: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Remove Office Wi-Fi Network",
      description: `Are you sure you want to remove IP "${ip}"? Employees connected to this network will no longer be verified by office geofencing.`,
      confirmText: "Remove Wi-Fi",
      variant: "danger",
      badge: "Office Geofence",
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          await deleteNetworkMutation.mutateAsync(id);
          setMessage({ type: "success", text: `Office Wi-Fi IP ${ip} removed successfully.` });
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err: any) {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
          alert(parseApiError(err));
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-emerald-700" />
            Biometric Hardware & Wi-Fi Location Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure Hikvision Face/Fingerprint Terminals, Office Wi-Fi Public IPs, and Dynamic QR Attendance.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          {/* Tab Switcher - Horizontal scroll on mobile */}
          <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setActiveTab("DEVICES")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition ${
                activeTab === "DEVICES"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Biometric ({devices.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("WIFI_NETWORKS")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition ${
                activeTab === "WIFI_NETWORKS"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Wifi className="w-3.5 h-3.5 text-blue-600" />
              <span>Wi-Fi IPs ({networks.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("QR_POSTER");
                loadQrCode();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition ${
                activeTab === "QR_POSTER"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>QR Poster</span>
            </button>
            <button
              onClick={() => setActiveTab("LIVE_STREAM")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition ${
                activeTab === "LIVE_STREAM"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Live Feed</span>
            </button>
          </div>

          {activeTab === "DEVICES" && canManageDevices && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 sm:mt-0 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition w-full sm:w-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Biometric Machine</span>
            </button>
          )}

          {activeTab === "WIFI_NETWORKS" && canManageWifi && (
            <button
              onClick={() => setIsWifiModalOpen(true)}
              className="mt-2 sm:mt-0 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition w-full sm:w-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Wi-Fi IP Rule</span>
            </button>
          )}
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
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {device.ipAddress && (
                      <>
                        <button
                          onClick={() => setPortalDevice(device)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-2xs transition"
                          title="Open Device Management Portal (Fingerprint/Face details)"
                        >
                          <Server className="w-3.5 h-3.5 text-slate-700" />
                          <span>Device Portal</span>
                        </button>
                        <button
                          onClick={() => handleSyncPersons(device)}
                          disabled={syncingPersonsId === device.id}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-2xs transition disabled:opacity-50"
                          title="Sync all persons/employees registered on this Hikvision machine"
                        >
                          <Users className={`w-3.5 h-3.5 text-blue-700 ${syncingPersonsId === device.id ? "animate-spin" : ""}`} />
                          <span>{syncingPersonsId === device.id ? "Syncing..." : "Sync"}</span>
                        </button>
                        <button
                          onClick={() => {
                            setActivePreviewDevice(device);
                            setIsLiveStreamPlaying(true);
                            setSnapshotTimestamp(Date.now());
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-2xs transition"
                          title="View Live Camera Feed"
                        >
                          <Video className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Live Camera</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(device)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      title="Remove device"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ================= TAB 2: OFFICE WI-FI IP LOCATIONS ================= */}
      {activeTab === "WIFI_NETWORKS" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Owner Admin Wi-Fi Location Security</p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Only employees connected to these authorized office Wi-Fi public IP addresses can punch attendance or start/end breaks from the ESS Mobile PWA.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-blue-600" />
                  Allowed Office Wi-Fi IP Whitelist
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Static public IP addresses of your company routers & internet lines.
                </p>
              </div>

              <button
                onClick={() => setIsWifiModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add IP Address</span>
              </button>
            </div>

            {isLoadingNetworks ? (
              <div className="text-center py-8 text-xs text-slate-400">Loading office Wi-Fi rules...</div>
            ) : networks.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <WifiOff className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No Office Wi-Fi IPs Registered</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Add your office Wi-Fi public IP (e.g. 103.145.120.45) so employees can clock in while connected to office Wi-Fi.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {networks.map((net) => (
                  <div
                    key={net.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between shadow-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Wifi className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-bold text-slate-800">{net.locationName}</span>
                      </div>
                      <p className="text-xs font-mono font-semibold text-blue-700">{net.allowedPublicIp}</p>
                      {net.subnetMask && (
                        <p className="text-[10px] text-slate-400 font-mono">Mask: {net.subnetMask}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteWifi(net.id, net.allowedPublicIp)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      title="Remove IP rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: OFFICE QR POSTER ================= */}
      {activeTab === "QR_POSTER" && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-700" />
                Office Attendance Dynamic QR Code
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Print and mount this official QR sign at your office reception or front door.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadQrCode}
                disabled={isLoadingQr}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQr ? "animate-spin" : ""}`} />
                <span>Regenerate Signature</span>
              </button>
              <button
                onClick={handlePrintQr}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Poster</span>
              </button>
            </div>
          </div>

          {isLoadingQr && !qrData ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700">Generating cryptographic tenant QR code...</p>
            </div>
          ) : qrData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left 2 Cols: The Printable Office Sign */}
              <div className="md:col-span-2 flex justify-center">
                <div
                  id="printable-office-poster"
                  className="bg-white border-2 border-emerald-600/60 rounded-2xl p-8 max-w-md w-full shadow-lg text-center space-y-6 relative overflow-hidden"
                >
                  {/* Decorative Header Accent */}
                  <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700" />

                  {/* Organization Logo & Brand */}
                  <div className="space-y-2 pt-2">
                    {qrData.organization.logoUrl ? (
                      <img
                        src={qrData.organization.logoUrl}
                        alt={qrData.organization.name}
                        className="w-16 h-16 object-contain mx-auto rounded-lg border border-slate-200 p-1 bg-white shadow-xs"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xl flex items-center justify-center mx-auto border border-emerald-300 shadow-xs">
                        {qrData.organization.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      {qrData.organization.name}
                    </h3>
                    <p className="text-xs uppercase font-extrabold text-emerald-700 tracking-wider">
                      Official Check-In Terminal
                    </p>
                  </div>

                  {/* High Quality Scannable QR Code */}
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 inline-block mx-auto shadow-inner">
                    <img
                      src={qrData.qrDataUrl}
                      alt="Office Check-in QR"
                      className="w-64 h-64 mx-auto rounded-lg shadow-sm"
                    />
                  </div>

                  {/* Verification Tag & Scan Instructions */}
                  <div className="space-y-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Cryptographically Signed QR</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Open your Employee PWA Portal on your mobile phone, select <b>Scan Office QR</b>, and align your camera with this code to punch in.
                    </p>
                  </div>

                  {/* Footer Security Badges */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Tenant ID: {qrData.organization.id.slice(0, 8)}...</span>
                    <span>Prefix: {qrData.organization.employeePrefix}</span>
                  </div>
                </div>
              </div>

              {/* Right Col: Parameters & Configuration Details */}
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Tenant Signature Parameters
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium">Tenant Organization</span>
                      <p className="font-bold text-slate-800">{qrData.organization.name}</p>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 font-medium">Organization UUID</span>
                      <p className="font-mono text-[11px] text-slate-700 break-all bg-slate-50 p-1.5 rounded border border-slate-200">
                        {qrData.organization.id}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 font-medium">Bound Office Wi-Fi IP</span>
                      <p className="font-mono font-bold text-blue-700">
                        {qrData.primaryIp} {qrData.primaryIp === "127.0.0.1" ? "(Localhost Dev)" : "(Public IP)"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 font-medium">Raw Payload (Auto-Detected)</span>
                      <div className="relative mt-1">
                        <textarea
                          readOnly
                          rows={4}
                          value={qrData.qrPayload}
                          className="w-full text-[10px] font-mono bg-slate-50 p-2 rounded border border-slate-200 text-slate-600 resize-none focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(qrData.qrPayload);
                            setCopiedPayload(true);
                            setTimeout(() => setCopiedPayload(false), 2000);
                          }}
                          className="absolute right-2 bottom-3 px-2 py-1 bg-white border border-slate-300 text-[10px] font-bold rounded shadow-xs hover:bg-slate-50 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3 text-slate-600" />
                          <span>{copiedPayload ? "Copied!" : "Copy Payload"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <a
                        href={qrData.qrDataUrl}
                        download={`${qrData.organization.name.toLowerCase().replace(/\s+/g, "_")}_qr_sign.png`}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download High-Res PNG</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    Office Wi-Fi IP Protection
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    When employees scan this QR code, the system verifies both the cryptographically signed tenant signature <b>and</b> ensures their device is connected to your whitelisted office router IP.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
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
                  <th className="p-2.5">Employee</th>
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
                      <td className="p-2.5">
                        <div className="font-bold text-slate-800 text-xs">
                          {log.employeeName || log.employeeId}
                        </div>
                        {log.employeeName && (
                          <div className="font-mono text-[11px] text-slate-400">
                            {log.employeeId}
                          </div>
                        )}
                      </td>
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
                <label className="text-xs font-semibold text-slate-700">Hardware Brand & Model *</label>
                <select
                  value={form.deviceModel}
                  onChange={(e) => {
                    const val = e.target.value;
                    const isHik = val.toLowerCase().includes("hikvision");
                    setForm({
                      ...form,
                      deviceModel: val,
                      port: isHik ? 8000 : 4370,
                    });
                  }}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="Hikvision MinMoe (Face & Fingerprint Terminal)">
                    Hikvision MinMoe Face & Fingerprint Terminal (DS-K1T Series - Port 8000)
                  </option>
                  <option value="Hikvision Pro Series Face Terminal">
                    Hikvision Pro Series Face Terminal (DS-K1T671 - Port 8000)
                  </option>
                  <option value="ZKTeco BioStation 3 / ADMS">
                    ZKTeco BioStation 3 / ADMS (Fingerprint & RFID - Port 4370)
                  </option>
                  <option value="ZKTeco SpeedFace-V5L">
                    ZKTeco SpeedFace-V5L (Face + Fingerprint - Port 4370)
                  </option>
                  <option value="Other Generic Biometric / Webhook Terminal">
                    Other Generic Biometric Terminal
                  </option>
                </select>
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

              {/* Dynamic Camera & Terminal Credentials */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Device Camera & Admin Credentials</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">Username</label>
                    <input
                      type="text"
                      placeholder="admin"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">Password</label>
                    <div className="relative mt-0.5">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Device password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full px-2.5 py-1.5 pr-8 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Used by our secure server proxy to stream live camera frames from the terminal into the web portal.
                </p>
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

      {/* ================= MODAL: ADD OFFICE WI-FI IP ================= */}
      {isWifiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wifi className="w-4 h-4 text-blue-600" />
                Add Office Wi-Fi IP Location
              </h3>
              <button
                onClick={() => setIsWifiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddWifi} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Location / Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Head Office 4th Floor Wi-Fi"
                  value={wifiForm.locationName}
                  onChange={(e) => setWifiForm({ ...wifiForm, locationName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Allowed Public IP Address *</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setWifiForm({ ...wifiForm, allowedPublicIp: "127.0.0.1" })}
                      className="text-[10px] text-blue-700 hover:underline font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                    >
                      + Use Localhost (127.0.0.1)
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        let detectedIp = "";
                        try {
                          const res = await OrganizationService.getMyIp();
                          if (res?.ip) detectedIp = res.ip;
                        } catch {
                          // Fallback to external IP lookup
                        }

                        if (!detectedIp) {
                          try {
                            const res = await fetch("https://api.ipify.org?format=json");
                            const data = await res.json();
                            if (data?.ip) detectedIp = data.ip;
                          } catch {
                            // Ignore
                          }
                        }

                        if (detectedIp) {
                          setWifiForm({ ...wifiForm, allowedPublicIp: detectedIp });
                        } else {
                          alert("Could not auto-fetch IP. You can check whatismyip.com or use 127.0.0.1 for local testing.");
                        }
                      }}
                      className="text-[10px] text-emerald-700 hover:underline font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                    >
                      ⚡ Auto-Detect My Public IP
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 103.145.120.45 or 127.0.0.1"
                  value={wifiForm.allowedPublicIp}
                  onChange={(e) => setWifiForm({ ...wifiForm, allowedPublicIp: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2 text-xs rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Employees connected to this office router IP will be allowed to punch in. For local development, whitelist <b>127.0.0.1</b>.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Subnet Mask (Optional)</label>
                <input
                  type="text"
                  placeholder="255.255.255.0"
                  value={wifiForm.subnetMask}
                  onChange={(e) => setWifiForm({ ...wifiForm, subnetMask: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWifiModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addNetworkMutation.isPending}
                  className="px-5 py-2 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {addNetworkMutation.isPending ? "Saving..." : "Whitelist Wi-Fi IP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================= MODAL: LIVE CAMERA PREVIEW ================= */}
      {activePreviewDevice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full p-5 space-y-4 shadow-2xl text-white animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Video className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{activePreviewDevice.deviceName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      LIVE FEED
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {activePreviewDevice.ipAddress} &bull; {activePreviewDevice.deviceSerialNumber} &bull; {activePreviewDevice.locationName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActivePreviewDevice(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold transition"
              >
                &times;
              </button>
            </div>

            {/* Video Snapshot Frame */}
            <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group shadow-inner">
              {activePreviewDevice.ipAddress ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={snapshotTimestamp}
                  src={`${
                    process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000"
                  }/api/devices/${activePreviewDevice.id}/snapshot?token=${
                    typeof window !== "undefined" ? localStorage.getItem("access_token") || "" : ""
                  }&t=${snapshotTimestamp}`}
                  alt="Live Camera Snapshot"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const errEl = document.getElementById("camera-error-banner");
                    if (errEl) errEl.style.display = "flex";
                  }}
                  onLoad={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "block";
                    const errEl = document.getElementById("camera-error-banner");
                    if (errEl) errEl.style.display = "none";
                  }}
                />
              ) : null}

              {/* Error fallback overlay */}
              <div
                id="camera-error-banner"
                style={{ display: "none" }}
                className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-2 text-rose-300"
              >
                <AlertCircle className="w-8 h-8 text-rose-500" />
                <p className="text-xs font-bold text-white">Live Camera Signal Connecting...</p>
                <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                  Checking connection to <b>{activePreviewDevice.ipAddress}</b>. Ensure your computer and Hikvision device are on the same Wi-Fi network and device password is saved.
                </p>
              </div>

              {/* Bottom camera info overlay */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-3 py-1.5 bg-black/60 backdrop-blur-xs rounded-lg text-[10px] text-slate-300 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  REC &bull; 1080P &bull; Channel 101
                </span>
                <span>{new Date(snapshotTimestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Controls & Quick Links */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLiveStreamPlaying(!isLiveStreamPlaying)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    isLiveStreamPlaying
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{isLiveStreamPlaying ? "Auto-Refreshing (1s)" : "Paused"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSnapshotTimestamp(Date.now())}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Frame</span>
                </button>
              </div>

              <a
                href={`https://${activePreviewDevice.ipAddress}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline font-semibold"
              >
                <span>Open Device Web Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {portalDevice && (
        <DevicePortalModal
          device={portalDevice}
          isOpen={Boolean(portalDevice)}
          onClose={() => setPortalDevice(null)}
          onSyncSuccess={() => {}}
        />
      )}

      {/* Reusable Cute Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        variant={confirmModal.variant}
        badge={confirmModal.badge}
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
}
