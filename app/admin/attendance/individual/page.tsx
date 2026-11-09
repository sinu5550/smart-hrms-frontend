'use client';

import React, { useState, useMemo, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEmployees, useIndividualAttendanceReport, useOrganization } from "@/hooks";
import {
  UserCheck,
  Search,
  ChevronDown,
  Printer,
  ArrowLeft,
  Check,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Clock,
  Coffee,
  CheckCircle2,
  CalendarCheck,
  Building2,
  Shield,
  Briefcase,
  Layers,
  MapPin,
  Filter,
} from "lucide-react";
import Link from "next/link";
import {
  PremiumDateRangePicker,
  DateRangeValue,
} from "@/components/ui/PremiumDateRangePicker";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

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

function IndividualReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryUserId = searchParams.get("userId") || "";
  const queryStartDate = searchParams.get("startDate") || "";
  const queryEndDate = searchParams.get("endDate") || "";

  // Organization info
  const { data: organization } = useOrganization();

  // All employees for searchable dropdown
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();

  // Active selected employee ID
  const [selectedUserId, setSelectedUserId] = useState<string>(queryUserId);

  // Date Range filter matching Attendance Monitor
  const todayStr = useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const currentMonthStart = useMemo(() => `${todayStr.slice(0, 7)}-01`, [todayStr]);

  const [dateRange, setDateRange] = useState<DateRangeValue>(() => {
    if (queryStartDate && queryEndDate) {
      return {
        preset: "CUSTOM",
        startDate: queryStartDate,
        endDate: queryEndDate,
      };
    }
    return {
      preset: "THIS_MONTH",
      startDate: currentMonthStart,
      endDate: todayStr,
    };
  });

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [tableSearch, setTableSearch] = useState<string>("");

  // Sync selectedUserId ONLY if URL param exists
  useEffect(() => {
    if (queryUserId) {
      setSelectedUserId(queryUserId);
    }
  }, [queryUserId]);

  // Search input inside custom employee dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Click outside to close custom dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [dropdownOpen]);

  // Filtered employees for dropdown (Sorted Ascending by Employee ID: 1, 2, 3...)
  const filteredEmployees = useMemo(() => {
    let list = employees;
    if (dropdownSearch.trim()) {
      const term = dropdownSearch.toLowerCase().trim();
      list = employees.filter((emp) => {
        const name = (emp.fullName || "").toLowerCase();
        const code = (emp.employeeId || "").toLowerCase();
        const dept = (emp.department?.name || "").toLowerCase();
        const desig = (emp.designation?.name || "").toLowerCase();
        return name.includes(term) || code.includes(term) || dept.includes(term) || desig.includes(term);
      });
    }
    return [...list].sort((a, b) => {
      return (a.employeeId || "").localeCompare(b.employeeId || "", undefined, { numeric: true, sensitivity: "base" });
    });
  }, [employees, dropdownSearch]);

  // Selected employee object
  const currentEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedUserId) || null;
  }, [employees, selectedUserId]);

  // Query individual report from backend
  const {
    data: reportData,
    isLoading: reportLoading,
    isFetching: reportFetching,
    refetch: refetchReport,
  } = useIndividualAttendanceReport({
    userId: selectedUserId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // Filtered daily rows based on tableSearch and statusFilter
  const filteredDailyRows = useMemo(() => {
    if (!reportData?.dailyHistory) return [];
    return reportData.dailyHistory.filter((row) => {
      // Status filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "PRESENT" && row.status !== "Present") return false;
        if (statusFilter === "LATE" && row.status !== "Late") return false;
        if (statusFilter === "ABSENT" && row.status !== "Absent") return false;
        if (statusFilter === "OFF_DAY" && row.status !== "Off-Day") return false;
        if (statusFilter === "HOLIDAY" && row.status !== "Holiday") return false;
        if (statusFilter === "LEAVE" && row.status !== "Leave") return false;
      }
      // Text search
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase().trim();
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
  }, [reportData, statusFilter, tableSearch]);

  // Export PDF with jsPDF and jspdf-autotable
  const [isExportingPDF, setIsExportingPDF] = useState(false);

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
      const companyName = organization?.name || "HR MANAGEMENT PLATFORM";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...primaryColor);
      doc.text(companyName.toUpperCase(), 14, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("EMPLOYEE INDIVIDUAL ATTENDANCE REPORT", 14, 24);

      // Period & Generated Date
      doc.setFontSize(9);
      const rangeText =
        dateRange.startDate === dateRange.endDate
          ? formatDate(dateRange.startDate)
          : `${formatDate(dateRange.startDate)} — ${formatDate(dateRange.endDate)}`;
      doc.text(`Period: ${rangeText}`, 196, 18, { align: "right" });
      doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, 196, 24, { align: "right" });

      // Horizontal separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 28, 196, 28);

      // Employee Info Grid Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 32, 182, 26, 2, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...primaryColor);
      doc.text(reportData.employee.fullName || "—", 18, 39);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`ID: ${reportData.employee.employeeId || "—"}`, 18, 45);
      doc.text(`Department: ${reportData.employee.department || "—"}`, 18, 51);

      doc.text(`Designation: ${reportData.employee.designation || "—"}`, 80, 45);
      doc.text(`Branch: ${reportData.employee.branch || "—"}`, 80, 51);

      const shiftInfo = reportData.employee.shift
        ? `${reportData.employee.shift.name} (${reportData.employee.shift.startTime} - ${reportData.employee.shift.endTime})`
        : "Standard Duty";
      doc.text(`Shift: ${shiftInfo}`, 140, 45);
      doc.text(`Off-Days: ${reportData.employee.offDays?.join(", ") || "Friday"}`, 140, 51);

      // KPI Summary Stat Boxes
      const stats = reportData.stats;
      const kpiStartY = 62;
      const boxWidth = 43;
      const boxHeight = 16;
      const gap = 3.3;

      // 1. Present
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(14, kpiStartY, boxWidth, boxHeight, 1.5, 1.5, "FD");
      doc.setFontSize(7.5);
      doc.setTextColor(5, 150, 105);
      doc.text("PRESENT DAYS", 17, kpiStartY + 5);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(String(stats.presentDays).padStart(2, "0"), 17, kpiStartY + 12);

      // 2. Absent
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(14 + boxWidth + gap, kpiStartY, boxWidth, boxHeight, 1.5, 1.5, "FD");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 38, 38);
      doc.text("ABSENT DAYS", 14 + boxWidth + gap + 3, kpiStartY + 5);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(String(stats.absentDays).padStart(2, "0"), 14 + boxWidth + gap + 3, kpiStartY + 12);

      // 3. Late
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(253, 230, 138);
      doc.roundedRect(14 + (boxWidth + gap) * 2, kpiStartY, boxWidth, boxHeight, 1.5, 1.5, "FD");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(217, 119, 6);
      doc.text("LATE DAYS", 14 + (boxWidth + gap) * 2 + 3, kpiStartY + 5);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(String(stats.lateDays).padStart(2, "0"), 14 + (boxWidth + gap) * 2 + 3, kpiStartY + 12);

      // 4. Total Work Hours
      doc.setFillColor(240, 249, 255);
      doc.setDrawColor(186, 230, 253);
      doc.roundedRect(14 + (boxWidth + gap) * 3, kpiStartY, boxWidth, boxHeight, 1.5, 1.5, "FD");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(2, 132, 199);
      doc.text("TOTAL WORK HOURS", 14 + (boxWidth + gap) * 3 + 3, kpiStartY + 5);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(stats.totalWorkHours, 14 + (boxWidth + gap) * 3 + 3, kpiStartY + 12);

      // Table of Daily Attendance History matching Attendance Monitor
      const tableRows = (filteredDailyRows || []).map((row) => {
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
        startY: 83,
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
          textColor: [15, 23, 42],
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 24 },
          2: { cellWidth: 24 },
          3: { cellWidth: 24, fontStyle: "bold" },
          4: { cellWidth: 24 },
          5: { cellWidth: 32 },
          6: { cellWidth: 22 },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 3) {
            const val = String(data.cell.raw);
            if (val === "Present") {
              data.cell.styles.textColor = [16, 185, 129];
            } else if (val === "Late") {
              data.cell.styles.textColor = [217, 119, 6];
            } else if (val === "Absent") {
              data.cell.styles.textColor = [239, 68, 68];
            } else if (val === "Off-Day") {
              data.cell.styles.textColor = [147, 51, 234];
            } else if (val === "Holiday") {
              data.cell.styles.textColor = [14, 165, 233];
            } else if (val === "Leave") {
              data.cell.styles.textColor = [13, 148, 136];
            } else {
              data.cell.styles.textColor = [148, 163, 184];
            }
          }
        },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${i} of ${pageCount} — Generated by SmartHRM`,
          105,
          290,
          { align: "center" }
        );
      }

      const safeId = (reportData.employee.employeeId || "emp").replace(/[^a-zA-Z0-9_-]/g, "_");
      doc.save(`Attendance_Report_${safeId}_${dateRange.startDate}_to_${dateRange.endDate}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Export to Excel (.xlsx) using ExcelJS
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExportExcel = async () => {
    if (!reportData || !reportData.employee) return;
    setIsExportingExcel(true);

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = organization?.name || "SmartHRM";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Individual Attendance", {
        views: [{ state: "frozen", ySplit: 5 }],
      });

      // Title & Employee Metadata in Top Rows
      worksheet.mergeCells("A1:G1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = `${organization?.name || "SmartHRM"} - Individual Attendance Report`;
      titleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF0F172A" } };
      titleCell.alignment = { vertical: "middle", horizontal: "left" };

      worksheet.mergeCells("A2:G2");
      const subCell = worksheet.getCell("A2");
      subCell.value = `Employee: ${reportData.employee.fullName} (${reportData.employee.employeeId}) | Department: ${reportData.employee.department} | Designation: ${reportData.employee.designation}`;
      subCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF475569" } };

      worksheet.mergeCells("A3:G3");
      const metaCell = worksheet.getCell("A3");
      metaCell.value = `Period: ${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)} | Shift: ${reportData.employee.shift?.name || "Standard"} | Off-Days: ${reportData.employee.offDays?.join(", ")}`;
      metaCell.font = { name: "Calibri", size: 10, color: { argb: "FF475569" } };

      worksheet.mergeCells("A4:G4");
      const statCell = worksheet.getCell("A4");
      statCell.value = `Summary: Present Days: ${reportData.stats.presentDays} | Absent Days: ${reportData.stats.absentDays} | Late Days: ${reportData.stats.lateDays} | Total Work Hours: ${reportData.stats.totalWorkHours}`;
      statCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF059669" } };

      // Table Header at Row 5
      worksheet.getRow(5).values = [
        "Date",
        "Check-In",
        "Check-Out",
        "State",
        "Status",
        "Work Hours",
        "Break Details",
        "Overtime",
      ];

      worksheet.columns = [
        { key: "date", width: 20 },
        { key: "checkIn", width: 14 },
        { key: "checkOut", width: 14 },
        { key: "state", width: 16 },
        { key: "status", width: 14 },
        { key: "workHours", width: 16 },
        { key: "breaks", width: 30 },
        { key: "overtime", width: 16 },
      ];

      const headerRow = worksheet.getRow(5);
      headerRow.height = 26;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0F172A" },
        };
        cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { vertical: "middle", horizontal: "left" };
      });

      // Data Rows
      filteredDailyRows.forEach((r) => {
        const breakSummary = (r.totalBreakMinutes || 0) > 0 ? `${r.totalBreakMinutes}m` : "—";
        const breakTypes = (r.breaks || []).map((b) => `${formatBreakTypeName(b.breakType)} (${b.durationMinutes || 0}m)`).join(", ");
        const breakText = breakTypes ? `${breakSummary} (${breakTypes})` : breakSummary;
        const otText = (r.overtimeMinutes || 0) > 0 ? `+${Math.floor(r.overtimeMinutes / 60)}h ${r.overtimeMinutes % 60}m` : "—";

        worksheet.addRow({
          date: `${r.dateFormatted} (${r.dayName.slice(0, 3)})`,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          state: r.currentState || "—",
          status: r.status,
          workHours: r.workHoursFormatted,
          breaks: breakText,
          overtime: otText,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeId = (reportData.employee.employeeId || "emp").replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `Attendance_Report_${safeId}_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel export failed:", err);
      alert("Failed to export Excel file.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col space-y-4 pb-12">
      {/* Print-Only Branded Header */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {organization?.name || "SmartHRM Platform"}
          </h1>
          <p className="text-xs text-slate-600 font-medium">Individual Employee Attendance Report</p>
        </div>
        <div className="text-right text-xs text-slate-600">
          <p>
            Period: <span className="font-bold text-slate-900">{formatDate(dateRange.startDate)} — {formatDate(dateRange.endDate)}</span>
          </p>
          <p>Employee: {reportData?.employee?.fullName} ({reportData?.employee?.employeeId})</p>
        </div>
      </div>

      {/* Top Header & Export Actions Bar (Matches Attendance Monitor width & consistency) */}
      <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/attendance"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
            title="Back to Attendance Monitor"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-700" />
              Individual Attendance Report
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Single employee attendance timeline, work sessions, break breakdowns & performance metrics.
            </p>
          </div>
        </div>

        {/* Top-Right Corner Action & Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/attendance"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Live Monitor</span>
          </Link>

          <Link
            href="/admin/attendance/reports"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>All Staff Summary</span>
          </Link>

          {/* Print PDF Button */}
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!reportData || filteredDailyRows.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Print Attendance Report"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Print</span>
          </button>

          {/* Export PDF Download */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF || !reportData || filteredDailyRows.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Download Branded PDF Document"
          >
            <FileText className="w-3.5 h-3.5 text-white" />
            <span>{isExportingPDF ? "Exporting..." : "Export PDF"}</span>
          </button>

          {/* Export Excel (.xlsx) Download */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel || !reportData || filteredDailyRows.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Export full attendance records to Excel spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
            <span>{isExportingExcel ? "Exporting..." : "Excel"}</span>
          </button>

          {/* Refresh Query */}
          <button
            type="button"
            onClick={() => refetchReport()}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 transition shadow-xs"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-4 h-4 ${reportFetching ? "animate-spin text-emerald-700" : ""}`} />
          </button>
        </div>
      </div>

      {/* Control & Filter Bar (Matching Attendance Monitor Layout) */}
      <div className="shrink-0 bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs print:hidden">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left: Custom Searchable Employee Dropdown */}
          <div className="relative min-w-[280px] sm:min-w-[340px]" ref={dropdownRef}>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Select Employee</span>
            </label>

            {/* Trigger Button */}
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="h-9 w-full bg-white hover:bg-slate-50 border border-slate-300 rounded-lg px-3 text-left flex items-center justify-between transition shadow-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {currentEmployee ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {currentEmployee.fullName?.slice(0, 2).toUpperCase() || "EM"}
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-800">
                        {currentEmployee.fullName}
                      </span>
                      <span className="ml-1.5 text-[11px] text-slate-500 font-mono">
                        ({currentEmployee.employeeId})
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Select Employee</span>
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${dropdownOpen ? "rotate-180 text-emerald-600" : ""}`} />
            </button>

            {/* Floating Searchable Menu (Light Theme with fixed height and scroll) */}
            {dropdownOpen && (
              <div className="absolute left-0 w-80 sm:w-96 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Search input pinned at top with clean rounded input */}
                <div className="p-2.5 bg-slate-50/80 border-b border-slate-200">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={dropdownSearch}
                      onChange={(e) => setDropdownSearch(e.target.value)}
                      placeholder="Search name, ID or department..."
                      className="w-full pl-9 pr-7 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition shadow-2xs"
                    />
                    {dropdownSearch && (
                      <button
                        type="button"
                        onClick={() => setDropdownSearch("")}
                        className="absolute right-2 text-slate-400 hover:text-slate-600 px-1 text-xs font-bold rounded"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Fixed-height scrollable list */}
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No employees match "{dropdownSearch}"
                    </div>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const isSelected = emp.id === selectedUserId;
                      return (
                        <div
                          key={emp.id}
                          onClick={() => {
                            setSelectedUserId(emp.id);
                            setDropdownOpen(false);
                            setDropdownSearch("");
                          }}
                          className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-emerald-50/80 text-emerald-950 font-semibold border-l-4 border-emerald-600"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {emp.fullName?.slice(0, 2).toUpperCase() || "EM"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-900 truncate">
                                {emp.fullName}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono truncate">
                                <span>{emp.employeeId}</span>
                                <span>•</span>
                                <span className="text-slate-600 font-sans truncate">
                                  {emp.department?.name || "General"}
                                </span>
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Date Range Picker & Table Search & Status Filter (Matching Attendance Monitor) */}
          <div className="flex items-end gap-2.5 flex-wrap">
            {/* Premium Date Range Picker */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Period Range
              </label>
              <PremiumDateRangePicker
                value={dateRange}
                onChange={(val) => setDateRange(val)}
              />
            </div>

            {/* Status Filter Dropdown */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Status
              </label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                triggerClassName="h-9 min-w-36 text-xs bg-white border-slate-300"
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: "PRESENT", label: "Present" },
                  { value: "LATE", label: "Late" },
                  { value: "ABSENT", label: "Absent" },
                  { value: "OFF_DAY", label: "Off-Days" },
                  { value: "HOLIDAY", label: "Holidays" },
                  { value: "LEAVE", label: "Leave" },
                ]}
              />
            </div>

            {/* In-table Search */}
            <div className="relative">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Filter Days
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter date / notes..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="h-9 rounded-lg border border-slate-300 pl-8 pr-3 text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* If No Employee Selected, Show Friendly Prompt Card */}
      {!selectedUserId ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 sm:p-20 text-center shadow-xs flex flex-col items-center justify-center space-y-3.5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-2xs">
            <UserCheck className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Please Choose an Employee
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Choose an employee from the dropdown above to view their attendance report, work hours, breaks, and daily timeline.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDropdownOpen(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Select Employee</span>
          </button>
        </div>
      ) : (
        <>
          {/* Employee Profile Header & Details Card (Clean Light Theme) */}
          {reportData?.employee && (
            <div className="shrink-0 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Left: Avatar & Personal Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-sm">
                    {reportData.employee.fullName?.slice(0, 2).toUpperCase() || "EM"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                        {reportData.employee.fullName}
                      </h2>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {reportData.employee.employeeId}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {reportData.employee.department}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span>{reportData.employee.designation}</span>
                      <span>•</span>
                      <span>{reportData.employee.branch}</span>
                      {reportData.employee.email && (
                        <>
                          <span>•</span>
                          <span>{reportData.employee.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Duty Shift & Off-Days Badges */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                    <span className="text-slate-400 font-medium mr-1.5">Shift:</span>
                    <span className="font-semibold text-slate-800">
                      {reportData.employee.shift
                        ? `${reportData.employee.shift.name} (${reportData.employee.shift.startTime} - ${reportData.employee.shift.endTime})`
                        : "Standard Duty"}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800">
                    <span className="text-purple-600 font-medium mr-1.5">Off-Days:</span>
                    <span className="font-bold">
                      {reportData.employee.offDays?.join(", ") || "Friday"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4 KPI Summary Cards (Clean Light Theme with Software Colors) */}
          {reportData?.stats && (
            <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
              {/* 1. Present Days */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                  <span>Present Days</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1.5">
                  {String(reportData.stats.presentDays).padStart(2, "0")}
                </p>
              </div>

              {/* 2. Absent Days */}
              <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3.5 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
                  <span>Absent Days</span>
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-rose-700 mt-1.5">
                  {String(reportData.stats.absentDays).padStart(2, "0")}
                </p>
              </div>

              {/* 3. Late Days */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
                  <span>Late Days</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-700 mt-1.5">
                  {String(reportData.stats.lateDays).padStart(2, "0")}
                </p>
              </div>

              {/* 4. Total Work Hours */}
              <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-3.5 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-sky-800">
                  <span>Total Work Hours</span>
                  <Clock className="w-4 h-4 text-sky-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-sky-700 mt-1.5">
                  {reportData.stats.totalWorkHours}
                </p>
              </div>
            </div>
          )}

          {/* Daily Attendance Records Table (Matching Attendance Monitor Table Columns & Design) */}
          <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
            {reportLoading ? (
              <div className="p-16 text-center">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-medium">Loading employee attendance timeline from database...</p>
              </div>
            ) : !reportData ? (
              <div className="p-16 text-center text-slate-500">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs">Please choose an employee to view their individual attendance report.</p>
              </div>
            ) : filteredDailyRows.length === 0 ? (
              <div className="p-16 text-center text-slate-500">
                <UserCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs">No attendance entries match this filter range.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 border-b border-slate-200 shadow-xs">
                    <tr>
                      <th className="py-3 px-4 font-bold tracking-wide">Date</th>
                      <th className="py-3 px-4 font-bold tracking-wide">Check-In</th>
                      <th className="py-3 px-4 font-bold tracking-wide">Check-Out</th>
                      <th className="py-3 px-4 font-bold tracking-wide">State</th>
                      <th className="py-3 px-4 font-bold tracking-wide">Status</th>
                      <th className="py-3 px-4 font-bold tracking-wide">Work Hour</th>
                      <th className="py-3 px-4 font-bold tracking-wide">Break Time & Types</th>
                      <th className="py-3 px-4 font-bold tracking-wide">Overtime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredDailyRows.map((row) => {
                      const isPresent = row.status === "Present";
                      const isLate = row.status === "Late";
                      const isAbsent = row.status === "Absent";
                      const isOffDay = row.status === "Off-Day";
                      const isHoliday = row.status === "Holiday";
                      const isLeave = row.status === "Leave";

                      return (
                        <tr key={row.date} className="hover:bg-slate-50/80 transition-colors">
                          {/* Date */}
                          <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                            <span className="font-bold">{row.dateFormatted}</span>
                            <span className="ml-1.5 text-[11px] text-slate-500">
                              ({row.dayName.slice(0, 3)})
                            </span>
                          </td>

                          {/* Check-In */}
                          <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                            {row.checkIn !== "—" ? (
                              <span className="font-semibold text-slate-800">{row.checkIn}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Check-Out */}
                          <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                            {row.checkOut !== "—" ? (
                              <span className="font-semibold text-slate-800">{row.checkOut}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* State (Active, On Break, Concluded, or Not Checked In) */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {row.currentState === "CHECKED_IN" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-800 border border-emerald-200 bg-emerald-50">
                                Active
                              </span>
                            )}
                            {row.currentState === "ON_BREAK" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                On Break
                              </span>
                            )}
                            {row.currentState === "CHECKED_OUT" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                Concluded
                              </span>
                            )}
                            {(!row.currentState || row.currentState === "NOT_CHECKED_IN") && (
                              <span className="text-slate-400 font-mono">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isPresent && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Present
                              </span>
                            )}
                            {isLate && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Late
                              </span>
                            )}
                            {isAbsent && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Absent
                              </span>
                            )}
                            {isOffDay && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                Off-Day
                              </span>
                            )}
                            {isHoliday && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200" title={row.holidayName || "Holiday"}>
                                Holiday{row.holidayName ? `: ${row.holidayName}` : ""}
                              </span>
                            )}
                            {isLeave && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                                Leave
                              </span>
                            )}
                            {row.status === "Upcoming" && (
                              <span className="text-slate-400 text-[11px]">Upcoming</span>
                            )}
                          </td>

                          {/* Work Hour */}
                          <td className="py-3 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                            {row.workHoursFormatted !== "—" ? (
                              <span className="font-bold text-slate-900">{row.workHoursFormatted}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Break Time & Types (With Break Names) */}
                          <td className="py-3 px-4 text-slate-700">
                            {(row.totalBreakMinutes || 0) > 0 ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-slate-800">
                                  {row.totalBreakMinutes}m
                                </span>
                                {row.breaks && row.breaks.length > 0 && (
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {row.breaks.map((b) => (
                                      <span
                                        key={b.id}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px]"
                                        title={`${formatBreakTypeName(b.breakType)}: ${b.startTime} - ${b.endTime || "Active"}`}
                                      >
                                        <Coffee className="w-2.5 h-2.5 text-amber-600" />
                                        <span>{formatBreakTypeName(b.breakType)}</span>
                                        <span className="font-mono font-semibold text-slate-900">({b.durationMinutes || 0}m)</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono">—</span>
                            )}
                          </td>

                          {/* Overtime */}
                          <td className="py-3 px-4 font-mono whitespace-nowrap">
                            {(row.overtimeMinutes || 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                +{Math.floor(row.overtimeMinutes / 60)}h {row.overtimeMinutes % 60}m
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function IndividualReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      }
    >
      <IndividualReportContent />
    </Suspense>
  );
}
