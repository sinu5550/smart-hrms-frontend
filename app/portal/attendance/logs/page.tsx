'use client';

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIndividualAttendanceReport } from "@/hooks";
import {
  CalendarCheck,
  CalendarDays,
  Clock,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  ArrowLeft,
  Briefcase,
  Layers,
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  PremiumDateRangePicker,
  DateRangeValue,
} from "@/components/ui/PremiumDateRangePicker";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatBreakTypeName(type: string): string {
  switch (type) {
    case "LUNCH":
      return "Lunch";
    case "PRAYER":
      return "Prayer";
    case "TEA_COFFEE":
      return "Tea/Coffee";
    case "SMOKE":
      return "Smoke";
    case "PERSONAL":
      return "Personal";
    case "EMERGENCY":
      return "Emergency";
    default:
      return type ? type.replace(/_/g, " ") : "Break";
  }
}

export default function EmployeeAttendanceLogsPage() {
  const { user } = useAuth();

  const todayStr = useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const currentMonthStart = useMemo(() => `${todayStr.slice(0, 7)}-01`, [todayStr]);

  const [dateRange, setDateRange] = useState<DateRangeValue>({
    preset: "THIS_MONTH",
    startDate: currentMonthStart,
    endDate: todayStr,
  });

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const {
    data: reportData,
    isLoading,
    isFetching,
    refetch,
  } = useIndividualAttendanceReport({
    userId: user?.id,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const dailyHistory = reportData?.dailyHistory || [];

  const filteredRows = useMemo(() => {
    return dailyHistory.filter((row) => {
      if (statusFilter !== "ALL") {
        if (statusFilter === "PRESENT" && row.status !== "Present") return false;
        if (statusFilter === "LATE" && row.status !== "Late") return false;
        if (statusFilter === "ABSENT" && row.status !== "Absent") return false;
        if (statusFilter === "OFF_DAY" && row.status !== "Off-Day") return false;
        if (statusFilter === "HOLIDAY" && row.status !== "Holiday") return false;
        if (statusFilter === "LEAVE" && row.status !== "Leave") return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const d = (row.dateFormatted || "").toLowerCase();
        const s = (row.status || "").toLowerCase();
        const day = (row.dayName || "").toLowerCase();
        const hol = (row.holidayName || "").toLowerCase();
        if (!d.includes(q) && !s.includes(q) && !day.includes(q) && !hol.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [dailyHistory, statusFilter, searchTerm]);

  const stats = reportData?.stats || {
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    leaveDays: 0,
    offDays: 0,
    holidays: 0,
    totalWorkHours: "0h",
    totalWorkMinutes: 0,
    totalOvertimeMinutes: 0,
  };

  const handleExportPDF = () => {
    if (!reportData || !reportData.employee) return;
    setIsExportingPDF(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const primaryColor: [number, number, number] = [15, 23, 42]; // slate-900

      // Company Header
      const companyName = user?.organization?.name || "HR MANAGEMENT PLATFORM";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(...primaryColor);
      doc.text(companyName.toUpperCase(), 14, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text("EMPLOYEE ATTENDANCE ACTIVITY REPORT", 14, 23);

      // Period & Generated Date
      doc.setFontSize(8.5);
      const rangeText =
        dateRange.startDate === dateRange.endDate
          ? formatDate(dateRange.startDate)
          : `${formatDate(dateRange.startDate)} — ${formatDate(dateRange.endDate)}`;
      doc.text(`Period: ${rangeText}`, 196, 18, { align: "right" });
      doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, 196, 23, { align: "right" });

      // Horizontal separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 26, 196, 26);

      // Employee Info Grid Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 29, 182, 23, 2, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...primaryColor);
      doc.text(reportData.employee.fullName || "—", 18, 35);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`ID: ${reportData.employee.employeeId || "—"}`, 18, 41);
      doc.text(`Department: ${reportData.employee.department || "—"}`, 18, 47);

      doc.text(`Designation: ${reportData.employee.designation || "—"}`, 80, 41);
      doc.text(`Branch: ${reportData.employee.branch || "—"}`, 80, 47);

      const shiftInfo = reportData.employee.shift
        ? `${reportData.employee.shift.name} (${reportData.employee.shift.startTime} - ${reportData.employee.shift.endTime})`
        : "Standard Duty";
      doc.text(`Shift: ${shiftInfo}`, 140, 41);
      doc.text(`Off-Days: ${reportData.employee.offDays?.join(", ") || "Friday"}`, 140, 47);

      // KPI Summary Stat Boxes
      const kpiStartY = 55;
      const boxWidth = 28.5;
      const boxHeight = 14;
      const gap = 2.2;

      // 1. On Time
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(14, kpiStartY, boxWidth, boxHeight, 1.5, 1.5, "FD");
      doc.setFontSize(6);
      doc.setTextColor(5, 150, 105);
      doc.text("ON TIME DAYS", 16, kpiStartY + 4.5);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(String(stats.presentDays).padStart(2, "0"), 16, kpiStartY + 10.5);

      // 2. Absent
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(14 + boxWidth + gap, kpiStartY, boxWidth, boxHeight, 1.5, 1.5, "FD");
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 38, 38);
      doc.text("ABSENT DAYS", 14 + boxWidth + gap + 2, kpiStartY + 4.5);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(String(stats.absentDays).padStart(2, "0"), 14 + boxWidth + gap + 2, kpiStartY + 10.5);

      // 3. Expected Duty Hour
      doc.setFillColor(238, 242, 255);
      doc.setDrawColor(199, 210, 254);
      doc.roundedRect(14 + (boxWidth + gap) * 2, kpiStartY, boxWidth, boxHeight, 1.5, 1.5, "FD");
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(67, 56, 202);
      doc.text("EXPECTED DUTY", 14 + (boxWidth + gap) * 2 + 2, kpiStartY + 4.5);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(stats.expectedDutyFormatted || "0h", 14 + (boxWidth + gap) * 2 + 2, kpiStartY + 10.5);

      // 4. Late
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(253, 230, 138);
      doc.roundedRect(14 + (boxWidth + gap) * 3, kpiStartY, boxWidth, boxHeight, 1.5, 1.5, "FD");
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(217, 119, 6);
      doc.text("LATE DAYS", 14 + (boxWidth + gap) * 3 + 2, kpiStartY + 4.5);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(String(stats.lateDays).padStart(2, "0"), 14 + (boxWidth + gap) * 3 + 2, kpiStartY + 10.5);

      // 5. Total Work Hours
      doc.setFillColor(240, 249, 255);
      doc.setDrawColor(186, 230, 253);
      doc.roundedRect(14 + (boxWidth + gap) * 4, kpiStartY, boxWidth, boxHeight, 1.5, 1.5, "FD");
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(2, 132, 199);
      doc.text("WORK HOURS", 14 + (boxWidth + gap) * 4 + 2, kpiStartY + 4.5);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(stats.totalWorkHours, 14 + (boxWidth + gap) * 4 + 2, kpiStartY + 10.5);

      // 6. Duty Balance (Extra / Less)
      const balMins = stats.balanceMinutes || 0;
      doc.setFillColor(balMins >= 0 ? 240 : 255, balMins >= 0 ? 253 : 241, balMins >= 0 ? 244 : 242);
      doc.setDrawColor(balMins >= 0 ? 187 : 254, balMins >= 0 ? 247 : 202, balMins >= 0 ? 208 : 202);
      doc.roundedRect(14 + (boxWidth + gap) * 5, kpiStartY, boxWidth, boxHeight, 1.5, 1.5, "FD");
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(balMins >= 0 ? 22 : 220, balMins >= 0 ? 101 : 38, balMins >= 0 ? 52 : 38);
      doc.text("DUTY BALANCE", 14 + (boxWidth + gap) * 5 + 2, kpiStartY + 4.5);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(stats.extraLessBalanceFormatted || "0h 0m", 14 + (boxWidth + gap) * 5 + 2, kpiStartY + 10.5);

      // Table of Daily Attendance History
      const tableRows = (filteredRows || []).map((row) => {
        const breakSummary = (row.totalBreakMinutes || 0) > 0 ? `${row.totalBreakMinutes}m` : "—";
        const breakTypes = (row.breaks || []).map((b) => `${formatBreakTypeName(b.breakType)} (${b.durationMinutes || 0}m)`).join(", ");
        const breakText = breakTypes ? `${breakSummary} (${breakTypes})` : breakSummary;
        const otText = (row.overtimeMinutes || 0) > 0 ? `+${Math.floor(row.overtimeMinutes / 60)}h ${row.overtimeMinutes % 60}m` : "—";

        return [
          `${row.dateFormatted} (${row.dayName.slice(0, 3)})`,
          row.checkIn,
          row.checkOut,
          row.status,
          row.workHoursFormatted,
          breakText,
          otText,
        ];
      });

      autoTable(doc, {
        startY: 73,
        head: [["Date", "Check-in", "Check-out", "Status", "Work Hours", "Break Details", "Overtime"]],
        body: tableRows,
        theme: "plain",
        styles: {
          fontSize: 8,
          cellPadding: 2,
          textColor: [51, 65, 85],
          lineColor: [241, 245, 249],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [30, 41, 59],
          fontStyle: "bold",
          halign: "left",
        },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 22 },
          2: { cellWidth: 22 },
          3: { cellWidth: 20 },
          4: { cellWidth: 22 },
          5: { cellWidth: 46 },
          6: { cellWidth: 22 },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 3) {
            const val = String(data.cell.raw);
            if (val === "Present") {
              data.cell.styles.textColor = [5, 150, 105]; // emerald
              data.cell.styles.fontStyle = "bold";
            } else if (val === "Late") {
              data.cell.styles.textColor = [217, 119, 6]; // amber
              data.cell.styles.fontStyle = "bold";
            } else if (val === "Absent") {
              data.cell.styles.textColor = [220, 38, 38]; // rose
              data.cell.styles.fontStyle = "bold";
            } else if (val === "Off-Day") {
              data.cell.styles.textColor = [100, 116, 139]; // slate
            } else if (val === "Holiday") {
              data.cell.styles.textColor = [14, 165, 233]; // sky
            }
          }
        },
      });

      const fileName = `Attendance_Log_${(reportData.employee.fullName || "Report").replace(/\s+/g, "_")}_${dateRange.startDate}_to_${dateRange.endDate}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-6">
      {/* Top Header Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/portal/attendance"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>Attendance History</span>
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
            </h1>
            <p className="text-[11px] text-slate-500">View and print your complete activity logs</p>
          </div>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={isExportingPDF || !reportData}
          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isExportingPDF ? "Exporting..." : "Print PDF"}</span>
        </button>
      </div>

      {/* Date Range Picker Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs space-y-2">
        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
          Choose Date Period
        </label>
        <PremiumDateRangePicker
          value={dateRange}
          onChange={(val) => setDateRange(val)}
        />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-center">
          <p className="text-[10px] font-bold uppercase text-emerald-800">On Time</p>
          <p className="text-base font-black text-emerald-700 mt-0.5">{stats.presentDays}</p>
        </div>
        <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-center">
          <p className="text-[10px] font-bold uppercase text-amber-800">Late</p>
          <p className="text-base font-black text-amber-700 mt-0.5">{stats.lateDays}</p>
        </div>
        <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-200 text-center">
          <p className="text-[10px] font-bold uppercase text-rose-800">Absent</p>
          <p className="text-base font-black text-rose-700 mt-0.5">{stats.absentDays}</p>
        </div>
        <div className="p-2 rounded-lg bg-indigo-50/70 border border-indigo-200 text-center">
          <p className="text-[10px] font-bold uppercase text-indigo-800">Expected</p>
          <p className="text-base font-black text-indigo-700 mt-0.5">{stats.expectedDutyFormatted || "0h 0m"}</p>
        </div>
        <div className="p-2 rounded-lg bg-sky-50/70 border border-sky-200 text-center">
          <p className="text-[10px] font-bold uppercase text-sky-800">Work Hours</p>
          <p className="text-base font-black text-sky-700 mt-0.5">{stats.totalWorkHours}</p>
        </div>
        <div className={`p-2 rounded-lg border text-center ${
          (stats.balanceMinutes || 0) >= 0 ? "bg-emerald-50/70 border-emerald-300 text-emerald-800" : "bg-rose-50/70 border-rose-300 text-rose-800"
        }`}>
          <p className="text-[10px] font-bold uppercase">Duty Balance</p>
          <p className={`text-base font-black mt-0.5 ${
            (stats.balanceMinutes || 0) >= 0 ? "text-emerald-700" : "text-rose-700"
          }`}>
            {stats.extraLessBalanceFormatted || "0h 0m"}
          </p>
        </div>
      </div>

      {/* Filters (Status + Search) */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search date or status..."
            className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          triggerClassName="h-8 text-xs min-w-32"
          options={[
            { value: "ALL", label: "All Status" },
            { value: "PRESENT", label: "On Time" },
            { value: "LATE", label: "Late" },
            { value: "ABSENT", label: "Absent" },
            { value: "LEAVE", label: "On Leave" },
            { value: "OFF_DAY", label: "Off Day" },
          ]}
        />
      </div>

      {/* Daily Records List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading your attendance records...</span>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
            No attendance records found for this period.
          </div>
        ) : (
          filteredRows.map((row) => {
            const isPresent = row.status === "Present";
            const isLate = row.status === "Late";
            const isAbsent = row.status === "Absent";
            const isOffDay = row.status === "Off-Day";
            const isHoliday = row.status === "Holiday";
            const isLeave = row.status === "Leave";

            return (
              <div
                key={row.date}
                className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2"
              >
                {/* Header: Date + Status Badge */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-900">{row.dateFormatted}</span>
                    <span className="text-[11px] text-slate-500 ml-1.5 font-medium">({row.dayName})</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isPresent
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : isLate
                        ? "bg-amber-50 text-amber-700 border-amber-200 font-extrabold"
                        : isAbsent
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : isLeave
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : isHoliday
                        ? "bg-sky-50 text-sky-700 border-sky-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {isHoliday ? `Holiday: ${row.holidayName || ""}` : isPresent ? "On Time" : row.status}
                  </span>
                </div>

                {/* Punch Details Grid (Only for Present / Late) */}
                {(isPresent || isLate) ? (
                  <div className="grid grid-cols-4 gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Check In</span>
                      <span className="font-mono font-bold text-slate-800">{row.checkIn}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Check Out</span>
                      <span className="font-mono font-bold text-slate-800">{row.checkOut}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Duty Hours</span>
                      <span className="font-mono font-bold text-emerald-700">{row.workHoursFormatted}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Overtime</span>
                      <span className={`font-mono font-bold ${(row.overtimeMinutes || 0) > 0 ? "text-indigo-600" : "text-slate-400"}`}>
                        {(row.overtimeMinutes || 0) > 0
                          ? `+${Math.floor(row.overtimeMinutes / 60)}h ${row.overtimeMinutes % 60}m`
                          : "—"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">
                    {isOffDay ? "Designated weekly off-day." : isHoliday ? "Official organization holiday." : isLeave ? "Approved leave record." : "No punch recorded (Absent)."}
                  </div>
                )}

                {/* Breaks summary (if any) */}
                {(row.totalBreakMinutes || 0) > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50/60 px-2 py-1 rounded border border-amber-100">
                    <Coffee className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>
                      Breaks: {row.totalBreakMinutes} mins total{" "}
                      {row.breaks && row.breaks.length > 0 && (
                        <span>({row.breaks.map((b) => `${formatBreakTypeName(b.breakType)}: ${b.durationMinutes}m`).join(", ")})</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

