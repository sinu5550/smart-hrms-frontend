'use client';

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, parseApiError } from "@/services/api";
import {
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  ExternalLink,
  ShieldCheck,
  Building,
  RefreshCw,
  Filter,
} from "lucide-react";
import Image from "next/image";

interface OutworkRecord {
  id: string;
  visitDate: string;
  destination: string;
  purpose: string;
  latitude?: number | null;
  longitude?: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvalNotes?: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    employeeId: string;
    avatarUrl?: string | null;
    department?: { name: string } | null;
  };
}

export default function AdminOutworkApprovalsPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [noteModalTarget, setNoteModalTarget] = useState<OutworkRecord | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED">("APPROVED");

  const { data: records = [], isLoading, refetch } = useQuery<OutworkRecord[]>({
    queryKey: ["admin", "outwork"],
    queryFn: async () => {
      const { data } = await apiClient.get<OutworkRecord[]>("/outwork");
      return data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, approvalNotes }: { id: string; status: "APPROVED" | "REJECTED"; approvalNotes?: string }) => {
      const { data } = await apiClient.patch(`/outwork/${id}/status`, { status, approvalNotes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "outwork"] });
      setNoteModalTarget(null);
      setApprovalNote("");
      setProcessingId(null);
    },
    onError: (err) => {
      alert(parseApiError(err));
      setProcessingId(null);
    },
  });

  const handleOpenActionModal = (record: OutworkRecord, action: "APPROVED" | "REJECTED") => {
    setActionType(action);
    setApprovalNote("");
    setNoteModalTarget(record);
  };

  const handleConfirmAction = () => {
    if (!noteModalTarget) return;
    setProcessingId(noteModalTarget.id);
    statusMutation.mutate({
      id: noteModalTarget.id,
      status: actionType,
      approvalNotes: approvalNote.trim() || undefined,
    });
  };

  const filtered = records.filter((r) => {
    const matchesStatus = filterStatus === "ALL" || r.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.user?.fullName?.toLowerCase().includes(q) ||
      r.user?.employeeId?.toLowerCase().includes(q) ||
      r.destination.toLowerCase().includes(q) ||
      r.purpose.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = records.filter((r) => r.status === "PENDING").length;

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-700" />
            Field & Outwork Applications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review and sanction official client visits, outdoor duty, and on-field GPS geofenced submissions.
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
            placeholder="Search by employee name, ID, destination, or purpose..."
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
        {/* Mobile View: Clean App Cards */}
        <div className="sm:hidden divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading outwork applications...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No outwork applications found.</div>
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
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 border ${
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

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{item.destination}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">{item.purpose}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                    <span>Visit: {new Date(item.visitDate).toLocaleDateString()}</span>
                    {item.latitude && item.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:underline flex items-center gap-0.5 font-semibold"
                      >
                        GPS Map <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {item.approvalNotes && (
                  <p className="text-[10px] italic text-slate-500 bg-slate-50/50 p-1.5 rounded border border-slate-100">
                    Remark: {item.approvalNotes}
                  </p>
                )}

                {item.status === "PENDING" && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleOpenActionModal(item, "APPROVED")}
                      disabled={processingId === item.id}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleOpenActionModal(item, "REJECTED")}
                      disabled={processingId === item.id}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
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
                <th className="py-3 px-4">Visit Date</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">GPS Coordinates</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading outwork applications...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No matching applications.</td>
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
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-700">{new Date(item.visitDate).toLocaleDateString()}</span>
                      <p className="text-[10px] text-slate-400">Applied {new Date(item.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-[150px] truncate">
                      {item.destination}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[220px]">
                      <p className="truncate" title={item.purpose}>{item.purpose}</p>
                      {item.approvalNotes && (
                        <p className="text-[10px] italic text-slate-400 mt-0.5 truncate">Note: {item.approvalNotes}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.latitude && item.longitude ? (
                        <a
                          href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                        >
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No GPS tag</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-right">
                      {item.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenActionModal(item, "APPROVED")}
                            disabled={processingId === item.id}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition shadow-xs disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(item, "REJECTED")}
                            disabled={processingId === item.id}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition shadow-xs disabled:opacity-50"
                          >
                            Reject
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

      {/* Approve / Reject Modal with Notes */}
      {noteModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {actionType === "APPROVED" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                {actionType === "APPROVED" ? "Approve Outwork Application" : "Reject Outwork Application"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Employee: <strong className="text-slate-800">{noteModalTarget.user?.fullName}</strong> ({noteModalTarget.user?.employeeId})
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Destination: <span className="font-semibold text-slate-700">{noteModalTarget.destination}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Remark / Sanction Note (Optional)
              </label>
              <textarea
                rows={3}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="e.g. Approved with transport allowance, or client meeting verified."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setNoteModalTarget(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={Boolean(processingId)}
                className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold transition shadow-xs ${
                  actionType === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                    : "bg-rose-600 hover:bg-rose-700 active:bg-rose-800"
                } disabled:opacity-50`}
              >
                {processingId ? "Processing..." : `Confirm ${actionType === "APPROVED" ? "Approval" : "Rejection"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
