"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth.service";
import { useAuth } from "@/components/auth/AuthProvider";
import { parseApiError } from "@/services/api";
import {
  KeyRound,
  UserRound,
  ArrowLeft,
  QrCode,
  Shield,
  Building,
  Phone,
  Mail,
  Heart,
  Calendar,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function EmployeeProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const required = user?.mustChangePassword;
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (next !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    try {
      setSaving(true);
      await AuthService.changePassword(current, next);
      logout();
      router.replace("/login");
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return <main className="min-h-screen grid place-items-center text-slate-500">Loading profile...</main>;
  }

  return (
    <div className="space-y-4">
      {/* Digital ID Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-lg p-5 shadow-lg border border-slate-700/80 relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-md border border-emerald-500/30">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{user.fullName}</h2>
              <p className="text-xs text-emerald-300 font-mono">{user.employeeId}</p>
            </div>
          </div>

          <button
            onClick={() => setShowQrModal(true)}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition border border-white/20"
            title="Show Digital ID QR Code"
          >
            <QrCode className="w-5 h-5 text-emerald-400" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-700/80 text-xs">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Department</p>
            <p className="font-semibold text-slate-200 truncate">{user.department?.name || "General Office"}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Work Role</p>
            <p className="font-semibold text-slate-200">{user.role}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Work Email</p>
            <p className="font-semibold text-slate-200 truncate">{user.email}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Contact</p>
            <p className="font-semibold text-slate-200">{user.phone || "Not specified"}</p>
          </div>
        </div>
      </div>

      {/* Password Change Box */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <KeyRound className="w-4 h-4 text-emerald-700" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Security & Password</h3>
        </div>

        {required && (
          <p className="p-3 rounded-lg bg-amber-50 text-xs text-amber-800 border border-amber-200">
            Please update your temporary password before proceeding.
          </p>
        )}
        {error && (
          <p className="p-3 rounded-lg bg-rose-50 text-xs text-rose-700 border border-rose-200">{error}</p>
        )}
        {message && (
          <p className="p-3 rounded-lg bg-emerald-50 text-xs text-emerald-700 border border-emerald-200">{message}</p>
        )}

        <form onSubmit={submit} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            Current Password
            <PasswordInput
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            New Password
            <PasswordInput
              required
              minLength={6}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            Confirm New Password
            <PasswordInput
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
          </label>
          <button
            disabled={saving}
            className="w-full py-2.5 rounded-lg bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60 transition shadow-sm"
          >
            {saving ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* QR Code Gate Pass Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-xs w-full text-center space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Digital Gate Pass QR</h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg inline-block">
              <div className="w-40 h-40 bg-slate-900 text-white flex flex-col items-center justify-center rounded-lg p-2 font-mono text-[10px]">
                <QrCode className="w-24 h-24 text-white mb-2" />
                <span>{user.employeeId}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">Scan at entrance terminal for instant gate punch.</p>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
