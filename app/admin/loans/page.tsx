'use client';

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, parseApiError } from "@/services/api";
import {
  HandCoins,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  RefreshCw,
  AlertCircle,
  Building,
} from "lucide-react";
import Image from "next/image";

interface HrLoanRecord {
  id: string;
  loanType: string;
  principalAmount: number;
  tenureMonths: number;
  monthlyInstallment: number;
  totalRepaid: number;
  outstandingBalance: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "DISBURSED";
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    employeeId: string;
    avatarUrl?: string | null;
    department?: { name: string } | null;
  };
}

export default function AdminLoansManagementPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: loans = [], isLoading, refetch } = useQuery<HrLoanRecord[]>({
    queryKey: ["admin", "loans"],
    queryFn: async () => {
      const { data } = await apiClient.get<HrLoanRecord[]>("/loans");
      return data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" | "DISBURSED" }) => {
      const { data } = await apiClient.patch(`/loans/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "loans"] });
      setProcessingId(null);
    },
    onError: (err) => {
      alert(parseApiError(err));
      setProcessingId(null);
    },
  });

  const handleUpdateStatus = (id: string, status: "APPROVED" | "REJECTED" | "DISBURSED") => {
    setProcessingId(id);
    statusMutation.mutate({ id, status });
  };

  const filtered = loans.filter((l) => {
    const matchesStatus = filterStatus === "ALL" || l.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      l.user?.fullName?.toLowerCase().includes(q) ||
      l.user?.employeeId?.toLowerCase().includes(q) ||
      l.reason?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = loans.filter((l) => l.status === "PENDING").length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HandCoins className="w-6 h-6 text-emerald-700" />
            Company Loans & Salary Advances
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sanction emergency employee welfare funds, medical advances, and payroll installment recoveries.
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
            placeholder="Search by employee name, ID, or loan reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {["ALL", "PENDING", "APPROVED", "DISBURSED", "REJECTED"].map((st) => (
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

      {/* Loan Records */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-3 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-4 space-y-3 rounded-xl border border-slate-100 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-slate-200/80 animate-pulse shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-28 bg-slate-200/80 rounded animate-pulse" />
                        <div className="h-2.5 w-20 bg-slate-200/60 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-5 w-16 bg-slate-200/80 rounded-full animate-pulse" />
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 space-y-2">
                    <div className="h-4 w-32 bg-slate-200/70 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-slate-200/60 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No loan requests found.</div>
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
                      item.status === "APPROVED" || item.status === "DISBURSED"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : item.status === "REJECTED"
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Principal Amount:</span>
                    <span className="font-extrabold text-slate-900">৳{Number(item.principalAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Tenure & Monthly EMI:</span>
                    <span className="font-semibold text-slate-700">{item.tenureMonths} Mo @ ৳{Number(item.monthlyInstallment).toLocaleString()}/mo</span>
                  </div>
                  <div className="pt-1 border-t border-slate-200/50">
                    <p className="text-[11px] text-slate-600 line-clamp-2">Reason: {item.reason}</p>
                  </div>
                </div>

                {item.status === "PENDING" && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleUpdateStatus(item.id, "APPROVED")}
                      disabled={processingId === item.id}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(item.id, "REJECTED")}
                      disabled={processingId === item.id}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}

                {item.status === "APPROVED" && (
                  <button
                    onClick={() => handleUpdateStatus(item.id, "DISBURSED")}
                    disabled={processingId === item.id}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Coins className="w-3.5 h-3.5" /> Mark Disbursed
                  </button>
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
                <th className="py-3 px-4">Loan Type</th>
                <th className="py-3 px-4">Principal</th>
                <th className="py-3 px-4">Tenure & EMI</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <>
                  {[1, 2, 3, 4].map((n) => (
                    <tr key={n} className="border-b border-slate-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200/80 animate-pulse shrink-0" />
                          <div className="space-y-1">
                            <div className="h-3.5 w-28 bg-slate-200/80 rounded animate-pulse" />
                            <div className="h-2.5 w-20 bg-slate-200/60 rounded animate-pulse" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><div className="h-4 w-20 bg-slate-200/70 rounded animate-pulse" /></td>
                      <td className="py-3 px-4"><div className="h-5 w-24 bg-slate-200/70 rounded animate-pulse" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-28 bg-slate-200/70 rounded animate-pulse" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-36 bg-slate-200/70 rounded animate-pulse" /></td>
                      <td className="py-3 px-4"><div className="h-5 w-16 bg-slate-200/70 rounded-full animate-pulse" /></td>
                      <td className="py-3 px-4 text-right"><div className="h-6 w-20 ml-auto bg-slate-200/70 rounded animate-pulse" /></td>
                    </tr>
                  ))}
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No matching loans found.</td>
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
                      {item.loanType}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      ৳{Number(item.principalAmount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-medium text-slate-700">{item.tenureMonths} Months</p>
                      <p className="text-[10px] text-slate-400">৳{Number(item.monthlyInstallment).toLocaleString()}/month</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={item.reason}>
                      {item.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          item.status === "APPROVED" || item.status === "DISBURSED"
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
                            onClick={() => handleUpdateStatus(item.id, "APPROVED")}
                            disabled={processingId === item.id}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition shadow-xs disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, "REJECTED")}
                            disabled={processingId === item.id}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition shadow-xs disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : item.status === "APPROVED" ? (
                        <button
                          onClick={() => handleUpdateStatus(item.id, "DISBURSED")}
                          disabled={processingId === item.id}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition shadow-xs disabled:opacity-50"
                        >
                          Disburse
                        </button>
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
