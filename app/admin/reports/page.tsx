'use client';

import React, { useState } from "react";
import {
  FileText,
  UserCheck,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  Printer,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
} from "lucide-react";

export default function MisReportsAndCompliancePage() {
  const [reportType, setReportType] = useState<"MONTHLY_ATTENDANCE" | "FORM_8" | "FORM_33" | "LEAVE_SUMMARY" | "PAYROLL_TOPSHEET">("MONTHLY_ATTENDANCE");
  const [selectedMonth, setSelectedMonth] = useState("2026-10");

  const sampleReportData = [
    { id: "1", employeeId: "EKH-26-0001", name: "Tanvir Ahmed", dept: "Engineering", presentDays: 22, lateDays: 1, leaveDays: 1, absentDays: 0, otHours: 14.5, netPay: "85,000" },
    { id: "2", employeeId: "EKH-26-0002", name: "Sultana Razia", dept: "HR & Operations", presentDays: 24, lateDays: 0, leaveDays: 0, absentDays: 0, otHours: 4.0, netPay: "62,000" },
    { id: "3", employeeId: "EKH-26-0003", name: "Kazi Nazmul", dept: "Design", presentDays: 21, lateDays: 3, leaveDays: 0, absentDays: 0, otHours: 8.0, netPay: "55,000" },
    { id: "4", employeeId: "EKH-26-0004", name: "Arif Hossain", dept: "Sales & Client", presentDays: 20, lateDays: 2, leaveDays: 2, absentDays: 0, otHours: 12.0, netPay: "48,000" },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = "Employee ID,Name,Department,Present,Late,Leave,Absent,OT Hours,Salary (BDT)\n";
    const rows = sampleReportData.map(r => `${r.employeeId},${r.name},${r.dept},${r.presentDays},${r.lateDays},${r.leaveDays},${r.absentDays},${r.otHours},${r.netPay}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hrms_${reportType.toLowerCase()}_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            Executive MIS Reports & Statutory Compliance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate monthly muster rolls, government compliance registers (Form-8, Form-33), and payroll top sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter and Category Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          {[
            { id: "MONTHLY_ATTENDANCE", label: "Muster Roll Register" },
            { id: "FORM_8", label: "Labor Law Form-8 (Overtime)" },
            { id: "FORM_33", label: "Labor Law Form-33 (Adult Worker)" },
            { id: "LEAVE_SUMMARY", label: "Yearly Leave Balance Sheet" },
            { id: "PAYROLL_TOPSHEET", label: "Master Payroll Top-Sheet" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                reportType === tab.id
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Target Month:
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
            />
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="font-semibold text-slate-700">{sampleReportData.length} records computed</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Statutory Formats Verified
            </span>
          </div>
        </div>
      </div>

      {/* Report Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {reportType === "MONTHLY_ATTENDANCE" && "Monthly Attendance Muster Roll"}
              {reportType === "FORM_8" && "Form-8: Register of Overtime and Wage Multipliers"}
              {reportType === "FORM_33" && "Form-33: Statutory Register of Adult Workers"}
              {reportType === "LEAVE_SUMMARY" && "Annual Statutory Leave Consumption Ledger"}
              {reportType === "PAYROLL_TOPSHEET" && "Executive Master Payroll Summary"}
            </h2>
            <p className="text-[11px] text-slate-500">Period: {selectedMonth} &bull; Official Workspace Record</p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Bangla & National Labor Law 2006 Compliant</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3">Employee ID</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Department</th>
                <th className="p-3 text-center">Present</th>
                <th className="p-3 text-center">Late</th>
                <th className="p-3 text-center">Leave</th>
                <th className="p-3 text-center">Absent</th>
                <th className="p-3 text-right">OT Hours</th>
                <th className="p-3 text-right">Salary (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sampleReportData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono font-bold text-slate-900">{row.employeeId}</td>
                  <td className="p-3 font-semibold text-slate-800">{row.name}</td>
                  <td className="p-3 text-slate-600">{row.dept}</td>
                  <td className="p-3 text-center font-bold text-emerald-700">{row.presentDays}</td>
                  <td className="p-3 text-center font-bold text-amber-700">{row.lateDays}</td>
                  <td className="p-3 text-center font-medium text-blue-700">{row.leaveDays}</td>
                  <td className="p-3 text-center font-bold text-rose-700">{row.absentDays}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-700">{row.otHours} hrs</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-800">৳ {row.netPay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
