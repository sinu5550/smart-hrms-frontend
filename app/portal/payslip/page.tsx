'use client';

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  HandCoins,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

export default function MobilePayslipPortalPage() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState("2026-09");

  // Sample structured salary data based on gazette
  const payslipData = {
    monthName: "September 2026",
    paymentDate: "October 05, 2026",
    status: "DISBURSED",
    employeeName: user?.fullName || "Employee",
    employeeId: user?.employeeId || "EKH-26-0001",
    designation: "Senior Software Engineer",
    department: "Engineering & IT",
    bankName: "Dutch-Bangla Bank PLC",
    accountNumber: "115.105.******89",

    // Earnings
    basic: 45000,
    houseRent: 22500,
    medicalAllowance: 4500,
    conveyance: 3500,
    foodAllowance: 2500,
    overtimePay: 4800, // 16 hrs OT
    attendanceBonus: 2000,

    // Deductions
    providentFund: 4500, // 10%
    incomeTaxTds: 2200,
    loanInstallment: 3000,
    lateDeduction: 0,
  };

  const grossEarnings =
    payslipData.basic +
    payslipData.houseRent +
    payslipData.medicalAllowance +
    payslipData.conveyance +
    payslipData.foodAllowance +
    payslipData.overtimePay +
    payslipData.attendanceBonus;

  const totalDeductions =
    payslipData.providentFund +
    payslipData.incomeTaxTds +
    payslipData.loanInstallment +
    payslipData.lateDeduction;

  const netPayable = grossEarnings - totalDeductions;

  const handleDownloadPdf = () => {
    alert("Official encrypted PDF Payslip downloaded successfully!");
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-emerald-700" />
            Digital Payslip
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Salary compensation statement & statutory deductions ledger.
          </p>
        </div>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-emerald-600 shadow-xs"
        >
          <option value="2026-09">Sep 2026</option>
          <option value="2026-08">Aug 2026</option>
          <option value="2026-07">Jul 2026</option>
        </select>
      </div>

      {/* Main Net Pay Card */}
      <div className="bg-gradient-to-br from-emerald-800 to-teal-950 text-white rounded-lg p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between text-xs text-emerald-200">
          <span className="font-semibold uppercase tracking-wider">{payslipData.monthName}</span>
          <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1 text-[10px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            DISBURSED
          </span>
        </div>

        <div>
          <p className="text-xs text-emerald-100">Net Take-Home Salary</p>
          <p className="text-3xl font-black tracking-tight mt-1 text-white">
            ৳ {netPayable.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-200/80 mt-1">
            Paid to {payslipData.bankName} ({payslipData.accountNumber})
          </p>
        </div>

        <div className="pt-3 border-t border-emerald-700/60 flex items-center justify-between">
          <div className="text-[11px]">
            <span className="text-emerald-300">Gross: </span>
            <span className="font-bold text-white">৳ {grossEarnings.toLocaleString()}</span>
          </div>
          <div className="text-[11px]">
            <span className="text-rose-300">Deductions: </span>
            <span className="font-bold text-white">৳ {totalDeductions.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Earnings & Deductions Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Earnings Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-2.5">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-xs font-bold text-slate-800">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Earnings (Gross)</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Basic Salary</span>
              <span className="font-semibold text-slate-800">৳ {payslipData.basic.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">House Rent (HRA)</span>
              <span className="font-semibold text-slate-800">৳ {payslipData.houseRent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Medical Allowance</span>
              <span className="font-semibold text-slate-800">৳ {payslipData.medicalAllowance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Conveyance Allowance</span>
              <span className="font-semibold text-slate-800">৳ {payslipData.conveyance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Food Allowance</span>
              <span className="font-semibold text-slate-800">৳ {payslipData.foodAllowance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Overtime (16 hrs)</span>
              <span className="font-semibold text-emerald-700">+৳ {payslipData.overtimePay.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Attendance Bonus</span>
              <span className="font-semibold text-emerald-700">+৳ {payslipData.attendanceBonus.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Deductions Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-2.5">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-xs font-bold text-slate-800">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span>Deductions & Recoveries</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Provident Fund (10%)</span>
              <span className="font-semibold text-rose-700">-৳ {payslipData.providentFund.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Income Tax (TDS)</span>
              <span className="font-semibold text-rose-700">-৳ {payslipData.incomeTaxTds.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">HR Loan EMI Recovery</span>
              <span className="font-semibold text-rose-700">-৳ {payslipData.loanInstallment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Late / Absence Penalty</span>
              <span className="font-semibold text-slate-400">৳ 0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Download Action */}
      <button
        onClick={handleDownloadPdf}
        className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition"
      >
        <Download className="w-4 h-4 text-emerald-700" />
        <span>Download Official PDF Payslip</span>
      </button>
    </div>
  );
}
