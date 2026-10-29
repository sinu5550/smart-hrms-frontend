'use client';

import React, { useState, useMemo } from "react";
import { useAttendanceByDate, useEmployees, QUERY_KEYS } from "@/hooks";
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
  PieChart as PieChartIcon,
  BarChart3,
  RefreshCw,
  Award,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { parseApiError } from "@/services/api";
import * as XLSX from "xlsx";

type ReportPeriodType = "DAY" | "WEEK" | "MONTH" | "CUSTOM";

export default function AttendanceReportsPage() {
  const queryClient = useQueryClient();

  // Period Preset selection
  const [periodType, setPeriodType] = useState<ReportPeriodType>("MONTH");

  // Selected Employee filter ("ALL" or specific user.id)
  const [selectedUserId, setSelectedUserId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Dates
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

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
    return { startDate: customStartDate, endDate: customEndDate };
  }, [periodType, todayStr, sevenDaysAgo, firstDayOfMonth, customStartDate, customEndDate]);

  // Query parameter for hook
  const queryArg = useMemo(() => {
    return {
      startDate,
      endDate,
      userId: selectedUserId !== "ALL" ? selectedUserId : undefined,
    };
  }, [startDate, endDate, selectedUserId]);

  const { data, isLoading, error } = useAttendanceByDate(queryArg);
  const records = data || [];

  // Fetch employees for dropdown filter
  const { data: employeesData } = useEmployees();
  const employees = Array.isArray(employeesData) ? employeesData : [];

  // Filter records by search & status
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.user?.fullName || "").toLowerCase().includes(q) ||
        (r.user?.employeeId || "").toLowerCase().includes(q) ||
        (r.user?.email || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" || r.status === statusFilter || r.currentState === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  // Report Metrics & Analytics
  const analytics = useMemo(() => {
    const total = records.length;
    const onTime = records.filter((r) => r.status === "PRESENT").length;
    const late = records.filter((r) => r.status === "LATE").length;
    const halfDay = records.filter((r) => r.status === "HALF_DAY").length;
    const overtimeRecords = records.filter((r) => (r.overtimeMinutes || 0) > 0);
    const totalOvertimeMins = records.reduce((acc, r) => acc + (r.overtimeMinutes || 0), 0);
    const totalWorkMins = records.reduce((acc, r) => acc + (r.totalWorkMinutes || 0), 0);

    const onTimePercent = total > 0 ? Math.round((onTime / total) * 100) : 0;
    const latePercent = total > 0 ? Math.round((late / total) * 100) : 0;
    const halfDayPercent = total > 0 ? Math.round((halfDay / total) * 100) : 0;

    return {
      total,
      onTime,
      late,
      halfDay,
      overtimeCount: overtimeRecords.length,
      totalOvertimeMins,
      totalWorkMins,
      onTimePercent,
      latePercent,
      halfDayPercent,
    };
  }, [records]);

  // Excel Export Handler
  const exportToExcel = () => {
    if (filteredRecords.length === 0) {
      alert("No attendance records to export for this selection.");
      return;
    }

    const exportRows = filteredRecords.map((item, index) => {
      const workHours = item.totalWorkMinutes ? `${Math.floor(item.totalWorkMinutes / 60)}h ${item.totalWorkMinutes % 60}m` : "0h 0m";
      const overtimeHours = item.overtimeMinutes ? `${Math.floor(item.overtimeMinutes / 60)}h ${item.overtimeMinutes % 60}m` : "0h 0m";

      return {
        "SL": index + 1,
        "Employee ID": item.user?.employeeId || "—",
        "Employee Name": item.user?.fullName || "—",
        "Department": item.user?.department?.name || "General",
        "Designation": item.user?.designation?.title || "Staff",
        "Date": new Date(item.date).toISOString().split("T")[0],
        "Check-In Time": item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
        "Check-Out Time": item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
        "Status": item.status === "PRESENT" ? "On-Time" : item.status === "LATE" ? "Late" : item.status,
        "Total Work Time": workHours,
        "Break Time (mins)": item.totalBreakMinutes || 0,
        "Overtime": overtimeHours,
        "Punch Mode": item.punchInDeviceType || "WEB_PORTAL",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    // Auto column widths
    const columnWidths = [
      { wch: 6 },
      { wch: 15 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 20 },
    ];
    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");

    const selectedEmpObj = employees.find((e: any) => e.id === selectedUserId);
    const empPart = selectedEmpObj ? `_${selectedEmpObj.employeeId}` : "_All_Staff";
    const filename = `Attendance_Report_${startDate}_to_${endDate}${empPart}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" /> Attendance Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate and export day, week, month, or custom date-range Excel reports for bulk staff or specific individuals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.list(queryArg) })}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 transition shadow-xs"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-700" : ""}`} />
          </button>

          <button
            onClick={exportToExcel}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Filter and Period Selection Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
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
                {startDate} → {endDate}
              </span>
            </div>
          )}
        </div>

        {/* Person Wise / Bulk Select & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Employee Filter */}
          <div>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1">Scope / Individual</label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              triggerClassName="h-8 text-[12px]"
              searchable={true}
              searchPlaceholder="Search employee name or ID..."
              options={[
                { value: "ALL", label: "All Employees (Bulk Report)" },
                ...employees.map((emp: any) => ({
                  value: emp.id,
                  label: `${emp.fullName} (${emp.employeeId || "No ID"})`,
                })),
              ]}
            />
          </div>

          {/* Search Bar */}
          <div>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1">Search within records</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or ID..."
                className="h-8 pl-8 text-[12px] rounded-lg"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1">Status Filter</label>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              triggerClassName="h-8 text-[12px]"
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "PRESENT", label: "On-Time (Present)" },
                { value: "LATE", label: "Late Arrivals" },
                { value: "HALF_DAY", label: "Half Day" },
                { value: "ON_BREAK", label: "Currently on Break" },
                { value: "CHECKED_OUT", label: "Shift Concluded" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Analytics & Visual Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Metric Overview (KPIs) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-600" /> Attendance Breakdown
            </h3>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {analytics.total} Logs
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <p className="text-[10px] uppercase font-bold text-emerald-800">On-Time Present</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{analytics.onTime}</p>
              <span className="text-[10px] text-emerald-600 font-medium">{analytics.onTimePercent}% of logs</span>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
              <p className="text-[10px] uppercase font-bold text-rose-800">Late Arrivals</p>
              <p className="text-2xl font-black text-rose-700 mt-1">{analytics.late}</p>
              <span className="text-[10px] text-rose-600 font-medium">{analytics.latePercent}% of logs</span>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <p className="text-[10px] uppercase font-bold text-indigo-800">Overtime Recorded</p>
              <p className="text-2xl font-black text-indigo-700 mt-1">{analytics.overtimeCount}</p>
              <span className="text-[10px] text-indigo-600 font-medium">
                {Math.floor(analytics.totalOvertimeMins / 60)}h {analytics.totalOvertimeMins % 60}m total
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-600">Total Work Hours</p>
              <p className="text-2xl font-black text-slate-800 mt-1">
                {Math.floor(analytics.totalWorkMins / 60)}h
              </p>
              <span className="text-[10px] text-slate-500 font-medium">
                {analytics.totalWorkMins % 60}m net time
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progress / Ratio Graph */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <PieChartIcon className="w-4 h-4 text-emerald-600" /> Compliance & Ratio
            </h3>
            <span className="text-xs text-slate-400 font-medium">Accuracy: 100%</span>
          </div>

          <div className="space-y-4 pt-1">
            {/* Visual Bar representation */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700">Punctuality Score</span>
                <span className="font-mono font-bold text-emerald-700">{analytics.onTimePercent}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${analytics.onTimePercent}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                />
                <div
                  style={{ width: `${analytics.latePercent}%` }}
                  className="bg-rose-500 h-full transition-all duration-500"
                />
                <div
                  style={{ width: `${analytics.halfDayPercent}%` }}
                  className="bg-amber-400 h-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="block w-2 h-2 rounded-full bg-emerald-500 mx-auto mb-1" />
                <p className="text-[10px] text-slate-500 font-semibold">On-Time</p>
                <p className="font-mono font-bold text-emerald-800">{analytics.onTimePercent}%</p>
              </div>
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                <span className="block w-2 h-2 rounded-full bg-rose-500 mx-auto mb-1" />
                <p className="text-[10px] text-slate-500 font-semibold">Late</p>
                <p className="font-mono font-bold text-rose-800">{analytics.latePercent}%</p>
              </div>
              <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                <span className="block w-2 h-2 rounded-full bg-indigo-500 mx-auto mb-1" />
                <p className="text-[10px] text-slate-500 font-semibold">Overtime</p>
                <p className="font-mono font-bold text-indigo-800">{analytics.overtimeCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Scope Summary */}
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
                Active Selection
              </span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-4">
              <h4 className="text-lg font-bold text-white">
                {selectedUserId === "ALL" ? "All Organization Staff" : employees.find((e: any) => e.id === selectedUserId)?.fullName || "Employee"}
              </h4>
              <p className="text-xs text-emerald-200 mt-1 font-mono">
                {selectedUserId === "ALL" ? `${employees.length} Enlisted Employees` : `ID: ${employees.find((e: any) => e.id === selectedUserId)?.employeeId}`}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-300 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <Clock className="w-3.5 h-3.5" />
                <span>Period: {periodType} ({startDate} to {endDate})</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-800/60 flex items-center justify-between text-xs text-emerald-200">
            <span>Ready for Export</span>
            <span className="font-bold font-mono text-white">{filteredRecords.length} Rows</span>
          </div>
        </div>
      </div>

      {/* Records Table - Max 10 Rows Visible with Smooth Internal Scroll & Sticky Header */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
        {/* Table Header Controls */}
        <div className="shrink-0 p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 text-xs">
          <span className="font-semibold text-slate-700">
            Showing <strong className="text-slate-900">{filteredRecords.length}</strong> attendance records
          </span>
          <span className="text-slate-400 text-[11px]">10 records view • Scrollable table body</span>
        </div>

        {/* Scrollable Container capped at exactly 10 rows (~480px) */}
        <div className="max-h-[480px] overflow-y-auto overflow-x-auto table-scrollbar">
          {isLoading && records.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading attendance report data...</div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-rose-700">{parseApiError(error)}</div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-xs">No attendance entries recorded for this selection.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-20 bg-slate-100 text-slate-800 border-b border-slate-300 shadow-xs">
                <tr>
                  <th className="py-3 px-4 font-bold bg-slate-100 text-slate-700 border-b border-slate-200">Employee</th>
                  <th className="py-3 px-4 font-bold bg-slate-100 text-slate-700 border-b border-slate-200">Date</th>
                  <th className="py-3 px-4 font-bold bg-slate-100 text-slate-700 border-b border-slate-200">Department</th>
                  <th className="py-3 px-4 font-bold bg-slate-100 text-slate-700 border-b border-slate-200">Check-In</th>
                  <th className="py-3 px-4 font-bold bg-slate-100 text-slate-700 border-b border-slate-200">Check-Out</th>
                  <th className="py-3 px-4 font-bold bg-slate-100 text-slate-700 border-b border-slate-200">Status</th>
                  <th className="py-3 px-4 font-bold bg-slate-100 text-slate-700 border-b border-slate-200">Work / Break</th>
                  <th className="py-3 px-4 font-bold bg-slate-100 text-slate-700 border-b border-slate-200">Overtime</th>
                  <th className="py-3 px-4 font-bold bg-slate-100 text-slate-700 border-b border-slate-200">Terminal / Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition border-b border-slate-200">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.user?.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{item.user?.employeeId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {new Date(item.date).toISOString().split("T")[0]}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{item.user?.department?.name || "General"}</div>
                      <div className="text-[10px] text-slate-400">{item.user?.designation?.title || "Staff"}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      {item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      {item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="py-3 px-4">
                      {item.status === "PRESENT" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          On-Time
                        </span>
                      )}
                      {item.status === "LATE" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Late
                        </span>
                      )}
                      {item.status === "HALF_DAY" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Half Day
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      {item.totalWorkMinutes !== undefined ? `${Math.floor(item.totalWorkMinutes / 60)}h ${item.totalWorkMinutes % 60}m` : "—"}{" "}
                      / <span className="text-slate-400">{item.totalBreakMinutes || 0}m break</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {(item.overtimeMinutes || 0) > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          +{Math.floor(item.overtimeMinutes / 60)}h {item.overtimeMinutes % 60}m
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] font-mono text-slate-500">
                      {item.punchInDeviceType || "WEB_PORTAL"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
