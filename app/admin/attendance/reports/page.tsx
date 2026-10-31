'use client';

import React, { useState, useMemo } from "react";
import { useAttendanceSummaryReport, useDepartments, useOrganization } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Printer,
  FileDown,
  RefreshCw,
  Building2,
  MapPin,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { parseApiError } from "@/services/api";
import { formatDate } from "@/lib/utils";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";

type ReportPeriodType = "DAY" | "WEEK" | "MONTH" | "YEAR" | "CUSTOM";

export default function AttendanceReportsPage() {
  const queryClient = useQueryClient();

  // Period Preset selection (Default to MONTH)
  const [periodType, setPeriodType] = useState<ReportPeriodType>("MONTH");

  // Selected Department filter ("ALL" or specific department.id)
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Local dates formatted as YYYY-MM-DD
  const today = new Date();
  const todayStr = today.toLocaleDateString("en-CA");

  // Current Month: 1st of current month to today (e.g. Oct 1 to Oct 31, not fixed 30 days)
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString("en-CA");
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1).toLocaleDateString("en-CA");
  const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toLocaleDateString("en-CA");

  const [customStartDate, setCustomStartDate] = useState<string>(firstDayOfMonth);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Compute effective query date range
  const { startDate, endDate } = useMemo(() => {
    if (periodType === "DAY") {
      return { startDate: todayStr, endDate: todayStr };
    }
    if (periodType === "WEEK") {
      return { startDate: sevenDaysAgo, endDate: todayStr };
    }
    if (periodType === "MONTH") {
      return { startDate: firstDayOfMonth, endDate: todayStr };
    }
    if (periodType === "YEAR") {
      return { startDate: firstDayOfYear, endDate: todayStr };
    }
    return { startDate: customStartDate, endDate: customEndDate };
  }, [periodType, todayStr, sevenDaysAgo, firstDayOfMonth, firstDayOfYear, customStartDate, customEndDate]);

  // Fetch Summary Report from API
  const { data: reportData, isLoading, error } = useAttendanceSummaryReport({
    startDate,
    endDate,
    departmentId: selectedDeptId !== "ALL" ? selectedDeptId : undefined,
  });

  const { data: orgData, isLoading: isLoadingOrg } = useOrganization();
  const { data: departmentsData = [] } = useDepartments();
  const departments = Array.isArray(departmentsData) ? departmentsData : [];

  const organization = reportData?.organization || {
    name: orgData?.name || orgData?.name || "",
    address: orgData?.address || orgData?.address || "",
    logoUrl: orgData?.logoUrl || null,
  };

  const rows = reportData?.summary || [];

  // Filter rows by employee name, id, or department
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.employeeName || "").toLowerCase().includes(q) ||
        (r.employeeId || "").toLowerCase().includes(q) ||
        (r.departmentName || "").toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [rows, searchTerm]);

  // Group filtered rows by Category (General Employees vs Roster Duty Employees)
  const { generalEmployees, rosterEmployees } = useMemo(() => {
    const general = filteredRows.filter((r) => !r.isRoster);
    const roster = filteredRows.filter((r) => r.isRoster);
    return { generalEmployees: general, rosterEmployees: roster };
  }, [filteredRows]);

  // Download helper: creates and clicks download anchor
  const downloadFile = (content: BlobPart, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1. Export Excel (.xlsx) with Sticky (Frozen) Header, Left Alignment & Software Colors (Red/Green/Amber/Blue)
  const exportToExcel = async () => {
    if (filteredRows.length === 0) {
      alert("No attendance summary records to export for this selection.");
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = organization?.name || "HRMS Platform";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Attendance Summary", {
        views: [{ state: "frozen", ySplit: 1 }], // Freeze header so it stays sticky during scroll
      });

      // Columns definition with left alignment and custom widths
      worksheet.columns = [
        { header: "Serial No", key: "sl", width: 12 },
        { header: "Employee Code", key: "code", width: 16 },
        { header: "Employee Name", key: "name", width: 26 },
        { header: "Department", key: "dept", width: 22 },
        { header: "Branch", key: "branch", width: 16 },
        { header: "Duty Mode", key: "dutyMode", width: 16 },
        { header: "Office Day", key: "officeDays", width: 14 },
        { header: "Absent", key: "absent", width: 12 },
        { header: "Leave", key: "leave", width: 12 },
        { header: "Present", key: "present", width: 12 },
        { header: "Late", key: "late", width: 12 },
        { header: "Extreme Delay", key: "extremeDelay", width: 16 },
        { header: "Total Delay Hour", key: "totalDelay", width: 18 },
        { header: "Over Time Day", key: "overtimeDays", width: 16 },
        { header: "Expected Duty Hour", key: "expectedDuty", width: 20 },
        { header: "Actual Duty Hour", key: "actualDuty", width: 18 },
        { header: "Over Time Hour", key: "overtimeHour", width: 18 },
        { header: "Extra/Less Duty Balance", key: "balance", width: 24 },
      ];

      // Beautiful Executive Dark Header Row Styling
      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0F172A" }, // Elegant dark slate
        };
        cell.font = {
          name: "Calibri",
          size: 11,
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "left", // Headers aligned to left
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FF334155" } },
          left: { style: "thin", color: { argb: "FF334155" } },
          bottom: { style: "medium", color: { argb: "FF0F172A" } },
          right: { style: "thin", color: { argb: "FF334155" } },
        };
      });

      // Populate Data Rows with Left Alignment and UI-matched Colors
      filteredRows.forEach((r, idx) => {
        const rowData = {
          sl: idx + 1,
          code: r.employeeId,
          name: r.employeeName,
          dept: r.departmentName,
          branch: r.branchName,
          dutyMode: r.isRoster ? "Roster Duty" : "Regular Shift",
          officeDays: r.officeDays,
          absent: r.absent,
          leave: r.leave,
          present: r.present,
          late: r.late,
          extremeDelay: r.extremeDelay,
          totalDelay: r.totalDelayFormatted,
          overtimeDays: r.overtimeDays,
          expectedDuty: r.expectedDutyFormatted,
          actualDuty: r.actualDutyFormatted,
          overtimeHour: r.overtimeFormatted,
          balance: r.extraLessBalanceFormatted,
        };

        const row = worksheet.addRow(rowData);
        row.height = 22;

        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = {
            vertical: "middle",
            horizontal: "left", // ALL cell data aligned to the left
          };
          cell.font = {
            name: "Calibri",
            size: 10.5,
            color: { argb: "FF1E293B" },
          };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
        });

        // Software Matched Color Annotations:
        // 1. Absent -> Red (FFDC2626)
        if (r.absent > 0) {
          const c = row.getCell("absent");
          c.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FFDC2626" } };
        }

        // 2. Leave -> Blue (FF2563EB)
        if (r.leave > 0) {
          const c = row.getCell("leave");
          c.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF2563EB" } };
        }

        // 3. Present -> Rich Emerald Green (FF059669)
        if (r.present > 0) {
          const c = row.getCell("present");
          c.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF059669" } };
        }

        // 4. Late -> Amber / Orange (FFD97706)
        if (r.late > 0) {
          const c = row.getCell("late");
          c.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FFD97706" } };
        }

        // 5. Over Time Hour -> Green (FF059669)
        if (r.overtimeFormatted !== "00:00") {
          const c = row.getCell("overtimeHour");
          c.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF059669" } };
        }

        // 6. Extra/Less Duty Balance -> Red if negative (FFDC2626), Green if positive (FF059669)
        const balCell = row.getCell("balance");
        balCell.font = {
          name: "Calibri",
          size: 10.5,
          bold: true,
          color: { argb: r.balanceMinutes < 0 ? "FFDC2626" : "FF059669" },
        };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `Attendance_Summary_${startDate}_to_${endDate}.xlsx`;
      downloadFile(buffer, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    } catch (err) {
      console.error("Excel export error:", err);
      alert("Failed to export Excel file. Please try again.");
    }
  };

  // 2. Export CSV (.csv) - Left-aligned with text qualifiers & UTF-8 BOM
  const exportToCSV = () => {
    if (filteredRows.length === 0) {
      alert("No attendance records to export.");
      return;
    }

    const headers = [
      "Serial No",
      "Employee Code",
      "Employee Name",
      "Department",
      "Branch",
      "Duty Mode",
      "Office Day",
      "Absent",
      "Leave",
      "Present",
      "Late",
      "Extreme Delay",
      "Total Delay Hour",
      "Over Time Day",
      "Expected Duty Hour",
      "Actual Duty Hour",
      "Over Time Hour",
      "Extra/Less Duty Balance",
    ];

    const csvLines = [headers.join(",")];

    filteredRows.forEach((r, i) => {
      // Clean string quoting for robust left-alignment across Excel/Sheets CSV viewers
      const escape = (val: string | number) => `"${String(val ?? "").replace(/"/g, '""')}"`;

      const row = [
        escape(i + 1),
        escape(r.employeeId),
        escape(r.employeeName),
        escape(r.departmentName),
        escape(r.branchName),
        escape(r.isRoster ? "Roster Duty" : "Regular Shift"),
        escape(r.officeDays),
        escape(r.absent),
        escape(r.leave),
        escape(r.present),
        escape(r.late),
        escape(r.extremeDelay),
        escape(r.totalDelayFormatted),
        escape(r.overtimeDays),
        escape(r.expectedDutyFormatted),
        escape(r.actualDutyFormatted),
        escape(r.overtimeFormatted),
        escape(r.extraLessBalanceFormatted),
      ];
      csvLines.push(row.join(","));
    });

    // \uFEFF ensures Bengali characters, symbols, and formatting render cleanly in Excel
    const csvContent = "\uFEFF" + csvLines.join("\r\n");
    downloadFile(csvContent, `Attendance_Summary_${startDate}_to_${endDate}.csv`, "text/csv;charset=utf-8;");
  };

  // 3. Export Word / DOCX (.doc)
  const exportToWord = () => {
    if (filteredRows.length === 0) {
      alert("No attendance records to export.");
      return;
    }

    const tableRowsHtml = filteredRows
      .map(
        (r, i) => `
        <tr style="border-bottom: 1px solid #ddd; font-size: 9pt;">
          <td style="padding: 6px; text-align: center;">${i + 1}</td>
          <td style="padding: 6px; font-weight: bold;">${r.employeeId}</td>
          <td style="padding: 6px;">${r.employeeName}</td>
          <td style="padding: 6px;">${r.departmentName}</td>
          <td style="padding: 6px; text-align: center;">${r.officeDays}</td>
          <td style="padding: 6px; text-align: center; color: red;">${r.absent}</td>
          <td style="padding: 6px; text-align: center; color: blue;">${r.leave}</td>
          <td style="padding: 6px; text-align: center; font-weight: bold;">${r.present}</td>
          <td style="padding: 6px; text-align: center; color: orange;">${r.late}</td>
          <td style="padding: 6px; text-align: center;">${r.extremeDelay}</td>
          <td style="padding: 6px; text-align: center;">${r.totalDelayFormatted}</td>
          <td style="padding: 6px; text-align: center;">${r.overtimeDays}</td>
          <td style="padding: 6px; text-align: center;">${r.expectedDutyFormatted}</td>
          <td style="padding: 6px; text-align: center; font-weight: bold;">${r.actualDutyFormatted}</td>
          <td style="padding: 6px; text-align: center; color: green; font-weight: bold;">${r.overtimeFormatted}</td>
          <td style="padding: 6px; text-align: center;">${r.extraLessBalanceFormatted}</td>
        </tr>
      `
      )
      .join("");

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Attendance Summary Report</title>
        <style>
          @page { size: landscape; margin: 1.5cm; }
          body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background-color: #f2f2f2; border: 1px solid #ccc; padding: 7px; font-size: 9pt; }
          td { border: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #1e293b; font-size: 18pt;">${organization.name}</h2>
          <p style="margin: 3px 0 0 0; color: #64748b; font-size: 11pt;">${organization.address || ""}</p>
          <h3 style="margin-top: 15px; font-size: 13pt; color: #0f172a;">Attendance Summary Report (${startDate} To ${endDate})</h3>
          <p style="margin: 2px; font-size: 10pt; color: #475569;">Filtered By Department: ${selectedDeptId === "ALL" ? "All Departments" : departments.find((d: any) => d.id === selectedDeptId)?.name || "Selected"}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>SL</th>
              <th>Employee Code</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Office Day</th>
              <th>Absent</th>
              <th>Leave</th>
              <th>Present</th>
              <th>Late</th>
              <th>Extreme Delay</th>
              <th>Total Delay Hour</th>
              <th>Over Time Day</th>
              <th>Expected Duty Hour</th>
              <th>Actual Duty Hour</th>
              <th>Over Time Hour</th>
              <th>Extra/Less Duty Balance</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    downloadFile(wordHtml, `Attendance_Summary_${startDate}_to_${endDate}.doc`, "application/msword;charset=utf-8;");
  };

  // 4. Print / PDF Export in Clean Landscape Orientation
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header - Hidden on Print */}
      <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" /> Attendance Summary Report
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            1 Row per Employee comprehensive summary: Present, Leave, Late, Over Time, and Duty Balance.
          </p>
        </div>

        {/* 4 Download / Export Options with clean icons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["attendance", "summary-report"] })}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 transition shadow-xs"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-700" : ""}`} />
          </button>

          {/* PDF / Landscape Print */}
          <button
            onClick={handlePrint}
            disabled={filteredRows.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs active:scale-95"
            title="Export / Print PDF (Landscape)"
          >
            <Printer className="w-4 h-4" />
            <span>PDF (Print)</span>
          </button>

          {/* Excel .xlsx */}
          <button
            onClick={exportToExcel}
            disabled={filteredRows.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs active:scale-95"
            title="Export Excel Worksheet"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* CSV .csv */}
          <button
            onClick={exportToCSV}
            disabled={filteredRows.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs active:scale-95"
            title="Export Comma-Separated Values"
          >
            <FileDown className="w-4 h-4" />
            <span>CSV</span>
          </button>

          {/* Word .doc */}
          <button
            onClick={exportToWord}
            disabled={filteredRows.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs active:scale-95"
            title="Export Microsoft Word Document"
          >
            <Download className="w-4 h-4" />
            <span>DOCX (.doc)</span>
          </button>
        </div>
      </div>

      {/* Filter and Period Selection Bar - Hidden on Print */}
      <div className="print:hidden bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setPeriodType("DAY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                periodType === "DAY" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriodType("WEEK")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                periodType === "WEEK" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setPeriodType("MONTH")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                periodType === "MONTH" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriodType("YEAR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                periodType === "YEAR" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              This Year
            </button>
            <button
              onClick={() => setPeriodType("CUSTOM")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                periodType === "CUSTOM" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Date range display / custom inputs */}
          {periodType === "CUSTOM" ? (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-9 text-xs rounded-lg font-mono"
              />
              <span className="text-xs text-slate-400">to</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-9 text-xs rounded-lg font-mono"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {formatDate(startDate)} → {formatDate(endDate)}
              </span>
            </div>
          )}
        </div>

        {/* Department Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Department Filter */}
          <div>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1">Filter by Department</label>
            <Select
              value={selectedDeptId}
              onValueChange={setSelectedDeptId}
              triggerClassName="h-9 text-[12px]"
              options={[
                { value: "ALL", label: "All Departments (Combined Report)" },
                ...departments.map((d: any) => ({
                  value: d.id,
                  label: d.name,
                })),
              ]}
            />
          </div>

          {/* Search Bar */}
          <div>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1">Search Employee</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by employee name or code..."
                className="h-9 pl-8 text-[12px] rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable Report Canvas & Landscape Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Organization Header */}
        <div className="text-center space-y-1.5 border-b border-slate-200 pb-5">
          {isLoadingOrg ? (
            <div className="space-y-2 flex flex-col items-center py-2">
              <div className="h-6 w-56 bg-slate-200 rounded animate-pulse" />
              <div className="h-3.5 w-72 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : (
            <>
              {organization.logoUrl && (
                <img
                  src={organization.logoUrl}
                  alt={organization.name || "Organization"}
                  className="h-12 object-contain mx-auto mb-2"
                />
              )}
              {organization.name && (
                <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                  {organization.name}
                </h2>
              )}
              {organization.address && (
                <p className="text-xs text-slate-500 font-medium">
                  {organization.address}
                </p>
              )}
            </>
          )}
          <div className="pt-2">
            <h3 className="text-sm font-bold text-slate-800">
              Attendance Summary Report ({formatDate(startDate)} To {formatDate(endDate)})
            </h3>
          </div>
        </div>

        {/* Filtered By Info Bar */}
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center gap-4 text-slate-700">
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Filtered By:</span>
          <div>
            <strong className="text-slate-800">Department: </strong>
            <span>{selectedDeptId === "ALL" ? "All Departments" : departments.find((d: any) => d.id === selectedDeptId)?.name || "Selected"}</span>
          </div>
        </div>

        {/* Error / Loading / Data rendering */}
        {error ? (
          <div className="p-8 text-center text-xs text-rose-700 bg-rose-50/50 flex flex-col items-center justify-center gap-2 rounded-xl">
            <span className="font-semibold text-rose-800">Connection Error</span>
            <span>{parseApiError(error)}</span>
          </div>
        ) : isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
            <p className="text-xs font-semibold">Generating Attendance Summary Report...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-xs">No employee attendance records found for this period.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section 1: General Employees */}
            {generalEmployees.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h4 className="text-sm font-bold text-slate-800">General Employees</h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Branch: {generalEmployees[0]?.branchName || "Head Office"}
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-100/90 text-slate-800 border-b border-slate-300 font-bold">
                      <tr>
                        <th className="py-2.5 px-2 text-center border-r border-slate-200">Serial No</th>
                        <th className="py-2.5 px-2 border-r border-slate-200">Employee Code</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Employee Name</th>
                        <th className="py-2.5 px-2 text-center border-r border-slate-200">Office Day</th>
                        <th className="py-2.5 px-2 text-center border-r border-slate-200 text-rose-600">Absent</th>
                        <th className="py-2.5 px-2 text-center border-r border-slate-200 text-blue-600">Leave</th>
                        <th className="py-2.5 px-2 text-center border-r border-slate-200 text-emerald-700">Present</th>
                        <th className="py-2.5 px-2 text-center border-r border-slate-200 text-amber-600">Late</th>
                        <th className="py-2.5 px-2 text-center border-r border-slate-200">Extreme Delay</th>
                        <th className="py-2.5 px-2 text-center border-r border-slate-200">Total Delay Hour</th>
                        <th className="py-2.5 px-2 text-center border-r border-slate-200">Over Time Day</th>
                        <th className="py-2.5 px-2 text-center border-r border-slate-200">Expected Duty Hour</th>
                        <th className="py-2.5 px-2 text-center border-r border-slate-200">Actual Duty Hour</th>
                        <th className="py-2.5 px-2 text-center border-r border-slate-200 text-emerald-700">Over Time Hour</th>
                        <th className="py-2.5 px-2 text-center">Extra/Less Duty Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {generalEmployees.map((row, idx) => (
                        <tr key={row.employeeId} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-2 text-center border-r border-slate-100 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-2 border-r border-slate-100 font-mono font-bold text-slate-800">{row.employeeId}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-semibold text-slate-900">
                            <div>{row.employeeName}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{row.departmentName}</div>
                          </td>
                          <td className="py-2.5 px-2 text-center border-r border-slate-100 font-mono font-bold">{row.officeDays}</td>
                          <td className="py-2.5 px-2 text-center border-r border-slate-100 font-mono text-rose-600 font-bold">{row.absent}</td>
                          <td className="py-2.5 px-2 text-center border-r border-slate-100 font-mono text-blue-600 font-bold">{row.leave}</td>
                          <td className="py-2.5 px-2 text-center border-r border-slate-100 font-mono text-emerald-700 font-bold">{row.present}</td>
                          <td className="py-2.5 px-2 text-center border-r border-slate-100 font-mono text-amber-600 font-bold">{row.late}</td>
                          <td className="py-2.5 px-2 text-center border-r border-slate-100 font-mono">{row.extremeDelay}</td>
                          <td className="py-2.5 px-2 text-center border-r border-slate-100 font-mono">{row.totalDelayFormatted}</td>
                          <td className="py-2.5 px-2 text-center border-r border-slate-100 font-mono">{row.overtimeDays}</td>
                          <td className="py-2.5 px-2 text-center border-r border-slate-100 font-mono text-slate-600">{row.expectedDutyFormatted}</td>
                          <td className="py-2.5 px-2 text-center border-r border-slate-100 font-mono font-bold text-slate-800">{row.actualDutyFormatted}</td>
                          <td className="py-2.5 px-2 text-center border-r border-slate-100 font-mono text-emerald-700 font-bold">{row.overtimeFormatted}</td>
                          <td className={`py-2.5 px-2 text-center font-mono font-bold ${row.balanceMinutes < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                            {row.extraLessBalanceFormatted}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section 2: Roster Duty Employees (if any) */}
            {rosterEmployees.length > 0 && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between border-b border-indigo-200 pb-1.5">
                  <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" /> Roster Duty Employees
                  </h4>
                  <span className="text-[11px] text-indigo-600 font-mono">
                    Continuous Shift / No Fixed Weekends
                  </span>
                </div>

                <div className="overflow-x-auto border border-indigo-100 rounded-lg">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-indigo-50/80 text-indigo-950 border-b border-indigo-200 font-bold">
                      <tr>
                        <th className="py-2.5 px-2 text-center border-r border-indigo-100">Serial No</th>
                        <th className="py-2.5 px-2 border-r border-indigo-100">Employee Code</th>
                        <th className="py-2.5 px-3 border-r border-indigo-100">Employee Name</th>
                        <th className="py-2.5 px-2 text-center border-r border-indigo-100">Office Day</th>
                        <th className="py-2.5 px-2 text-center border-r border-indigo-100 text-rose-600">Absent</th>
                        <th className="py-2.5 px-2 text-center border-r border-indigo-100 text-blue-600">Leave</th>
                        <th className="py-2.5 px-2 text-center border-r border-indigo-100 text-emerald-700">Present</th>
                        <th className="py-2.5 px-2 text-center border-r border-indigo-100 text-amber-600">Late</th>
                        <th className="py-2.5 px-2 text-center border-r border-indigo-100">Extreme Delay</th>
                        <th className="py-2.5 px-2 text-center border-r border-indigo-100">Total Delay Hour</th>
                        <th className="py-2.5 px-2 text-center border-r border-indigo-100">Over Time Day</th>
                        <th className="py-2.5 px-2 text-center border-r border-indigo-100">Expected Duty Hour</th>
                        <th className="py-2.5 px-2 text-center border-r border-indigo-100">Actual Duty Hour</th>
                        <th className="py-2.5 px-2 text-center border-r border-indigo-100 text-emerald-700">Over Time Hour</th>
                        <th className="py-2.5 px-2 text-center">Extra/Less Duty Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-100 bg-white">
                      {rosterEmployees.map((row, idx) => (
                        <tr key={row.employeeId} className="hover:bg-indigo-50/40 transition">
                          <td className="py-2.5 px-2 text-center border-r border-indigo-50 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-2 border-r border-indigo-50 font-mono font-bold text-slate-800">{row.employeeId}</td>
                          <td className="py-2.5 px-3 border-r border-indigo-50 font-semibold text-slate-900">
                            <div>{row.employeeName}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{row.departmentName}</div>
                          </td>
                          <td className="py-2.5 px-2 text-center border-r border-indigo-50 font-mono font-bold">{row.officeDays}</td>
                          <td className="py-2.5 px-2 text-center border-r border-indigo-50 font-mono text-rose-600 font-bold">{row.absent}</td>
                          <td className="py-2.5 px-2 text-center border-r border-indigo-50 font-mono text-blue-600 font-bold">{row.leave}</td>
                          <td className="py-2.5 px-2 text-center border-r border-indigo-50 font-mono text-emerald-700 font-bold">{row.present}</td>
                          <td className="py-2.5 px-2 text-center border-r border-indigo-50 font-mono text-amber-600 font-bold">{row.late}</td>
                          <td className="py-2.5 px-2 text-center border-r border-indigo-50 font-mono">{row.extremeDelay}</td>
                          <td className="py-2.5 px-2 text-center border-r border-indigo-50 font-mono">{row.totalDelayFormatted}</td>
                          <td className="py-2.5 px-2 text-center border-r border-indigo-50 font-mono">{row.overtimeDays}</td>
                          <td className="py-2.5 px-2 text-center border-r border-indigo-50 font-mono text-slate-600">{row.expectedDutyFormatted}</td>
                          <td className="py-2.5 px-2 text-center border-r border-indigo-50 font-mono font-bold text-slate-800">{row.actualDutyFormatted}</td>
                          <td className="py-2.5 px-2 text-center border-r border-indigo-50 font-mono text-emerald-700 font-bold">{row.overtimeFormatted}</td>
                          <td className={`py-2.5 px-2 text-center font-mono font-bold ${row.balanceMinutes < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                            {row.extraLessBalanceFormatted}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Native Head Style for Automatic A4 Landscape Printing */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @page {
            size: A4 landscape !important;
            margin: 8mm !important;
          }
          @media print {
            @page {
              size: A4 landscape !important;
              margin: 8mm !important;
            }
          }
        `
      }} />
    </div>
  );
}
