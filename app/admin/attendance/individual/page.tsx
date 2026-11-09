'use client';

import React, { useState, useMemo, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEmployees, useIndividualAttendanceReport, useOrganization } from "@/hooks";
import {
  UserCheck,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  Clock,
  Sparkles,
  Printer,
  ArrowLeft,
  Briefcase,
  Check,
  Shield,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function IndividualReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryUserId = searchParams.get("userId") || "";
  const queryMonth = searchParams.get("month") || "";

  // Organization info
  const { data: organization } = useOrganization();

  // All employees for searchable dropdown
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();

  // Active selected employee ID
  const [selectedUserId, setSelectedUserId] = useState<string>(queryUserId);

  // Active month (format: YYYY-MM)
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(queryMonth || currentMonthStr);

  // If queryUserId changes in URL or employees load first time, sync selection
  useEffect(() => {
    if (queryUserId) {
      setSelectedUserId(queryUserId);
    } else if (!selectedUserId && employees.length > 0) {
      setSelectedUserId(employees[0].id);
    }
  }, [queryUserId, employees, selectedUserId]);

  // Search input inside custom dropdown
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

  // Filtered employees for dropdown
  const filteredEmployees = useMemo(() => {
    if (!dropdownSearch.trim()) return employees;
    const term = dropdownSearch.toLowerCase().trim();
    return employees.filter((emp) => {
      const name = (emp.fullName || "").toLowerCase();
      const code = (emp.employeeId || "").toLowerCase();
      const dept = (emp.department?.name || "").toLowerCase();
      const desig = (emp.designation?.name || "").toLowerCase();
      return name.includes(term) || code.includes(term) || dept.includes(term) || desig.includes(term);
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
    month: selectedMonth,
  });

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(Date.UTC(y, m - 2, 1));
    const py = prevDate.getUTCFullYear();
    const pm = String(prevDate.getUTCMonth() + 1).padStart(2, "0");
    setSelectedMonth(`${py}-${pm}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(Date.UTC(y, m, 1));
    const ny = nextDate.getUTCFullYear();
    const nm = String(nextDate.getUTCMonth() + 1).padStart(2, "0");
    setSelectedMonth(`${ny}-${nm}`);
  };

  const formattedMonthLabel = useMemo(() => {
    if (reportData?.period?.monthLabel) return reportData.period.monthLabel;
    const [y, m] = selectedMonth.split("-").map(Number);
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return `${monthNames[m - 1] || ""} ${y}`;
  }, [selectedMonth, reportData]);

  // PDF Export using jsPDF and jspdf-autotable
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = () => {
    if (!reportData || !reportData.employee) return;
    setIsExporting(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const primaryColor: [number, number, number] = [15, 23, 42]; // slate-900
      const accentGreen: [number, number, number] = [16, 185, 129]; // emerald-500
      const accentRed: [number, number, number] = [239, 68, 68]; // red-500
      const accentAmber: [number, number, number] = [245, 158, 11]; // amber-500
      const accentBlue: [number, number, number] = [14, 165, 233]; // sky-500

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

      // Top Right: Generated Date & Period
      doc.setFontSize(9);
      doc.text(`Report Month: ${formattedMonthLabel}`, 196, 18, { align: "right" });
      doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, 196, 24, { align: "right" });

      // Horizontal separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 28, 196, 28);

      // Employee Info Grid
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

      // Table of Daily Attendance History
      const tableRows = (reportData.dailyHistory || []).map((row) => [
        `${row.dateFormatted} (${row.dayName.slice(0, 3)})`,
        row.checkIn,
        row.checkOut,
        row.workHoursFormatted,
        row.status,
      ]);

      autoTable(doc, {
        startY: 83,
        head: [["Date", "Check-in", "Check-out", "Work Hours", "Status"]],
        body: tableRows,
        theme: "plain",
        styles: {
          fontSize: 8.5,
          cellPadding: 2.2,
          textColor: [51, 65, 85],
          lineColor: [241, 245, 249],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: "bold",
          fontSize: 8.5,
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        columnStyles: {
          0: { cellWidth: 38 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 },
          4: { cellWidth: 39, fontStyle: "bold" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 4) {
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
      doc.save(`Attendance_Report_${safeId}_${selectedMonth}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-full pb-16">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/attendance"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
            title="Back to Attendance Monitor"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Individual Attendance Report
            </h1>
            <p className="text-xs text-slate-500">
              Single employee monthly biometric timeline & performance metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/attendance"
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            Live Monitor
          </Link>
          <Link
            href="/admin/attendance/reports"
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            All Staff Summary
          </Link>
        </div>
      </div>

      {/* Main Container - Sleek Dark Executive Mockup Design */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative overflow-visible">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Employee Attendance Report</span>
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              New Feature
            </span>
          </div>

          {/* Employee Selector Form Section */}
          <div className="bg-[#121824] border border-slate-800/90 rounded-xl p-4 sm:p-5 mb-6 space-y-4">
            {/* SELECT EMPLOYEE Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                SELECT EMPLOYEE
              </label>

              {/* Trigger Button */}
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-[#161f30] hover:bg-[#1a253a] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-left flex items-center justify-between transition-colors cursor-pointer group focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {currentEmployee ? (
                    <>
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {currentEmployee.fullName?.slice(0, 2).toUpperCase() || "EM"}
                      </div>
                      <div className="truncate">
                        <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {currentEmployee.fullName}
                        </span>
                        <span className="ml-2 text-xs text-slate-400 font-mono">
                          ({currentEmployee.employeeId})
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-slate-400">Search or select employee...</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${dropdownOpen ? "rotate-180 text-emerald-400" : ""}`} />
              </button>

              {/* Floating Searchable Menu */}
              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#161f30] border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* Sticky search input */}
                  <div className="p-2.5 border-b border-slate-700/80 bg-[#121824] sticky top-0 z-10 flex items-center gap-2">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={dropdownSearch}
                      onChange={(e) => setDropdownSearch(e.target.value)}
                      placeholder="Type name, ID or department..."
                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-hidden"
                    />
                    {dropdownSearch && (
                      <button
                        onClick={() => setDropdownSearch("")}
                        className="text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Fixed-height scrollable list */}
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
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
                            className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-emerald-950/40 text-emerald-300"
                                : "hover:bg-slate-800/60 text-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {emp.fullName?.slice(0, 2).toUpperCase() || "EM"}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-white truncate">
                                  {emp.fullName}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                  <span>{emp.employeeId}</span>
                                  <span>•</span>
                                  <span className="text-slate-300 font-sans truncate">
                                    {emp.department?.name || "General"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Rows matching user's mockup: Employee ID, Department, Month */}
            <div className="border-t border-slate-800 pt-3 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Employee ID</span>
                <span className="font-mono font-bold text-white tracking-wide">
                  {reportData?.employee?.employeeId || currentEmployee?.employeeId || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Department</span>
                <span className="font-semibold text-white">
                  {reportData?.employee?.department || currentEmployee?.department?.name || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Month</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-white min-w-[120px] text-center">
                    {formattedMonthLabel}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading or Data Display */}
          {reportLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Loading attendance report from database...</p>
            </div>
          ) : !reportData ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Please select an employee to view the report.</p>
            </div>
          ) : (
            <>
              {/* 4 KPI Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {/* 1. Present Days */}
                <div className="bg-[#121824] border border-slate-800/80 rounded-xl p-4">
                  <p className="text-xs text-slate-400 font-medium">Present Days</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-[#10b981] mt-1.5 tracking-tight">
                    {String(reportData.stats?.presentDays || 0).padStart(2, "0")}
                  </p>
                </div>

                {/* 2. Absent Days */}
                <div className="bg-[#121824] border border-slate-800/80 rounded-xl p-4">
                  <p className="text-xs text-slate-400 font-medium">Absent Days</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-[#ef4444] mt-1.5 tracking-tight">
                    {String(reportData.stats?.absentDays || 0).padStart(2, "0")}
                  </p>
                </div>

                {/* 3. Late Days */}
                <div className="bg-[#121824] border border-slate-800/80 rounded-xl p-4">
                  <p className="text-xs text-slate-400 font-medium">Late Days</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-[#f59e0b] mt-1.5 tracking-tight">
                    {String(reportData.stats?.lateDays || 0).padStart(2, "0")}
                  </p>
                </div>

                {/* 4. Total Work Hours */}
                <div className="bg-[#121824] border border-slate-800/80 rounded-xl p-4">
                  <p className="text-xs text-slate-400 font-medium">Total Work Hours</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-[#38bdf8] mt-1.5 tracking-tight">
                    {reportData.stats?.totalWorkHours || "0h"}
                  </p>
                </div>
              </div>

              {/* Daily Attendance History Section */}
              <div className="mb-6">
                <h3 className="text-base font-bold text-white mb-3 tracking-tight">
                  Daily Attendance History
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#121824]">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Check-in</th>
                        <th className="py-3 px-4">Check-out</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {reportData.dailyHistory?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500">
                            No attendance history found for this period.
                          </td>
                        </tr>
                      ) : (
                        reportData.dailyHistory?.map((row, idx) => {
                          const statusColor =
                            row.status === "Present"
                              ? "text-emerald-400 font-semibold"
                              : row.status === "Late"
                              ? "text-amber-400 font-semibold"
                              : row.status === "Absent"
                              ? "text-rose-400 font-semibold"
                              : row.status === "Off-Day"
                              ? "text-purple-400 font-medium"
                              : row.status === "Holiday"
                              ? "text-sky-400 font-medium"
                              : row.status === "Leave"
                              ? "text-teal-400 font-medium"
                              : "text-slate-500";

                          return (
                            <tr
                              key={row.date}
                              className="hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="py-2.5 px-4 font-medium text-white whitespace-nowrap">
                                <span>{row.dateFormatted}</span>
                                <span className="ml-1.5 text-[11px] text-slate-400 font-normal">
                                  ({row.dayName.slice(0, 3)})
                                </span>
                              </td>
                              <td className="py-2.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                                {row.checkIn}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                                {row.checkOut}
                              </td>
                              <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                <span className={statusColor}>
                                  {row.status}
                                  {row.holidayName && ` (${row.holidayName})`}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Right: Export PDF Button */}
              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 bg-[#161f30] hover:bg-[#1f2b42] border border-slate-700/80 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-xs tracking-wider">
                    PDF
                  </span>
                  <span>{isExporting ? "Exporting..." : "Export PDF"}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IndividualReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      }
    >
      <IndividualReportContent />
    </Suspense>
  );
}
