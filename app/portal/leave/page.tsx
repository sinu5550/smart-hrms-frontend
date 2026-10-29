'use client';

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, parseApiError } from "@/services/api";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Timer,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface LeaveRequestItem {
  id: string;
  type: "CASUAL" | "SICK" | "ANNUAL" | "SHORT_LEAVE";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
}

export default function MobileLeavePortalPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"APPLY" | "HISTORY">("HISTORY");
  const [leaveType, setLeaveType] = useState<"CASUAL" | "SICK" | "ANNUAL" | "SHORT_LEAVE">("CASUAL");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [shortLeaveHours, setShortLeaveHours] = useState("2");

  const [leaveHistory, setLeaveHistory] = useState<LeaveRequestItem[]>([
    {
      id: "1",
      type: "CASUAL",
      startDate: "2026-10-12",
      endDate: "2026-10-12",
      days: 1,
      reason: "Urgent personal family commitment",
      status: "APPROVED",
    },
    {
      id: "2",
      type: "SHORT_LEAVE",
      startDate: "2026-10-18",
      endDate: "2026-10-18",
      days: 0.25,
      reason: "Bank biometric NID update appointment (2 hours)",
      status: "APPROVED",
    },
  ]);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real leave history from server
  const { data: serverLeaves = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["portal", "leave"],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>("/leave");
      return data;
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (payload: {
      leaveTypeName: string;
      startDate: string;
      endDate: string;
      totalDays: number;
      reason: string;
    }) => {
      const { data } = await apiClient.post("/leave", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "leave"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "leaves"] });
      setReason("");
      setMessage({ type: "success", text: "Leave application submitted to your HR/Admin for approval!" });
      setActiveTab("HISTORY");
      setIsSubmitting(false);
    },
    onError: (err) => {
      setMessage({ type: "error", text: parseApiError(err) });
      setIsSubmitting(false);
    },
  });

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    const days = leaveType === "SHORT_LEAVE" ? parseFloat(shortLeaveHours) / 8 : 1;
    leaveMutation.mutate({
      leaveTypeName: leaveType === "SHORT_LEAVE" ? "CASUAL" : leaveType,
      startDate,
      endDate: leaveType === "SHORT_LEAVE" ? startDate : endDate,
      totalDays: days,
      reason: reason.trim(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-700" />
            Leave & Short-Leave
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Submit formal leaves or hourly gate-passes directly from mobile.
          </p>
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-xs">
          <p className="text-[10px] font-bold uppercase text-slate-400">Casual (CL)</p>
          <p className="text-lg font-extrabold text-emerald-700 mt-0.5">
            8 <span className="text-[10px] text-slate-400 font-normal">/ 10</span>
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-xs">
          <p className="text-[10px] font-bold uppercase text-slate-400">Sick (SL)</p>
          <p className="text-lg font-extrabold text-blue-700 mt-0.5">
            12 <span className="text-[10px] text-slate-400 font-normal">/ 14</span>
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-xs">
          <p className="text-[10px] font-bold uppercase text-slate-400">Short Leave</p>
          <p className="text-lg font-extrabold text-amber-700 mt-0.5">
            2 <span className="text-[10px] text-slate-400 font-normal">left/mo</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
            activeTab === "HISTORY" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600"
          }`}
        >
          My Applications ({leaveHistory.length})
        </button>
        <button
          onClick={() => setActiveTab("APPLY")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
            activeTab === "APPLY" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600"
          }`}
        >
          Apply New Leave
        </button>
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

      {/* TAB 1: HISTORY */}
      {activeTab === "HISTORY" && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold uppercase text-slate-700">Request Timeline</span>
            <span className="text-[10px] text-slate-400">Current Year 2026</span>
          </div>

          <div className="space-y-2.5">
            {isLoading ? (
              <p className="text-center py-6 text-xs text-slate-400">Loading leave applications...</p>
            ) : (serverLeaves.length > 0 ? serverLeaves : leaveHistory).map((item: any) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">
                      {(item.leaveType?.name || item.type || "LEAVE").replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({item.totalDays || item.days} Day(s))
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      item.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : item.status === "PENDING"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-rose-100 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 italic">"{item.reason}"</p>

                <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>
                    {formatDate(item.startDate)} to {formatDate(item.endDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: APPLY FORM */}
      {activeTab === "APPLY" && (
        <form onSubmit={handleSubmitLeave} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700">Leave Category *</label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {[
                { type: "CASUAL", label: "Casual Leave" },
                { type: "SICK", label: "Sick Leave" },
                { type: "ANNUAL", label: "Annual Leave" },
                { type: "SHORT_LEAVE", label: "Short Leave (Gate Pass)" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => setLeaveType(opt.type as any)}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition ${
                    leaveType === opt.type
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-500/20"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {leaveType === "SHORT_LEAVE" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Duration (Hours) *</label>
                <select
                  value={shortLeaveHours}
                  onChange={(e) => setShortLeaveHours(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="1">1 Hour</option>
                  <option value="2">2 Hours</option>
                  <option value="3">3 Hours (Max Gate Pass)</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">End Date *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700">Reason / Justification *</label>
            <textarea
              required
              rows={3}
              placeholder="State the purpose of your leave or gate pass request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition"
          >
            Submit Leave Application
          </button>
        </form>
      )}
    </div>
  );
}
