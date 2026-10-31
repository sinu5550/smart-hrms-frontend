'use client';

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, parseApiError } from "@/services/api";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  CalendarDays,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  FileText,
  ShieldCheck,
  Building2,
} from "lucide-react";
import Image from "next/image";
import { formatDate } from "@/lib/utils";

interface LeaveRequestItem {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  deptHeadStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  deptHeadActionedAt?: string | null;
  deptHeadNote?: string | null;
  rejectionNote?: string | null;
  createdAt: string;
  leaveType: {
    id: string;
    name: string;
    isPaid: boolean;
  };
  user: {
    id: string;
    fullName: string;
    employeeId: string;
    avatarUrl?: string | null;
    department?: { id: string; name: string } | null;
  };
}

export default function AdminLeaveManagementPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: leaves = [], isLoading, refetch } = useQuery<LeaveRequestItem[]>({
    queryKey: ["admin", "leaves"],
    queryFn: async () => {
      const { data } = await apiClient.get<LeaveRequestItem[]>("/leave");
      return data;
    },
  });

  // Final Admin/HR approval
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) => {
      const { data } = await apiClient.patch(`/leave/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "leaves"] });
      queryClient.invalidateQueries({ queryKey: ["portal", "leave"] });
      setProcessingId(null);
    },
    onError: (err) => {
      alert(parseApiError(err));
      setProcessingId(null);
    },
  });

  // Department Head recommendation / approval
  const deptHeadStatusMutation = useMutation({
    mutationFn: async ({ id, deptHeadStatus }: { id: string; deptHeadStatus: "APPROVED" | "REJECTED" }) => {
      const { data } = await apiClient.patch(`/leave/${id}/dept-head-status`, { deptHeadStatus });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "leaves"] });
      queryClient.invalidateQueries({ queryKey: ["portal", "leave"] });
      setProcessingId(null);
    },
    onError: (err) => {
      alert(parseApiError(err));
      setProcessingId(null);
    },
  });

  const handleUpdateStatus = (id: string, status: "APPROVED" | "REJECTED") => {
    setProcessingId(id);
    statusMutation.mutate({ id, status });
  };

  const handleUpdateDeptHeadStatus = (id: string, deptHeadStatus: "APPROVED" | "REJECTED") => {
    setProcessingId(id);
    deptHeadStatusMutation.mutate({ id, deptHeadStatus });
  };

  const filtered = leaves.filter((l) => {
    const matchesStatus = filterStatus === "ALL" || l.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      l.user?.fullName?.toLowerCase().includes(q) ||
      l.user?.employeeId?.toLowerCase().includes(q) ||
      l.reason?.toLowerCase().includes(q) ||
      l.user?.department?.name?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = leaves.filter((l) => l.status === "PENDING").length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-emerald-700" />
            Leave & Gate Pass Sanctions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Two-tier workflow: Department Head initial recommendation and Final HR/Admin sanction.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
              {pendingCount} Pending Request{pendingCount > 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee name, ID, department, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                filterStatus === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Records Listing */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading leave requests...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No leave requests found.</div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-700">
                      {item.user?.avatarUrl ? (
                        <Image src={item.user.avatarUrl} alt="" width={36} height={36} unoptimized className="w-full h-full object-cover" />
                      ) : (
                        item.user?.fullName?.charAt(0) || "U"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{item.user?.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{item.user?.employeeId} • {item.user?.department?.name || "General"}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      item.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : item.status === "REJECTED"
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Department Head Status Pill */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="font-semibold text-slate-500">Dept Head:</span>
                  {item.deptHeadStatus === "APPROVED" ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved by Dept Head
                    </span>
                  ) : item.deptHeadStatus === "REJECTED" ? (
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold inline-flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-600" /> Rejected by Dept Head
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-semibold inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> Waiting for Dept Head Approval
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{item.leaveType?.name || "LEAVE"}</span>
                    <span className="font-semibold text-emerald-700">{item.totalDays} Day{item.totalDays > 1 ? "s" : ""}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {formatDate(item.startDate)} to {formatDate(item.endDate)}
                  </p>
                  <p className="text-slate-700 text-[11px] pt-1 border-t border-slate-200/50">Reason: {item.reason}</p>
                </div>

                {/* Dept Head Action Button for pending dept head */}
                {item.deptHeadStatus === "PENDING" && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => handleUpdateDeptHeadStatus(item.id, "APPROVED")}
                      disabled={processingId === item.id}
                      className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Dept Head Approve
                    </button>
                    <button
                      onClick={() => handleUpdateDeptHeadStatus(item.id, "REJECTED")}
                      disabled={processingId === item.id}
                      className="flex-1 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-[11px] font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Dept Head Reject
                    </button>
                  </div>
                )}

                {/* Final Admin/HR Action */}
                {item.status === "PENDING" && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleUpdateStatus(item.id, "APPROVED")}
                      disabled={processingId === item.id}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Final Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(item.id, "REJECTED")}
                      disabled={processingId === item.id}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Final Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Dept Head Status</th>
                <th className="py-3 px-4">Final Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading leave requests...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No matching leave requests found.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-700">
                          {item.user?.avatarUrl ? (
                            <Image src={item.user.avatarUrl} alt="" width={32} height={32} unoptimized className="w-full h-full object-cover" />
                          ) : (
                            item.user?.fullName?.charAt(0) || "U"
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{item.user?.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{item.user?.employeeId} • {item.user?.department?.name || "General"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {item.leaveType?.name || "LEAVE"}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-700">
                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                      {item.totalDays} Day{item.totalDays > 1 ? "s" : ""}
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-[180px] truncate" title={item.reason}>
                      {item.reason}
                    </td>

                    {/* Dept Head Approval Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.deptHeadStatus === "APPROVED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved by Dept Head
                        </span>
                      ) : item.deptHeadStatus === "REJECTED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" /> Rejected by Dept Head
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> Waiting Dept Head
                          </span>
                          {/* Allow quick Dept Head action inline */}
                          <button
                            onClick={() => handleUpdateDeptHeadStatus(item.id, "APPROVED")}
                            title="Approve as Dept Head"
                            className="p-1 rounded hover:bg-emerald-100 text-emerald-700 transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Final Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          item.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : item.status === "REJECTED"
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {item.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(item.id, "APPROVED")}
                            disabled={processingId === item.id}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition shadow-xs disabled:opacity-50"
                          >
                            Final Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, "REJECTED")}
                            disabled={processingId === item.id}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition shadow-xs disabled:opacity-50"
                          >
                            Final Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Decided</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
