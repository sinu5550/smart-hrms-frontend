'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { parseApiError } from "@/services/api";
import { Shield, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Input } from "@/components/ui/input";

const ADMIN_ROLES = ["PLATFORM_ADMIN", "OWNER", "ADMIN", "HR"];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Enter your email or employee ID and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const user = await login(identifier, password);
      if (user.mustChangePassword) {
        router.push("/portal/profile");
        return;
      }
      if (user.role && ADMIN_ROLES.includes(user.role)) {
        router.push("/admin");
      } else {
        router.push("/portal/attendance");
      }
    } catch (err: unknown) {
      setError(parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#f4f7fb] text-slate-800">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center mx-auto text-emerald-700">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">HRMS Portal Sign In</h1>
          <p className="text-xs text-slate-500">
            Enter your employee credentials to access portal & attendance.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Employee ID or Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <Input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email address or employee ID"
                required
                className="h-11 rounded-lg pl-10 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <PasswordInput
                leadingIcon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="pl-10 py-2.5 rounded-lg bg-white border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            Forgot credentials? Contact your HR operations desk for assistance.
          </p>
          <a href="/register-organization" className="mt-3 inline-block text-xs font-semibold text-emerald-700 hover:underline">Create an organization workspace</a>
        </div>
      </div>
    </main>
  );
}
