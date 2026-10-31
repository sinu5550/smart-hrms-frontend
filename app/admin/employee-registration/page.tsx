'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { useOrganization, useRegistrations, useUpdateRegistrationStatus } from "@/hooks";
import {
  FileSignature,
  Copy,
  Check,
  ExternalLink,
  Users,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  QrCode,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building2,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmployeeRegistrationAdminPage() {
  const { user } = useAuth();
  const { data: orgData } = useOrganization();
  const org = orgData || user?.organization;
  const tenantSlug = org?.slug || org?.id || "";

  const [copied, setCopied] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const { data: registrations = [], isLoading, refetch } = useRegistrations(selectedStatus === "ALL" ? undefined : selectedStatus);
  const updateStatusMutation = useUpdateRegistrationStatus();

  const [formUrl, setFormUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && tenantSlug) {
      setFormUrl(`${window.location.origin}/${tenantSlug}/forms/employee-registration`);
    }
  }, [tenantSlug]);

  const handleCopyLink = () => {
    if (!formUrl) return;
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const pendingCount = registrations.filter((r) => r.status === "PENDING").length;
  const enlistedCount = registrations.filter((r) => r.status === "ENLISTED").length;
  const rejectedCount = registrations.filter((r) => r.status === "REJECTED").length;

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to decline this registration application?")) return;
    try {
      await updateStatusMutation.mutateAsync({ id, status: "REJECTED" });
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update registration status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-emerald-700" />
            Employee Self-Registration Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Share tenant-isolated registration links with incoming personnel to fill up onboarding profiles and auto-provision into HRMS.
          </p>
        </div>
      </div>

      {/* Shareable Link Banner Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-xl p-5 shadow-sm border border-slate-700 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Tenant Public Form</span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Share Onboarding Form with Prospective Hires
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              New employees fill out personal details, blood group, address, emergency contact, and upload their photo (automatically optimized under 200KB). You can then import them into the Enlist Drawer with 1 click.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopyLink}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 px-4 rounded-lg flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
              <span>{copied ? "Link Copied!" : "Copy Form Link"}</span>
            </Button>
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-600 transition"
              title="Open form in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview</span>
            </a>
          </div>
        </div>

        {/* URL Box */}
        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-700/80 flex items-center justify-between gap-3 font-mono text-xs text-emerald-300 break-all select-all">
          <span className="truncate">{formUrl || "Generating isolated registration URL..."}</span>
          <button
            onClick={handleCopyLink}
            className="text-slate-400 hover:text-white p-1 rounded transition shrink-0"
            title="Copy URL"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-1">{pendingCount}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Enlisted as Employees</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-1">{enlistedCount}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Rejected / Archived</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Submissions Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Submitted Registration Applications</h3>
            <p className="text-xs text-slate-500">
              Applications waiting to be enrolled via the <b>Enlist New Employee</b> drawer.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {["ALL", "PENDING", "ENLISTED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  selectedStatus === st
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading registrations...</div>
        ) : registrations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium text-slate-600">No registration submissions found.</p>
            <p className="text-[11px] text-slate-400">
              Share the form link with new hires to receive applications here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Preferred Unit</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {reg.avatarUrl ? (
                          <img
                            src={reg.avatarUrl}
                            alt={reg.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                            {reg.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800">{reg.fullName}</p>
                          <p className="text-[11px] text-slate-400">
                            {reg.gender || "Gender N/A"} &bull; Blood: {reg.bloodGroup || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <p className="text-slate-700 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{reg.email}</span>
                        </p>
                        {reg.phone && (
                          <p className="text-slate-500 flex items-center gap-1.5 font-mono text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{reg.phone}</span>
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-700">
                        <p className="font-medium">{reg.departmentName || "General"}</p>
                        <p className="text-[11px] text-slate-400">{reg.designationName || "Staff"}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(reg.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          reg.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : reg.status === "ENLISTED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {reg.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {reg.status === "PENDING" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(reg.id)}
                            className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

