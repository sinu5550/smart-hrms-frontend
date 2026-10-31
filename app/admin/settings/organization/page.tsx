'use client';

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CloudinaryService } from "@/services/cloudinary.service";
import { parseApiError } from "@/services/api";
import { useOrganization, useUpdateOrganization, useDepartments } from "@/hooks";
import {
  Building2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";

export default function OrganizationSettingsPage() {
  const { user, refreshProfile } = useAuth();
  const { data: org, isLoading } = useOrganization();
  const { data: departments = [] } = useDepartments();
  const updateOrgMutation = useUpdateOrganization();

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [employeePrefix, setEmployeePrefix] = useState("");
  const [address, setAddress] = useState("");
  const [weekendDays, setWeekendDays] = useState<string[]>(["Friday"]);
  const [hasRosterDuty, setHasRosterDuty] = useState(false);
  const [rosterDepartmentIds, setRosterDepartmentIds] = useState<string[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const ALL_DAYS = [
    { label: "Fri", full: "Friday" },
    { label: "Sat", full: "Saturday" },
    { label: "Sun", full: "Sunday" },
    { label: "Mon", full: "Monday" },
    { label: "Tue", full: "Tuesday" },
    { label: "Wed", full: "Wednesday" },
    { label: "Thu", full: "Thursday" },
  ];

  useEffect(() => {
    if (org) {
      setName(org.name || "");
      setLogoUrl(org.logoUrl || "");
      setEmployeePrefix(org.employeePrefix || "");
      setAddress(org.address || "");
      setWeekendDays(Array.isArray(org.weekendDays) && org.weekendDays.length > 0 ? org.weekendDays : ["Friday"]);
      setHasRosterDuty(Boolean(org.hasRosterDuty));
      setRosterDepartmentIds(Array.isArray(org.rosterDepartmentIds) ? org.rosterDepartmentIds : []);
    }
  }, [org]);

  const toggleWeekendDay = (day: string) => {
    if (weekendDays.includes(day)) {
      if (weekendDays.length === 1) {
        alert("At least 1 day should remain selected or manage via Roster.");
        return;
      }
      setWeekendDays(weekendDays.filter((d) => d !== day));
    } else {
      setWeekendDays([...weekendDays, day]);
    }
  };

  const toggleRosterDepartment = (deptId: string) => {
    if (rosterDepartmentIds.includes(deptId)) {
      setRosterDepartmentIds(rosterDepartmentIds.filter((id) => id !== deptId));
    } else {
      setRosterDepartmentIds([...rosterDepartmentIds, deptId]);
    }
  };

  const isSaving = updateOrgMutation.isPending || isUploading;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSuccessMessage("");
      setErrorMessage("");

      await updateOrgMutation.mutateAsync({
        name,
        logoUrl: logoUrl.trim() || undefined,
        employeePrefix: employeePrefix.trim() || undefined,
        address: address.trim(),
        weekendDays,
        hasRosterDuty,
        rosterDepartmentIds: hasRosterDuty ? rosterDepartmentIds : [],
      });

      setSuccessMessage("Workspace & Attendance settings updated successfully!");
      await refreshProfile();
    } catch (err) {
      setErrorMessage(parseApiError(err));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please upload an image smaller than 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage("");
      setSuccessMessage("Uploading logo to Cloudinary...");
      const uploadedUrl = await CloudinaryService.uploadImage(file, "hrms/organization-logos");
      setLogoUrl(uploadedUrl);
      setSuccessMessage("Logo uploaded to Cloudinary! Click Save to apply changes.");
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err) || "Failed to upload image to Cloudinary.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        Loading workspace settings...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-600" /> Organization & Branding Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Customize your tenant organization details, workspace brand logo, and company profile.
        </p>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50/90 border border-emerald-300 rounded-lg flex items-center gap-2.5 text-xs text-emerald-950 font-semibold shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-lg flex items-center gap-2.5 text-xs text-rose-950 font-semibold shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Organization Logo Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-emerald-700" /> Company Logo
          </h2>

          <div className="flex flex-col items-center justify-center text-center space-y-3 p-4 bg-slate-50/80 rounded-lg border border-dashed border-slate-200">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Workspace logo"
                className="w-24 h-24 object-contain rounded-md bg-white p-2 border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-extrabold text-2xl">
                {org?.name?.charAt(0) || "W"}
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-slate-800">{name || "Workspace Logo"}</p>
              <p className="text-[11px] text-slate-500">Displayed in sidebar and headers</p>
            </div>

            <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition">
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Upload New Logo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 leading-relaxed border-t border-slate-100">
            Recommended format: PNG, SVG or WebP with transparent background (Max 5MB).
          </div>
        </div>

        {/* Right Column: Organization Details Form */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-700" /> General Details
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ekhone IT"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-none text-xs text-slate-800 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Logo URL (Optional direct link)
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-none text-xs text-slate-800 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" /> Organization Address (For Reports & Header)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 39/A Senpara Parbota, Mirpur 10, Dhaka - 1216"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-none text-xs text-slate-800 bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">This address will be automatically displayed at the top of Attendance Reports & Exports.</p>
            </div>

            {/* Weekend Configuration */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Weekly Office Weekend / Off Days
              </label>
              <p className="text-[11px] text-slate-500 mb-2.5">
                Select the days of the week that are official off-days for standard employees.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {ALL_DAYS.map((d) => {
                  const isSelected = weekendDays.includes(d.full);
                  return (
                    <button
                      key={d.full}
                      type="button"
                      onClick={() => toggleWeekendDay(d.full)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                        isSelected
                          ? "bg-rose-50 border-rose-300 text-rose-700 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {d.label} {isSelected && "✕ Off"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Roster Duty Configuration */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" /> Roster Duty Mode
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Enable if your organization has specific departments working on shifts/rosters (e.g. Customer Support, Factory) without fixed weekend off-days.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasRosterDuty}
                    onChange={(e) => setHasRosterDuty(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {hasRosterDuty && (
                <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                  <p className="text-xs font-semibold text-indigo-900">
                    Select Departments with Roster Duty:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {departments.length === 0 ? (
                      <p className="text-[11px] text-slate-400">No departments found.</p>
                    ) : (
                      departments.map((dept: any) => {
                        const isRoster = rosterDepartmentIds.includes(dept.id);
                        return (
                          <button
                            key={dept.id}
                            type="button"
                            onClick={() => toggleRosterDepartment(dept.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                              isRoster
                                ? "bg-indigo-600 border-indigo-600 text-white font-bold shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {dept.name} {isRoster && "✓"}
                          </button>
                        );
                      })
                    )}
                  </div>
                  <p className="text-[10px] text-indigo-700 leading-normal">
                    Employees in selected roster departments will be evaluated based on continuous shift duty rather than fixed weekends.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Employee ID Prefix
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={employeePrefix}
                  onChange={(e) => setEmployeePrefix(e.target.value.toUpperCase())}
                  placeholder="e.g. EKH or ACME"
                  maxLength={6}
                  required
                  className="w-48 px-3.5 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none text-xs font-mono font-bold text-slate-800 bg-white"
                />
                <span className="text-[11px] text-slate-500">
                  New employee IDs will be generated as: <span className="font-mono font-semibold text-emerald-700">{employeePrefix || "ORG"}-26-XXXX</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Email Domain</p>
                <p className="text-xs font-bold text-slate-700 mt-1">
                  {org?.emailDomain || "—"}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Account Owner</p>
                <p className="text-xs font-bold text-slate-700 mt-1 truncate">
                  {org?.ownerEmail || user?.email || "—"}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Subscription Status</p>
                <p className="text-xs font-bold text-emerald-700 mt-1 uppercase">
                  {org?.status || "TRIAL"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isSaving ? "Saving changes..." : "Save Workspace Settings"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
