'use client';

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEmployee } from "@/hooks/useEmployees";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Clock,
  Calendar,
  Droplet,
  Shield,
  MapPin,
  Fingerprint,
  ScanFace,
  HeartHandshake,
  CreditCard,
  User,
  CheckCircle2,
  AlertCircle,
  FileBadge,
} from "lucide-react";

export default function EmployeeProfileViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: employee, isLoading, error } = useEmployee(id);

  if (isLoading) {
    return (
      <main className="min-h-[70vh] grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading employee profile...</p>
        </div>
      </main>
    );
  }

  if (error || !employee) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="text-sm font-bold text-rose-800">Employee record not found</h2>
          <p className="text-xs text-rose-600">The requested profile might have been deleted or does not exist.</p>
          <Link
            href="/admin/employees"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50 transition shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Employee Directory
          </Link>
        </div>
      </main>
    );
  }

  const permissions = Array.isArray(employee.permissions) ? employee.permissions : [];
  const hasFP = permissions.includes("bio:fingerprint");
  const hasFace = permissions.includes("bio:face");

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Not specified";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header / Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link href="/admin" className="hover:text-emerald-700 transition">Admin</Link>
              <span>/</span>
              <Link href="/admin/employees" className="hover:text-emerald-700 transition">Employees</Link>
              <span>/</span>
              <span className="text-slate-700 font-medium">{employee.fullName}</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              Employee Profile
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/employees"
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
          >
            Directory View
          </Link>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 rounded-2xl bg-slate-100 border-2 border-emerald-500/20 overflow-hidden shrink-0 flex items-center justify-center text-2xl font-black text-emerald-800 shadow-sm">
              {employee.avatarUrl ? (
                <Image
                  src={employee.avatarUrl}
                  alt={employee.fullName}
                  width={80}
                  height={80}
                  unoptimized
                  className="w-full h-full object-cover"
                />
              ) : (
                employee.fullName.charAt(0)
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900">{employee.fullName}</h2>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800">
                  {employee.employeeId}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    employee.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : employee.status === "ON_PROBATION"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {employee.status}
                </span>
                {employee.isOwner && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-bold text-[10px]">
                    WORKSPACE OWNER
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{employee.phone || "No phone provided"}</span>
                </div>
                {employee.bloodGroup && (
                  <div className="flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-rose-500" />
                    <span className="font-semibold text-rose-700">{employee.bloodGroup}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Biometrics Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Biometric Sync</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                    hasFP
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-white text-slate-400 border-slate-200"
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>{hasFP ? "Fingerprint Enrolled" : "No Fingerprint"}</span>
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                    hasFace
                      ? "bg-purple-50 text-purple-700 border-purple-300"
                      : "bg-white text-slate-400 border-slate-200"
                  }`}
                >
                  <ScanFace className="w-3.5 h-3.5" />
                  <span>{hasFace ? "Face Enrolled" : "No Face"}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Employment & Shift Info */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Employment & Work Details</h3>
              <p className="text-[11px] text-slate-500">Department, role, and shift assignment</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[11px] text-slate-400">Department</p>
              <p className="font-semibold text-slate-800 mt-0.5">{employee.department?.name || "Unassigned"}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Designation / Title</p>
              <p className="font-semibold text-slate-800 mt-0.5">{employee.designation?.name || "Standard Employee"}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Assigned Shift</p>
              <p className="font-semibold text-slate-800 mt-0.5">
                {employee.shift
                  ? `${employee.shift.shiftName} (${employee.shift.startTime} - ${employee.shift.endTime})`
                  : "Standard Shift (09:00 - 18:00)"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Joining Date</p>
              <p className="font-semibold text-slate-800 mt-0.5">{formatDate(employee.joiningDate)}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Attendance Exemption</p>
              <p className="font-semibold text-slate-800 mt-0.5">
                {employee.attendanceExempt ? (
                  <span className="text-amber-700 font-bold">Exempted from attendance punch</span>
                ) : (
                  <span className="text-emerald-700 font-bold">Punch Required (Monitored)</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">System Role</p>
              <p className="font-semibold text-slate-800 mt-0.5 font-mono">{employee.role}</p>
            </div>
          </div>
        </section>

        {/* Personal & Identification Info */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Personal & Identification</h3>
              <p className="text-[11px] text-slate-500">Identity, birthday, and personal data</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[11px] text-slate-400">Date of Birth</p>
              <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>{formatDate(employee.dateOfBirth)}</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Gender</p>
              <p className="font-semibold text-slate-800 mt-0.5">{employee.gender || "Not specified"}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Blood Group</p>
              <p className="font-semibold text-slate-800 mt-0.5">{employee.bloodGroup || "Not specified"}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">NID / Passport No</p>
              <p className="font-semibold text-slate-800 mt-0.5 font-mono">{employee.nidOrPassport || "Not specified"}</p>
            </div>
          </div>
        </section>

        {/* Addresses */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Contact & Address Information</h3>
              <p className="text-[11px] text-slate-500">Residential and permanent address</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-[11px] text-slate-400">Present Address</p>
              <p className="font-medium text-slate-800 mt-0.5">{employee.presentAddress || "Not specified"}</p>
            </div>
            <div className="border-t border-slate-100 pt-2.5">
              <p className="text-[11px] text-slate-400">Permanent Address</p>
              <p className="font-medium text-slate-800 mt-0.5">{employee.permanentAddress || "Not specified"}</p>
            </div>
          </div>
        </section>

        {/* Emergency Contact */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Emergency Contact</h3>
              <p className="text-[11px] text-slate-500">Contact person in case of urgent need</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[11px] text-slate-400">Contact Name</p>
              <p className="font-semibold text-slate-800 mt-0.5">{employee.emergencyContactName || "Not specified"}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Relationship</p>
              <p className="font-semibold text-slate-800 mt-0.5">{employee.emergencyContactRelation || "Not specified"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] text-slate-400">Emergency Phone</p>
              <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{employee.emergencyContactPhone || "Not specified"}</span>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

