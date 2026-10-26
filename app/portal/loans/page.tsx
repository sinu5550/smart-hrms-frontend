'use client';

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, parseApiError } from "@/services/api";
import {
  HandCoins,
  Calculator,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Percent,
  RefreshCw,
  Coins,
} from "lucide-react";

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
}

export default function HrLoansPage() {
  const queryClient = useQueryClient();

  const { data: loans = [], isLoading } = useQuery<HrLoanRecord[]>({
    queryKey: ["portal", "loans"],
    queryFn: async () => {
      const { data } = await apiClient.get<HrLoanRecord[]>("/loans");
      return data;
    },
  });

  const [principalAmount, setPrincipalAmount] = useState<number>(50000);
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [loanType, setLoanType] = useState("EMERGENCY");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // EMI calculation (0% interest for internal HR employee welfare loans)
  const estimatedEmi = Math.round(principalAmount / Math.max(1, tenureMonths));

  const applyMutation = useMutation({
    mutationFn: async (payload: {
      loanType: string;
      principalAmount: number;
      tenureMonths: number;
      reason: string;
    }) => {
      const { data } = await apiClient.post<HrLoanRecord>("/loans", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "loans"] });
      setReason("");
      setMessage({ type: "success", text: "Loan application submitted to HR & Accounts successfully." });
    },
    onError: (err) => {
      setMessage({ type: "error", text: parseApiError(err) });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!principalAmount || !reason.trim()) return;

    setMessage(null);
    applyMutation.mutate({
      loanType,
      principalAmount: Number(principalAmount),
      tenureMonths: Number(tenureMonths),
      reason: reason.trim(),
    });
  };

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <HandCoins className="w-5 h-5 text-emerald-700" />
          Smart HR Loans & Salary Advances
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Apply for company emergency loans or festival salary advances with flexible payroll EMI deduction.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Simulator & Application Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Calculator className="w-4 h-4 text-emerald-700" />
          Loan EMI Calculator & Application
        </h2>

        {/* Live EMI Preview Box */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-emerald-800">Estimated Monthly Deduction</p>
            <p className="text-xl font-black text-emerald-950 font-mono mt-0.5">
              ৳ {estimatedEmi.toLocaleString()} <span className="text-xs font-normal text-emerald-700">/ month</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              0% Interest
            </span>
            <p className="text-[10px] text-emerald-700 mt-1">For {tenureMonths} Months</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Loan Scheme *</label>
              <select
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-emerald-600"
              >
                <option value="EMERGENCY">Medical / Emergency Loan</option>
                <option value="SALARY_ADVANCE">Advance Salary Advance</option>
                <option value="FESTIVAL">Festival Advance</option>
                <option value="EDUCATION">Education / Skill Development</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Principal Amount (BDT) *</label>
              <input
                type="number"
                required
                min={5000}
                max={500000}
                step={1000}
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Repayment Tenure (Months) *</label>
            <input
              type="range"
              min={1}
              max={24}
              value={tenureMonths}
              onChange={(e) => setTenureMonths(Number(e.target.value))}
              className="w-full mt-2 accent-emerald-700"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>1 Month</span>
              <span className="font-bold text-emerald-800">{tenureMonths} Months</span>
              <span>24 Months</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Reason / Justification *</label>
            <textarea
              required
              rows={3}
              placeholder="Explain the specific emergency or necessity for the loan..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={applyMutation.isPending}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {applyMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Submit Loan Application</span>
          </button>
        </form>
      </div>

      {/* Loan History */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-500" />
          My Loan Ledger & Approvals
        </h2>

        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 bg-slate-200/80 rounded animate-pulse" />
                  <div className="h-5 w-16 bg-slate-200/80 rounded-full animate-pulse" />
                </div>
                <div className="h-2.5 w-44 bg-slate-200/60 rounded animate-pulse" />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="h-7 bg-slate-200/60 rounded-md animate-pulse" />
                  <div className="h-7 bg-slate-200/60 rounded-md animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">No active or past HR loans recorded.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {loans.map((loan) => (
              <div key={loan.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 font-mono">
                      ৳ {Number(loan.principalAmount).toLocaleString()}
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      {loan.loanType} &bull; {loan.tenureMonths} Months @ ৳ {Number(loan.monthlyInstallment).toLocaleString()}/mo
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                      loan.status === "APPROVED" || loan.status === "DISBURSED"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : loan.status === "REJECTED"
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {loan.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] p-2 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-slate-400 text-[10px]">Repaid:</span>
                    <p className="font-semibold text-slate-700 font-mono">
                      ৳ {Number(loan.totalRepaid || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Remaining Balance:</span>
                    <p className="font-bold text-rose-700 font-mono">
                      ৳ {Number(loan.outstandingBalance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 italic">"{loan.reason}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
