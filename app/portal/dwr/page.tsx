'use client';

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Calendar,
} from "lucide-react";

interface DwrEntry {
  id: string;
  date: string;
  taskTitle: string;
  project: string;
  hoursSpent: number;
  status: "COMPLETED" | "IN_PROGRESS" | "BLOCKED";
  notes?: string;
}

export default function DailyWorkReportPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<DwrEntry[]>([
    {
      id: "1",
      date: new Date().toISOString().split("T")[0],
      taskTitle: "Refactored Employee Profile API & UI Components",
      project: "HRMS Core Pro",
      hoursSpent: 4.5,
      status: "COMPLETED",
      notes: "Implemented responsive mobile view with PWA integration.",
    },
    {
      id: "2",
      date: new Date().toISOString().split("T")[0],
      taskTitle: "GPS Attendance Geofencing Algorithm Integration",
      project: "Mobile Attendance",
      hoursSpent: 3.5,
      status: "IN_PROGRESS",
      notes: "Testing coordinate validation on low-precision mobile towers.",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    taskTitle: "",
    project: "",
    hoursSpent: "2",
    status: "COMPLETED" as DwrEntry["status"],
    notes: "",
  });

  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.taskTitle.trim()) return;

    const newReport: DwrEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      taskTitle: formData.taskTitle.trim(),
      project: formData.project.trim() || "General Duty",
      hoursSpent: parseFloat(formData.hoursSpent) || 1,
      status: formData.status,
      notes: formData.notes.trim(),
    };

    setReports([newReport, ...reports]);
    setFormData({ taskTitle: "", project: "", hoursSpent: "2", status: "COMPLETED", notes: "" });
    setIsModalOpen(false);
  };

  const totalHoursToday = reports.reduce((acc, r) => acc + r.hoursSpent, 0);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            Daily Work Report (DWR)
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Log your daily deliverables for supervisory sign-off & KPI metrics.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">Today's Logged Hours</p>
          <p className="text-xl font-extrabold text-slate-800 mt-1 flex items-baseline gap-1">
            {totalHoursToday.toFixed(1)} <span className="text-xs font-semibold text-slate-500">hours</span>
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">Tasks Completed</p>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">
            {reports.filter((r) => r.status === "COMPLETED").length}{" "}
            <span className="text-xs font-semibold text-slate-500">of {reports.length}</span>
          </p>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            Deliverables Log
          </span>
          <span className="text-[10px] text-slate-400">{reports.length} Activities Recorded</span>
        </div>

        <div className="space-y-2.5">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold text-slate-800 leading-snug">{report.taskTitle}</p>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                    report.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : report.status === "IN_PROGRESS"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-rose-100 text-rose-800 border border-rose-200"
                  }`}
                >
                  {report.status.replace("_", " ")}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {report.project}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {report.hoursSpent} hrs
                </span>
                <span>&bull;</span>
                <span>{report.date}</span>
              </div>

              {report.notes && (
                <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                  "{report.notes}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add DWR Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Add Daily Work Log</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddReport} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700">Task Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Completed customer KYC verification"
                  value={formData.taskTitle}
                  onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Project / Dept</label>
                  <input
                    type="text"
                    placeholder="e.g. Operations"
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Hours Spent</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="16"
                    value={formData.hoursSpent}
                    onChange={(e) => setFormData({ ...formData, hoursSpent: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="COMPLETED">Completed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Blocked / Need Help</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Notes / Obstacles</label>
                <textarea
                  rows={2}
                  placeholder="Mention dependencies or follow-up plans..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm transition"
                >
                  Submit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
