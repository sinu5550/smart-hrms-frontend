const fs = require("fs");
const path = require("path");

const files = {
  "package.json": JSON.stringify({
    "name": "enterprise-hrms-frontend",
    "version": "1.0.0",
    "private": true,
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint"
    },
    "dependencies": {
      "@hookform/resolvers": "^3.9.0",
      "axios": "^1.7.7",
      "clsx": "^2.1.1",
      "html5-qrcode": "^2.3.8",
      "lucide-react": "^0.453.0",
      "next": "14.2.15",
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "react-hook-form": "^7.53.0",
      "swr": "^2.2.5",
      "tailwind-merge": "^2.5.4",
      "zod": "^3.23.8"
    },
    "devDependencies": {
      "@types/node": "^20.14.0",
      "@types/react": "^18.3.0",
      "@types/react-dom": "^18.3.0",
      "postcss": "^8.4.47",
      "tailwindcss": "^3.4.14",
      "typescript": "^5.6.3"
    }
  }, null, 2),

  "tsconfig.json": JSON.stringify({
    "compilerOptions": {
      "lib": ["dom", "dom.iterable", "esnext"],
      "allowJs": true,
      "skipLibCheck": true,
      "strict": true,
      "noEmit": true,
      "esModuleInterop": true,
      "module": "esnext",
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve",
      "incremental": true,
      "plugins": [{ "name": "next" }],
      "paths": {
        "@/*": ["./*"]
      }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
  }, null, 2),

  "tailwind.config.ts": `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;`,

  "postcss.config.mjs": `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
  },
};
export default config;`,

  "next.config.mjs": `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
};
export default nextConfig;`,

  ".env.local.example": "NEXT_PUBLIC_API_URL=\"http://localhost:3000\"",

  "app/globals.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #09090b;
  color: #f4f4f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}`,

  "app/layout.tsx": `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enterprise HRMS Platform",
  description: "Next.js Mobile Attendance & HR Administration Suite",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}`,

  "app/page.tsx": `import Link from "next/link";
import { QrCode, Shield, Users, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950 text-zinc-100">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 mb-2">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Enterprise HRMS</h1>
        <p className="text-sm text-zinc-400">
          Geofenced QR-Attendance, Shift Tracking & Personnel Management
        </p>

        <div className="space-y-3 pt-4">
          <Link
            href="/portal/attendance"
            className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition group"
          >
            <div className="flex items-center gap-3 text-left">
              <QrCode className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="font-semibold text-sm text-zinc-200">Employee Portal</p>
                <p className="text-xs text-zinc-500">Scan QR to Clock-in, Lunch & Breaks</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition" />
          </Link>

          <Link
            href="/admin/employees"
            className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 transition group"
          >
            <div className="flex items-center gap-3 text-left">
              <Users className="w-6 h-6 text-blue-400" />
              <div>
                <p className="font-semibold text-sm text-zinc-200">HR Administration</p>
                <p className="text-xs text-zinc-500">Personnel Roster & Shift Policies</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition" />
          </Link>
        </div>
      </div>
    </main>
  );
}`,

  "services/api.ts": `import axios, { AxiosError } from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
  }
  return config;
});

export interface ApiErrorPayload {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const serverError = error as AxiosError<ApiErrorPayload>;
    if (serverError.response?.data?.message) {
      const msg = serverError.response.data.message;
      return Array.isArray(msg) ? msg.join(", ") : msg;
    }
    return serverError.message;
  }
  return "An unexpected network error occurred.";
}`,

  "services/attendance.service.ts": `import { apiClient } from "./api";

export type AttendanceStatus = "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" | "ON_LEAVE";
export type AttendanceSessionState = "CHECKED_IN" | "ON_BREAK" | "CHECKED_OUT";
export type BreakType = "LUNCH" | "PRAYER" | "TEA_COFFEE" | "SMOKE" | "PERSONAL" | "EMERGENCY";

export interface AttendanceBreakRecord {
  id: string;
  breakType: BreakType;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
}

export interface TodayAttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  currentState: AttendanceSessionState;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  status: AttendanceStatus;
  breaks: AttendanceBreakRecord[];
}

export interface TodayStatusResponse {
  checkedIn: boolean;
  checkedOut: boolean;
  attendance: TodayAttendanceRecord | null;
}

export const AttendanceService = {
  getTodayStatus: async (): Promise<TodayStatusResponse> => {
    const { data } = await apiClient.get<TodayStatusResponse>("/attendance/today-status");
    return data;
  },

  checkIn: async (qrSecret: string): Promise<TodayAttendanceRecord> => {
    const { data } = await apiClient.post<TodayAttendanceRecord>("/attendance/check-in", {
      qrSecret,
    });
    return data;
  },

  startBreak: async (breakType: BreakType): Promise<AttendanceBreakRecord> => {
    const { data } = await apiClient.post<AttendanceBreakRecord>("/attendance/break-start", {
      breakType,
    });
    return data;
  },

  endBreak: async (): Promise<TodayAttendanceRecord> => {
    const { data } = await apiClient.post<TodayAttendanceRecord>("/attendance/break-end");
    return data;
  },

  checkOut: async (): Promise<TodayAttendanceRecord> => {
    const { data } = await apiClient.post<TodayAttendanceRecord>("/attendance/check-out");
    return data;
  },
};`,

  "services/employee.service.ts": `import { apiClient } from "./api";

export type EmploymentStatus = "ACTIVE" | "ON_PROBATION" | "RESIGNED" | "TERMINATED" | "SUSPENDED";
export type Role = "ADMIN" | "HR" | "EMPLOYEE";

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: EmploymentStatus;
  bloodGroup?: string | null;
  departmentId?: string | null;
  designationId?: string | null;
  department?: { id: string; name: string } | null;
  designation?: { id: string; name: string } | null;
  joiningDate: string;
  avatarUrl?: string | null;
}

export interface CreateEmployeePayload {
  employeeId: string;
  email: string;
  fullName: string;
  phone: string;
  role?: Role;
  departmentId?: string;
  designationId?: string;
  bloodGroup?: string;
  presentAddress?: string;
  permanentAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}

export const EmployeeService = {
  getAll: async (): Promise<Employee[]> => {
    const { data } = await apiClient.get<Employee[]>("/employees");
    return data;
  },

  create: async (payload: CreateEmployeePayload): Promise<{ user: Employee; initialTemporaryPassword: string }> => {
    const { data } = await apiClient.post("/employees", payload);
    return data;
  },

  updateEmployeeId: async (id: string, newEmployeeId: string) => {
    const { data } = await apiClient.patch(\`/employees/\${id}/employee-id\`, { newEmployeeId });
    return data;
  },

  changeStatus: async (id: string, status: EmploymentStatus) => {
    const { data } = await apiClient.patch(\`/employees/\${id}/status\`, { status });
    return data;
  },

  uploadAvatar: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post(\`/employees/\${id}/avatar\`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  softDelete: async (id: string, confirmationText: string) => {
    const { data } = await apiClient.delete(\`/employees/\${id}\`, {
      data: { confirmationText },
    });
    return data;
  },
};

export interface ShiftSettings {
  id: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
}

export const SettingsService = {
  getShift: async (): Promise<ShiftSettings> => {
    const { data } = await apiClient.get<ShiftSettings>("/settings/shift");
    return data;
  },

  updateShift: async (payload: Partial<ShiftSettings>): Promise<ShiftSettings> => {
    const { data } = await apiClient.patch<ShiftSettings>("/settings/shift", payload);
    return data;
  },
};`,

  "components/attendance/QRCameraScanner.tsx": `'use client';

import React, { useEffect, useRef, useState } from "react";
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
  const [cameraState, setCameraState] = useState<"idle" | "initializing" | "active" | "error" | "denied">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const lastScannedTimestampRef = useRef<number>(0);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
  };

  const startScanner = async () => {
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
          if (isPaused) return;

          const now = Date.now();
          if (now - lastScannedTimestampRef.current < 2500) return;
          lastScannedTimestampRef.current = now;

          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(80);
          }
          onScanSuccess(decodedText);
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
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner().then(() => {
        if (scannerRef.current) {
          try {
            scannerRef.current.clear();
          } catch {}
          scannerRef.current = null;
        }
      });
    };
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-zinc-950 shadow-2xl border border-zinc-800">
      <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Camera className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Office Wall Scanner
          </span>
        </div>
        <button
          onClick={startScanner}
          disabled={cameraState === "initializing"}
          className="p-1 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition"
          title="Restart Video Stream"
        >
          <RefreshCw className={\`w-3.5 h-3.5 \${cameraState === "initializing" ? "animate-spin" : ""}\`} />
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
          <div className="absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <CameraOff className="w-12 h-12 text-rose-500 mb-3" />
            <h4 className="text-sm font-semibold text-zinc-100 mb-1">
              {cameraState === "denied" ? "Permission Denied" : "Camera Unavailable"}
            </h4>
            <p className="text-xs text-zinc-400 mb-4">{errorMessage}</p>
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
            <p className="text-xs font-semibold text-zinc-300">Scanner Standby (Action Modal Open)</p>
          </div>
        )}
      </div>

      <div className="p-3 bg-zinc-900/60 border-t border-zinc-800 text-center">
        <p className="text-[11px] text-zinc-400">Position the office QR code inside the viewfinder</p>
      </div>
    </div>
  );
};`,

  "app/portal/attendance/page.tsx": `'use client';

import React, { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import {
  AttendanceService,
  BreakType,
  TodayStatusResponse,
} from "@/services/attendance.service";
import { parseApiError } from "@/services/api";
import { QRCameraScanner } from "@/components/attendance/QRCameraScanner";
import {
  Clock,
  Coffee,
  CheckCircle2,
  LogOut,
  ChevronRight,
  Sparkles,
  WifiOff,
} from "lucide-react";

const formatSecondsToHMS = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
};

export default function MobileAttendancePortal() {
  const { data: statusData, mutate, isLoading } = useSWR<TodayStatusResponse>(
    "/attendance/today-status",
    AttendanceService.getTodayStatus,
    { refreshInterval: 10000 }
  );

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
      await mutate();
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

  const executeCheckIn = () => {
    handleApiAction(() => AttendanceService.checkIn(stagedQrSecret));
  };

  const executeStartBreak = () => {
    handleApiAction(() => AttendanceService.startBreak(selectedBreakType));
  };

  const executeEndBreak = () => {
    handleApiAction(() => AttendanceService.endBreak());
  };

  const executeCheckOut = () => {
    if (!confirm("Are you sure you want to clock out for today?")) return;
    handleApiAction(() => AttendanceService.checkOut());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-zinc-400 text-xs tracking-wide">Syncing session...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center p-4 max-w-md mx-auto relative pb-20">
      <header className="w-full flex items-center justify-between py-4 border-b border-zinc-800/80 mb-6">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            Attendance <Sparkles className="w-4 h-4 text-emerald-400" />
          </h1>
          <p className="text-xs text-zinc-400">Office Network Verification Mode</p>
        </div>

        {currentState === "CHECKED_IN" && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
            Working
          </span>
        )}
        {currentState === "ON_BREAK" && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
            On {currentOpenBreak?.breakType} Break
          </span>
        )}
        {currentState === "CHECKED_OUT" && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400">
            Shift Ended
          </span>
        )}
      </header>

      {currentState === "CHECKED_OUT" && (
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center shadow-xl space-y-4 my-auto">
          <div className="w-16 h-16 bg-emerald-950/60 border border-emerald-800 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Shift Concluded</h2>
            <p className="text-xs text-zinc-400 mt-1">Attendance logs committed.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
              <p className="text-[10px] uppercase font-semibold text-zinc-400">Total Work</p>
              <p className="text-lg font-bold text-zinc-100 mt-1">
                {Math.floor((activeRecord?.totalWorkMinutes || 0) / 60)}h {(activeRecord?.totalWorkMinutes || 0) % 60}m
              </p>
            </div>
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
              <p className="text-[10px] uppercase font-semibold text-zinc-400">Total Breaks</p>
              <p className="text-lg font-bold text-zinc-100 mt-1">{activeRecord?.totalBreakMinutes || 0}m</p>
            </div>
          </div>
        </div>
      )}

      {currentState !== "CHECKED_OUT" && (
        <div className="w-full space-y-6">
          {statusData?.checkedIn && (
            <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-lg">
              {currentState === "CHECKED_IN" ? (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1.5 text-xs text-zinc-400 mb-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Net Shift Duration</span>
                  </div>
                  <h3 className="text-3xl font-black tracking-wider text-emerald-400 font-mono">
                    {formatSecondsToHMS(liveWorkSeconds)}
                  </h3>
                  <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 px-3 py-2 bg-zinc-950 rounded-lg">
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
                  <p className="text-[11px] text-zinc-400 mt-2">
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
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition"
              >
                <Coffee className="w-4 h-4" /> Take a Break
              </button>
              <button
                onClick={executeCheckOut}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition"
              >
                <LogOut className="w-4 h-4" /> Clock Out
              </button>
            </div>
          )}
        </div>
      )}

      {activeModal === "CONFIRM_CHECKIN" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ready to Check In?</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Authorized office QR signature verified.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setActiveModal("NONE")}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={executeCheckIn}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-950"
              >
                {isSubmitting ? "Registering..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "SELECT_BREAK" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Select Break Category</h3>
            </div>
            <div className="space-y-2">
              {(["LUNCH", "PRAYER", "TEA_COFFEE", "PERSONAL", "EMERGENCY"] as BreakType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedBreakType(type)}
                  className={\`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition \${
                    selectedBreakType === type
                      ? "border-amber-500 bg-amber-500/10 text-amber-300"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                  }\`}
                >
                  <span>{type.replace("_", " ")}</span>
                  {selectedBreakType === type && <ChevronRight className="w-4 h-4 text-amber-400" />}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setActiveModal("NONE")}
                className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={executeStartBreak}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white shadow-lg shadow-amber-950"
              >
                {isSubmitting ? "Starting..." : "Start Break"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "IP_RESTRICTED" && (
        <div className="fixed inset-0 bg-rose-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-rose-800/80 rounded-2xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-rose-950/80 text-rose-400 border border-rose-800 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <WifiOff className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Attendance Blocked</h3>
              <p className="text-xs text-rose-300 mt-2 font-medium">
                {apiErrorMessage || "You must be connected to the official Office Wi-Fi network."}
              </p>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                Please connect your device to the designated office network router and try again.
              </p>
            </div>
            <button
              onClick={() => setActiveModal("NONE")}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
            >
              Acknowledged
            </button>
          </div>
        </div>
      )}
    </main>
  );
}`,

  "app/admin/layout.tsx": `'use client';

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Sliders,
  Shield,
  ChevronLeft,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { label: "Employee Directory", href: "/admin/employees", icon: Users },
    { label: "Shift & Late Rules", href: "/admin/settings/shift", icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <aside
        className={\`bg-zinc-900 border-r border-zinc-800 transition-all duration-300 flex flex-col justify-between \${
          isSidebarOpen ? "w-64" : "w-20"
        }\`}
      >
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-white" />
              </div>
              {isSidebarOpen && (
                <span className="font-bold text-sm tracking-wide text-zinc-100 uppercase">
                  HRMS Admin
                </span>
              )}
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <ChevronLeft className={\`w-4 h-4 transition-transform \${!isSidebarOpen ? "rotate-180" : ""}\`} />
            </button>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={\`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition \${
                    isActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  }\`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {isSidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-emerald-400">
              HR
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-zinc-200 truncate">HR Operations</p>
                <p className="text-[10px] text-zinc-500 truncate">hr@enterprise.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-zinc-900/60 backdrop-blur-md border-b border-zinc-800 px-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">Management Dashboard</h2>
          <div className="text-xs text-zinc-400">Status: Online</div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}`,

  "app/admin/employees/page.tsx": `'use client';

import React, { useState } from "react";
import useSWR from "swr";
import { Employee, EmployeeService, EmploymentStatus } from "@/services/employee.service";
import { parseApiError } from "@/services/api";
import { EmployeeFormDrawer } from "@/components/admin/EmployeeFormDrawer";
import { DeleteEmployeeConfirmModal } from "@/components/admin/DeleteEmployeeConfirmModal";
import {
  UserPlus,
  Search,
  Trash2,
} from "lucide-react";

export default function EmployeesDirectoryPage() {
  const { data: employees = [], mutate, isLoading } = useSWR<Employee[]>(
    "/employees",
    EmployeeService.getAll
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>("ALL");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [targetDeleteEmployee, setTargetDeleteEmployee] = useState<Employee | null>(null);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone.includes(searchQuery);

    const matchesStatus = statusFilter === "ALL" || emp.status === statusFilter;
    const matchesBlood = bloodGroupFilter === "ALL" || emp.bloodGroup === bloodGroupFilter;

    return matchesSearch && matchesStatus && matchesBlood;
  });

  const handleStatusToggle = async (emp: Employee, newStatus: EmploymentStatus) => {
    try {
      await EmployeeService.changeStatus(emp.id, newStatus);
      await mutate();
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Employee Directory</h1>
          <p className="text-xs text-zinc-400">Total Personnel Count: {employees.length}</p>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition"
        >
          <UserPlus className="w-4 h-4" /> Enlist New Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name, ID (e.g. EKH-25-0001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="ALL">All Employment Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="ON_PROBATION">ON PROBATION</option>
          <option value="RESIGNED">RESIGNED</option>
          <option value="TERMINATED">TERMINATED</option>
        </select>

        <select
          value={bloodGroupFilter}
          onChange={(e) => setBloodGroupFilter(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="ALL">All Blood Groups</option>
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
            <option key={bg} value={bg}>
              {bg}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950/80 text-[11px] uppercase font-semibold text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Department / Designation</th>
                <th className="py-3 px-4">Blood</th>
                <th className="py-3 px-4">Employment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    Loading personnel database...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No matching personnel found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-zinc-300">
                          {emp.avatarUrl ? (
                            <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            emp.fullName.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-100">{emp.fullName}</p>
                          <p className="text-[10px] text-zinc-400">{emp.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 font-medium">
                        {emp.employeeId}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-zinc-200">{emp.department?.name || "Unassigned"}</p>
                      <p className="text-[10px] text-zinc-400">{emp.designation?.name || "General Staff"}</p>
                    </td>
                    <td className="py-3 px-4">
                      {emp.bloodGroup ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/60 border border-rose-800 text-rose-300">
                          {emp.bloodGroup}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={emp.status}
                        onChange={(e) => handleStatusToggle(emp, e.target.value as EmploymentStatus)}
                        className={\`text-[11px] font-semibold rounded-lg px-2 py-1 border focus:outline-none \${
                          emp.status === "ACTIVE"
                            ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                            : emp.status === "ON_PROBATION"
                            ? "bg-amber-950/40 border-amber-800 text-amber-300"
                            : "bg-rose-950/40 border-rose-800 text-rose-300"
                        }\`}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="ON_PROBATION">ON PROBATION</option>
                        <option value="RESIGNED">RESIGNED</option>
                        <option value="TERMINATED">TERMINATED</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setTargetDeleteEmployee(emp)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition"
                        title="Soft Delete Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EmployeeFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => {
          setIsDrawerOpen(false);
          mutate();
        }}
      />

      {targetDeleteEmployee && (
        <DeleteEmployeeConfirmModal
          employee={targetDeleteEmployee}
          onClose={() => setTargetDeleteEmployee(null)}
          onSuccess={() => {
            setTargetDeleteEmployee(null);
            mutate();
          }}
        />
      )}
    </div>
  );
}`,

  "components/admin/EmployeeFormDrawer.tsx": `'use client';

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { EmployeeService } from "@/services/employee.service";
import { parseApiError } from "@/services/api";
import { X, Upload, Check } from "lucide-react";

const employeeSchema = z.object({
  employeeId: z
    .string()
    .regex(/^[A-Z]{3}-\\d{2}-\\d{4}$/, "Format must strictly conform to: EKH-25-0001"),
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid business email"),
  phone: z.string().min(8, "Valid phone required"),
  role: z.enum(["EMPLOYEE", "HR", "ADMIN"]),
  bloodGroup: z.string().optional(),
  presentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmployeeFormDrawer: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ id: string; tempPass: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { role: "EMPLOYEE" },
  });

  if (!isOpen) return null;

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("File size exceeds 3MB limit.");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      const response = await EmployeeService.create(data);
      if (avatarFile && response.user?.id) {
        await EmployeeService.uploadAvatar(response.user.id, avatarFile);
      }
      setCreatedCredentials({
        id: data.employeeId,
        tempPass: response.initialTemporaryPassword,
      });
      reset();
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-zinc-900 border-l border-zinc-800 w-full max-w-xl h-full flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-zinc-100">Enlist New Employee</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {createdCredentials ? (
            <div className="bg-emerald-950/50 border border-emerald-800 p-6 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mx-auto text-white">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-white">Account Provisioned</h4>
              <p className="text-xs text-zinc-300">
                Temporary credentials for employee:
              </p>
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-xs text-emerald-400 space-y-1">
                <p>Employee ID: {createdCredentials.id}</p>
                <p>Temporary Password: {createdCredentials.tempPass}</p>
              </div>
              <button
                onClick={onSuccess}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-xl text-white"
              >
                Close & Refresh List
              </button>
            </div>
          ) : (
            <form id="onboard-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-zinc-950 border border-zinc-800 rounded-2xl">
                <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-5 h-5 text-zinc-600" />
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-400 cursor-pointer hover:underline">
                    Upload Profile Picture
                    <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                  </label>
                  <p className="text-[10px] text-zinc-500 mt-1">PNG, JPG, or WEBP up to 3MB</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400">Employee ID *</label>
                  <input
                    {...register("employeeId")}
                    placeholder="EKH-25-0001"
                    className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 uppercase"
                  />
                  {errors.employeeId && (
                    <p className="text-[10px] text-rose-400 mt-1">{errors.employeeId.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400">System Role</label>
                  <select
                    {...register("role")}
                    className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="HR">HR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400">Full Legal Name *</label>
                  <input
                    {...register("fullName")}
                    className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200"
                  />
                  {errors.fullName && (
                    <p className="text-[10px] text-rose-400 mt-1">{errors.fullName.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400">Work Email *</label>
                    <input
                      {...register("email")}
                      className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200"
                    />
                    {errors.email && (
                      <p className="text-[10px] text-rose-400 mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400">Contact Phone *</label>
                    <input
                      {...register("phone")}
                      className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200"
                    />
                    {errors.phone && (
                      <p className="text-[10px] text-rose-400 mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400">Blood Group</label>
                <select
                  {...register("bloodGroup")}
                  className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200"
                >
                  <option value="">Select Blood Group</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400">Present Address</label>
                  <textarea
                    {...register("presentAddress")}
                    rows={2}
                    className="w-full mt-1 p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400">Permanent Address</label>
                  <textarea
                    {...register("permanentAddress")}
                    rows={2}
                    className="w-full mt-1 p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200"
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-3">
                <p className="text-[11px] font-bold text-zinc-300">Emergency Contact</p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    {...register("emergencyContactName")}
                    placeholder="Name"
                    className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                  />
                  <input
                    {...register("emergencyContactPhone")}
                    placeholder="Phone"
                    className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                  />
                  <input
                    {...register("emergencyContactRelation")}
                    placeholder="Relation"
                    className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {!createdCredentials && (
          <div className="p-4 border-t border-zinc-800 flex gap-2">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 py-2.5 border border-zinc-700 text-xs font-semibold rounded-xl text-zinc-300"
            >
              Cancel
            </button>
            <button
              form="onboard-form"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold rounded-xl text-white shadow-lg shadow-emerald-950"
            >
              {isSubmitting ? "Registering..." : "Submit & Create"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};`,

  "components/admin/DeleteEmployeeConfirmModal.tsx": `'use client';

import React, { useState } from "react";
import { Employee, EmployeeService } from "@/services/employee.service";
import { parseApiError } from "@/services/api";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface Props {
  employee: Employee;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteEmployeeConfirmModal: React.FC<Props> = ({ employee, onClose, onSuccess }) => {
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const requiredString = \`DELETE_EMPLOYEE_\${employee.employeeId}\`;
  const isMatch = typedConfirmation === requiredString;

  const handleDelete = async () => {
    if (!isMatch) return;
    try {
      setIsDeleting(true);
      await EmployeeService.softDelete(employee.id, typedConfirmation);
      onSuccess();
    } catch (err) {
      alert(parseApiError(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-rose-900/60 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-full bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-bold text-white">Soft-Delete Employee</h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            This will immediately revoke active JWT sessions and set <span className="font-semibold text-zinc-200">{employee.fullName}</span> ({employee.employeeId}) to TERMINATED status.
          </p>
        </div>

        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
          <p className="text-[11px] text-zinc-400 mb-1">To execute this, enter this exact string:</p>
          <code className="text-xs font-mono font-bold text-rose-400 select-all">{requiredString}</code>
        </div>

        <input
          type="text"
          value={typedConfirmation}
          onChange={(e) => setTypedConfirmation(e.target.value)}
          placeholder={\`Type "\${requiredString}"\`}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-rose-700"
        />

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-zinc-700 text-xs font-semibold rounded-xl text-zinc-300"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!isMatch || isDeleting}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-xs font-semibold rounded-xl text-white transition flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? "Archiving..." : "Delete Employee"}
          </button>
        </div>
      </div>
    </div>
  );
};`,

  "app/admin/settings/shift/page.tsx": `'use client';

import React, { useEffect } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { SettingsService, ShiftSettings } from "@/services/employee.service";
import { parseApiError } from "@/services/api";
import { Sliders, Clock, Save } from "lucide-react";

export default function ShiftConfigurationPage() {
  const { data: shift, mutate, isLoading } = useSWR<ShiftSettings>(
    "/settings/shift",
    SettingsService.getShift
  );

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Partial<ShiftSettings>>();

  useEffect(() => {
    if (shift) {
      reset({
        shiftName: shift.shiftName,
        startTime: shift.startTime,
        endTime: shift.endTime,
        gracePeriodMinutes: shift.gracePeriodMinutes,
      });
    }
  }, [shift, reset]);

  const onSubmit = async (values: Partial<ShiftSettings>) => {
    try {
      await SettingsService.updateShift({
        ...values,
        gracePeriodMinutes: Number(values.gracePeriodMinutes),
      });
      await mutate();
      alert("Shift timings updated successfully! New office hours are active.");
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  if (isLoading) {
    return <div className="p-8 text-xs text-zinc-400">Loading shift settings...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          Shift Timing & Grace Period Rules <Sliders className="w-5 h-5 text-emerald-400" />
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Dynamically configures what constitutes on-time vs. late attendance across the organization.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300">Shift Name</label>
            <input
              {...register("shiftName")}
              className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300">Official Shift Start (24hr)</label>
              <input
                type="text"
                {...register("startTime")}
                placeholder="09:00"
                className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Format: HH:mm (e.g. 09:00)</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300">Official Shift End (24hr)</label>
              <input
                type="text"
                {...register("endTime")}
                placeholder="18:00"
                className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Format: HH:mm (e.g. 18:00)</p>
            </div>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-semibold text-zinc-200">Grace Period (Minutes)</label>
            </div>
            <input
              type="number"
              {...register("gracePeriodMinutes")}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200"
            />
            <p className="text-[11px] text-zinc-400">
              Arrivals after <span className="text-amber-400 font-semibold">[Shift Start + Grace Period]</span> are
              automatically cataloged as <strong className="text-rose-400">LATE</strong>.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Committing Changes..." : "Save Shift Rules"}
          </button>
        </form>
      </div>
    </div>
  );
}`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + "\n", "utf8");
  console.log("  [CREATED]: " + filePath);
}

console.log("\n>>> SUCCESS: Next.js Frontend files generated successfully! <<<");