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
  XCircle,
  AlertCircle,
  FileText,
  Timer,
  ChevronRight,
  ShieldCheck,
  Users,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface LeaveRequestItem {
  id: string;
  type?: string;
  startDate: string;
  endDate: string;
  days?: number;
  totalDays?: number;
  reason: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  deptHeadStatus?: "APPROVED" | "PENDING" | "REJECTED" | null;
  leaveType?: {
    name: string;
  };
  user?: {
    id: string;
    fullName: string;
    employeeId: string;
    department?: { name: string } | null;
  };
}

export default function MobileLeavePortalPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"HISTORY" | "APPLY" | "DEPT_REQUESTS">("HISTORY");
  const [leaveType, setLeaveType] = useState<"CASUAL" | "SICK" | "ANNUAL" | "SHORT_LEAVE">("CASUAL");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [shortLeaveHours, setShortLeaveHours] = useState("2");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real leave history for current user
  const { data: serverLeaves = [], isLoading, refetch } = useQuery<LeaveRequestItem[]>({
    queryKey: ["portal", "leave"],
    queryFn: async () => {
      const { data } = await apiClient.get<LeaveRequestItem[]>("/leave");
      return data;
    },
  });

  // Check if current user is Department Head of any department or has team members
  // If user has team requests, server returns requests from their department
  const teamRequests = serverLeaves.filter((l) => l.user && l.user.id !== user?.id);
  const isDeptHeadOrManager = teamRequests.length > 0 || user?.role === "HR" || user?.role === "ADMIN" || user?.role === "OWNER";
  const myLeaves = serverLeaves.filter((l) => !l.user || l.user.id === user?.id);

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
      setMessage({ type: "success", text: "Leave application submitted! Awaiting Department Head & HR sanction." });
      setActiveTab("HISTORY");
      setIsSubmitting(false);
    },
    onError: (err) => {
      setMessage({ type: "error", text: parseApiError(err) });
      setIsSubmitting(false);
    },
  });

  // Dept Head action mutation
  const deptHeadMutation = useMutation({
    mutationFn: async ({ id, deptHeadStatus }: { id: string; deptHeadStatus: "APPROVED" | "REJECTED" }) => {
      const { data } = await apiClient.patch(`/leave/${id}/dept-head-status`, { deptHeadStatus });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "leave"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "leaves"] });
      setProcessingId(null);
      setMessage({ type: "success", text: "Department recommendation submitted successfully." });
    },
    onError: (err) => {
      setMessage({ type: "error", text: parseApiError(err) });
      setProcessingId(null);
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

  const handleDeptHeadAction = (id: string, deptHeadStatus: "APPROVED" | "REJECTED") => {
    setProcessingId(id);
    deptHeadMutation.mutate({ id, deptHeadStatus });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-700" />
            Leave & Gate Pass
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Submit formal leaves or gate-passes. Track Department Head and HR approvals in real time.
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
      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`flex-1 py-1.5 rounded-md transition ${
            activeTab === "HISTORY" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600"
          }`}
        >
          My Applications ({myLeaves.length})
        </button>
        <button
          onClick={() => setActiveTab("APPLY")}
          className={`flex-1 py-1.5 rounded-md transition ${
            activeTab === "APPLY" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600"
          }`}
        >
          Apply New
        </button>
        {isDeptHeadOrManager && (
          <button
            onClick={() => setActiveTab("DEPT_REQUESTS")}
            className={`flex-1 py-1.5 rounded-md transition flex items-center justify-center gap-1 ${
              activeTab === "DEPT_REQUESTS" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Dept Team ({teamRequests.length})
          </button>
        )}
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
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold uppercase text-slate-700">My Leave Applications</span>
            <span className="text-[10px] text-slate-400 font-mono">Real-time status</span>
          </div>

          <div className="space-y-2.5">
            {isLoading ? (
              <p className="text-center py-6 text-xs text-slate-400">Loading leave applications...</p>
            ) : myLeaves.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">No leave applications yet.</p>
            ) : (
              myLeaves.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition space-y-2"
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

                  {/* Dept Head Approval Status */}
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-slate-500">Dept Head:</span>
                    {item.deptHeadStatus === "APPROVED" ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved by Department Head
                      </span>
                    ) : item.deptHeadStatus === "REJECTED" ? (
                      <span className="text-rose-700 font-bold flex items-center gap-0.5">
                        <XCircle className="w-3 h-3 text-rose-600" /> Rejected by Department Head
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-amber-600" /> Waiting for Department Head approval
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 italic">"{item.reason}"</p>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {formatDate(item.startDate)} to {formatDate(item.endDate)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: APPLY FORM */}
      {activeTab === "APPLY" && (
        <form onSubmit={handleSubmitLeave} className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
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
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Duration (Hours) *</label>
                <select
                  value={shortLeaveHours}
                  onChange={(e) => setShortLeaveHours(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-emerald-600"
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
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">End Date *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-emerald-600"
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
              className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-emerald-600"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs transition disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Leave Application"}
          </button>
        </form>
      )}

      {/* TAB 3: DEPARTMENT TEAM REQUESTS (FOR DEPT HEAD) */}
      {activeTab === "DEPT_REQUESTS" && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold uppercase text-slate-700">Department Requests for Review</span>
            <span className="text-[10px] text-blue-600 font-bold">Dept Head Portal</span>
          </div>

          {teamRequests.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400">No member leave requests in your department.</p>
          ) : (
            <div className="space-y-3">
              {teamRequests.map((item) => (
                <div key={item.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.user?.fullName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.user?.employeeId} • {item.user?.department?.name || "Unit"}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        item.deptHeadStatus === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : item.deptHeadStatus === "REJECTED"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {item.deptHeadStatus === "APPROVED"
                        ? "Dept Approved"
                        : item.deptHeadStatus === "REJECTED"
                        ? "Dept Rejected"
                        : "Waiting Dept Head"}
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700">{item.leaveType?.name || "LEAVE"}</span>
                      <span className="font-semibold text-emerald-700">{item.totalDays} Day(s)</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {formatDate(item.startDate)} to {formatDate(item.endDate)}
                    </p>
                    <p className="text-[11px] text-slate-700 italic pt-1 border-t border-slate-100">
                      "{item.reason}"
                    </p>
                  </div>

                  {item.deptHeadStatus === "PENDING" && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleDeptHeadAction(item.id, "APPROVED")}
                        disabled={processingId === item.id}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Recommend / Approve
                      </button>
                      <button
                        onClick={() => handleDeptHeadAction(item.id, "REJECTED")}
                        disabled={processingId === item.id}
                        className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
