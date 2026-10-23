'use client';

import React, { useState } from "react";
import {
  useBranches,
  useHolidays,
  useJobGrades,
  useGazetteRules,
  useIdCardTemplates,
  useCreateBranch,
  useDeleteBranch,
  useCreateHoliday,
  useDeleteHoliday,
  useCreateJobGrade,
  useCreateGazetteRule,
  useSaveIdCardTemplate,
} from "@/hooks";
import { parseApiError } from "@/services/api";
import {
  Building2,
  Calendar,
  Layers,
  FileSpreadsheet,
  Contact,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Award,
  CreditCard,
  QrCode,
  MapPin,
  Clock,
  Printer,
  ChevronRight,
} from "lucide-react";

export default function CoreHrSettingsHubPage() {
  const [activeTab, setActiveTab] = useState<"BRANCHES" | "HOLIDAYS" | "GRADES" | "GAZETTE" | "ID_STUDIO">("BRANCHES");

  // Branches
  const { data: branches = [], isLoading: isLoadingBranches } = useBranches();
  const createBranchMutation = useCreateBranch();
  const deleteBranchMutation = useDeleteBranch();
  const [branchForm, setBranchForm] = useState({ name: "", code: "", city: "", phone: "", isHeadOffice: false });
  const [branchModal, setBranchModal] = useState(false);

  // Holidays
  const { data: holidays = [], isLoading: isLoadingHolidays } = useHolidays();
  const createHolidayMutation = useCreateHoliday();
  const deleteHolidayMutation = useDeleteHoliday();
  const [holidayForm, setHolidayForm] = useState({ title: "", fromDate: "", toDate: "", holidayType: "PUBLIC" });
  const [holidayModal, setHolidayModal] = useState(false);

  // Job Grades
  const { data: grades = [], isLoading: isLoadingGrades } = useJobGrades();
  const createGradeMutation = useCreateJobGrade();
  const [gradeForm, setGradeForm] = useState({ gradeName: "", gradeLevel: 1, minBasic: 30000, maxBasic: 60000 });
  const [gradeModal, setGradeModal] = useState(false);

  // Gazette Rules
  const { data: gazettes = [], isLoading: isLoadingGazettes } = useGazetteRules();
  const createGazetteMutation = useCreateGazetteRule();
  const [gazetteForm, setGazetteForm] = useState({
    gazetteName: "Standard National Gazette 2026",
    basicPercentage: 50,
    houseRentPercentage: 25,
    medicalAllowanceFixed: 4500,
    conveyanceAllowanceFixed: 3500,
    foodAllowanceFixed: 2500,
    overtimeMultiplier: 2.0,
    isDefault: true,
  });
  const [gazetteModal, setGazetteModal] = useState(false);

  // ID Card Studio
  const { data: idTemplates = [] } = useIdCardTemplates();
  const saveIdTemplateMutation = useSaveIdCardTemplate();
  const [idStudioConfig, setIdStudioConfig] = useState({
    templateName: "Executive PVC Card 2026",
    primaryColor: "#047857",
    accentColor: "#0f172a",
    showBloodGroup: true,
    showEmergencyContact: true,
    showQrCode: true,
    showBarcode: false,
    customFooterText: "Property of Ekhone IT Workspace. If found, please return to office administration.",
  });

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Branch Handlers
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name.trim() || !branchForm.code.trim()) return;
    try {
      await createBranchMutation.mutateAsync(branchForm);
      setBranchForm({ name: "", code: "", city: "", phone: "", isHeadOffice: false });
      setBranchModal(false);
      setNotification({ type: "success", text: "Branch created successfully!" });
    } catch (err: any) {
      alert(parseApiError(err));
    }
  };

  // Holiday Handlers
  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayForm.title.trim()) return;
    try {
      await createHolidayMutation.mutateAsync(holidayForm);
      setHolidayForm({ title: "", fromDate: "", toDate: "", holidayType: "PUBLIC" });
      setHolidayModal(false);
      setNotification({ type: "success", text: "Holiday added to official calendar!" });
    } catch (err: any) {
      alert(parseApiError(err));
    }
  };

  // Grade Handlers
  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGradeMutation.mutateAsync(gradeForm);
      setGradeModal(false);
      setNotification({ type: "success", text: "Job grade tier created!" });
    } catch (err: any) {
      alert(parseApiError(err));
    }
  };

  // Gazette Handlers
  const handleCreateGazette = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGazetteMutation.mutateAsync(gazetteForm);
      setGazetteModal(false);
      setNotification({ type: "success", text: "Gazette wage rule established!" });
    } catch (err: any) {
      alert(parseApiError(err));
    }
  };

  // Save ID Template
  const handleSaveIdTemplate = async () => {
    try {
      await saveIdTemplateMutation.mutateAsync(idStudioConfig);
      setNotification({ type: "success", text: "ID Card Studio template saved successfully!" });
    } catch (err: any) {
      alert(parseApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-700" />
            Core HR Setup & Organizational Foundation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure multi-branches, holiday calendars, grade pay-scales, government gazette splits, and ID card templates.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto p-1 bg-slate-100 border border-slate-200 rounded-lg gap-1">
        {[
          { tab: "BRANCHES", label: "Multi-Branches", icon: Building2 },
          { tab: "HOLIDAYS", label: "Holiday Calendar", icon: Calendar },
          { tab: "GRADES", label: "Job Grades", icon: Layers },
          { tab: "GAZETTE", label: "Gazette Wage Rules", icon: FileSpreadsheet },
          { tab: "ID_STUDIO", label: "ID Card Studio", icon: Contact },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => {
                setActiveTab(item.tab as any);
                setNotification(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition ${
                isActive
                  ? "bg-white text-emerald-800 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {notification && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* ================= TAB 1: BRANCHES ================= */}
      {activeTab === "BRANCHES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Company Branches & Regional Units ({branches.length})</h2>
            <button
              onClick={() => setBranchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Branch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branches.length === 0 ? (
              <div className="col-span-3 bg-white p-10 border border-slate-200 rounded-lg text-center text-xs text-slate-400">
                No branches created yet. Click "Add Branch" to define physical sites.
              </div>
            ) : (
              branches.map((b) => (
                <div key={b.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{b.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Code: {b.code}</p>
                    </div>
                    {b.isHeadOffice && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                        Headquarters
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{b.city || b.address || "City not specified"}</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <Contact className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{b._count?.users || 0} Staff Assigned</span>
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => deleteBranchMutation.mutate(b.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: HOLIDAYS ================= */}
      {activeTab === "HOLIDAYS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Official Holiday Calendar 2026 ({holidays.length} events)</h2>
            <button
              onClick={() => setHolidayModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Declare Holiday</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Holiday Title</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Date Range</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {holidays.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-xs text-slate-400">
                      No holidays declared.
                    </td>
                  </tr>
                ) : (
                  holidays.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800">{h.title}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-700">
                          {h.holidayType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">
                        {new Date(h.fromDate).toISOString().split("T")[0]} &rarr; {new Date(h.toDate).toISOString().split("T")[0]}
                      </td>
                      <td className="p-3 font-semibold text-emerald-700">{h.totalDays} Day(s)</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => deleteHolidayMutation.mutate(h.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: JOB GRADES ================= */}
      {activeTab === "GRADES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Job Grades & Pay Scales ({grades.length} Levels)</h2>
            <button
              onClick={() => setGradeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Grade</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {grades.map((g) => (
              <div key={g.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{g.gradeName}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    Tier {g.gradeLevel}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                  <p className="text-slate-500">
                    Basic Range: <span className="font-semibold text-slate-800">৳ {Number(g.minBasic).toLocaleString()} - ৳ {Number(g.maxBasic).toLocaleString()}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">{g._count?.users || 0} Employees at this tier</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: GAZETTE WAGE RULES ================= */}
      {activeTab === "GAZETTE" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Gazette Wage Distribution Formulas</h2>
            <button
              onClick={() => setGazetteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Define Gazette Rule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gazettes.map((gz) => (
              <div key={gz.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900">{gz.gazetteName}</h3>
                  {gz.isDefault && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active Default
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <p className="text-[10px] text-slate-400">Basic Pay</p>
                    <p className="font-bold text-slate-800">{gz.basicPercentage}% of Gross</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <p className="text-[10px] text-slate-400">House Rent (HRA)</p>
                    <p className="font-bold text-slate-800">{gz.houseRentPercentage}% of Gross</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <p className="text-[10px] text-slate-400">Medical Allowance</p>
                    <p className="font-bold text-slate-800">৳ {Number(gz.medicalAllowanceFixed).toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <p className="text-[10px] text-slate-400">Overtime Rate</p>
                    <p className="font-bold text-emerald-700">{gz.overtimeMultiplier}x Standard Wage</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: ID CARD STUDIO ================= */}
      {activeTab === "ID_STUDIO" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Contact className="w-4 h-4 text-emerald-700" />
              ID Card Studio Configuration
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Template Title</label>
                <input
                  type="text"
                  value={idStudioConfig.templateName}
                  onChange={(e) => setIdStudioConfig({ ...idStudioConfig, templateName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Brand Primary Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={idStudioConfig.primaryColor}
                      onChange={(e) => setIdStudioConfig({ ...idStudioConfig, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                    />
                    <span className="text-xs font-mono text-slate-600">{idStudioConfig.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Accent Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={idStudioConfig.accentColor}
                      onChange={(e) => setIdStudioConfig({ ...idStudioConfig, accentColor: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                    />
                    <span className="text-xs font-mono text-slate-600">{idStudioConfig.accentColor}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={idStudioConfig.showBloodGroup}
                    onChange={(e) => setIdStudioConfig({ ...idStudioConfig, showBloodGroup: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>Show Blood Group on Front Face</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={idStudioConfig.showEmergencyContact}
                    onChange={(e) => setIdStudioConfig({ ...idStudioConfig, showEmergencyContact: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>Show Emergency Contact on Back</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={idStudioConfig.showQrCode}
                    onChange={(e) => setIdStudioConfig({ ...idStudioConfig, showQrCode: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>Include Digital Gate Pass QR Code</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Disclaimer / Footer Text</label>
                <textarea
                  rows={2}
                  value={idStudioConfig.customFooterText}
                  onChange={(e) => setIdStudioConfig({ ...idStudioConfig, customFooterText: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                onClick={handleSaveIdTemplate}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition"
              >
                Save Template Configuration
              </button>
            </div>
          </div>

          {/* Live ID Card Preview */}
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center space-y-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Card Preview</span>

            {/* Simulated PVC Card Front */}
            <div
              className="w-64 h-96 rounded-xl shadow-2xl p-4 flex flex-col items-center justify-between text-white relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${idStudioConfig.primaryColor}, ${idStudioConfig.accentColor})` }}
            >
              {/* Header */}
              <div className="text-center">
                <p className="text-xs font-black tracking-widest uppercase">Ekhone IT Pro</p>
                <p className="text-[9px] text-emerald-200 tracking-wider">Identity Card</p>
              </div>

              {/* Photo Box */}
              <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md">
                <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
                  PHOTO
                </div>
              </div>

              {/* Employee Meta */}
              <div className="text-center space-y-0.5">
                <h3 className="text-sm font-bold tracking-tight">Tanvir Ahmed</h3>
                <p className="text-[10px] text-emerald-200">Senior Lead Architect</p>
                <p className="text-[9px] font-mono opacity-80">ID: EKH-26-0001</p>
              </div>

              {/* Blood Group Badge */}
              {idStudioConfig.showBloodGroup && (
                <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 border border-white/30">
                  Blood Group: B+
                </div>
              )}

              {/* QR Code */}
              {idStudioConfig.showQrCode && (
                <div className="p-1.5 bg-white rounded-md shadow-xs">
                  <QrCode className="w-10 h-10 text-slate-900" />
                </div>
              )}

              {/* Footer */}
              <p className="text-[8px] text-center opacity-70 leading-tight">
                {idStudioConfig.customFooterText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}
      {/* Branch Modal */}
      {branchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900">Add Company Branch</h3>
            <form onSubmit={handleCreateBranch} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Branch Name (e.g. Chittagong Sub-Office)"
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
              />
              <input
                type="text"
                required
                placeholder="Branch Code (e.g. CTG-01)"
                value={branchForm.code}
                onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 font-mono"
              />
              <input
                type="text"
                placeholder="City (e.g. Chittagong)"
                value={branchForm.city}
                onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
              />
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={branchForm.isHeadOffice}
                  onChange={(e) => setBranchForm({ ...branchForm, isHeadOffice: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span>Set as Corporate Headquarters</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBranchModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg"
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Holiday Modal */}
      {holidayModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900">Declare Public/Festival Holiday</h3>
            <form onSubmit={handleCreateHoliday} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Holiday Title (e.g. Eid-ul-Fitr)"
                value={holidayForm.title}
                onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">From Date</label>
                  <input
                    type="date"
                    required
                    value={holidayForm.fromDate}
                    onChange={(e) => setHolidayForm({ ...holidayForm, fromDate: e.target.value })}
                    className="w-full mt-0.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">To Date</label>
                  <input
                    type="date"
                    required
                    value={holidayForm.toDate}
                    onChange={(e) => setHolidayForm({ ...holidayForm, toDate: e.target.value })}
                    className="w-full mt-0.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setHolidayModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {gradeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900">Define Job Grade Scale</h3>
            <form onSubmit={handleCreateGrade} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Grade Name (e.g. Grade-01 Senior Executive)"
                value={gradeForm.gradeName}
                onChange={(e) => setGradeForm({ ...gradeForm, gradeName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">Min Basic (৳)</label>
                  <input
                    type="number"
                    value={gradeForm.minBasic}
                    onChange={(e) => setGradeForm({ ...gradeForm, minBasic: Number(e.target.value) })}
                    className="w-full mt-0.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">Max Basic (৳)</label>
                  <input
                    type="number"
                    value={gradeForm.maxBasic}
                    onChange={(e) => setGradeForm({ ...gradeForm, maxBasic: Number(e.target.value) })}
                    className="w-full mt-0.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGradeModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gazette Modal */}
      {gazetteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900">Define Gazette Statutory Rule</h3>
            <form onSubmit={handleCreateGazette} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Gazette Name"
                value={gazetteForm.gazetteName}
                onChange={(e) => setGazetteForm({ ...gazetteForm, gazetteName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
              />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">Basic %</label>
                  <input
                    type="number"
                    value={gazetteForm.basicPercentage}
                    onChange={(e) => setGazetteForm({ ...gazetteForm, basicPercentage: Number(e.target.value) })}
                    className="w-full mt-0.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">HRA %</label>
                  <input
                    type="number"
                    value={gazetteForm.houseRentPercentage}
                    onChange={(e) => setGazetteForm({ ...gazetteForm, houseRentPercentage: Number(e.target.value) })}
                    className="w-full mt-0.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGazetteModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg"
                >
                  Save Gazette
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
