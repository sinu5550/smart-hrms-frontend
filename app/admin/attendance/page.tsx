'use client';

import React, { useState } from "react";
import { parseApiError } from "@/services/api";
import { useAttendanceByDate, QUERY_KEYS } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Coffee,
  AlertTriangle,
  RefreshCw,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  PremiumDateRangePicker,
  DateRangeValue,
} from "@/components/ui/PremiumDateRangePicker";

interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status: "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT";
  currentState: "NOT_CHECKED_IN" | "CHECKED_IN" | "ON_BREAK" | "CHECKED_OUT";
  totalWorkMinutes?: number;
  totalBreakMinutes?: number;
  isOvertime?: boolean;
  overtimeMinutes?: number;
  ipAddress?: string;
  punchInDeviceType?: string;
  user: {
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    department?: { name: string } | null;
    designation?: { title: string } | null;
  };
  breaks?: Array<{
    id: string;
    breakType: string;
    startTime: string;
    endTime?: string | null;
    durationMinutes?: number | null;
  }>;
}

export default function AdminAttendancePage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const todayStr = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    preset: "TODAY",
    startDate: todayStr,
    endDate: todayStr,
  });

  // Query parameter: single date if start === end, else range
  const queryArg =
    dateRange.startDate === dateRange.endDate
      ? { date: dateRange.startDate }
      : { startDate: dateRange.startDate, endDate: dateRange.endDate };

  const { data, error, isLoading } = useAttendanceByDate(queryArg);

  const records = data || [];

  const filteredRecords = records.filter((r) => {
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

  const stats = {
    totalCheckedIn: records.length,
    present: records.filter((r) => r.status === "PRESENT").length,
    late: records.filter((r) => r.status === "LATE").length,
    onBreak: records.filter((r) => r.currentState === "ON_BREAK").length,
    overtimeCount: records.filter((r) => (r.overtimeMinutes || 0) > 0).length,
    totalOvertimeMins: records.reduce((acc, r) => acc + (r.overtimeMinutes || 0), 0),
  };

  return (
    <div className="flex-1 md:h-full flex flex-col md:min-h-0 gap-4 md:overflow-hidden">
      {/* Header Row - Sticky / Fixed at top */}
      <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-700" /> Attendance Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time biometric terminal punches, dynamic QR scans, and active work sessions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <PremiumDateRangePicker
            value={dateRange}
            onChange={(val) => setDateRange(val)}
          />
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.list(queryArg) })}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 transition shadow-xs"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-700" : ""}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row - Sticky / Fixed */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-800">
            <span>Logged Today</span>
            <CheckCircle2 className="w-4 h-4 text-slate-800" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-1.5">{stats.totalCheckedIn}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-800">
            <span>On-Time</span>
            <Clock className="w-4 h-4 text-slate-800" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-1.5">{stats.present}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-800">
            <span>Late Arrivals</span>
            <AlertTriangle className="w-4 h-4 text-rose-700" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-1.5">{stats.late}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-800">
            <span>Currently on Break</span>
            <Coffee className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1.5">{stats.onBreak}</p>
        </div>

        <div className="bg-white border border-emerald-200 rounded-lg p-3 sm:p-4 col-span-2 sm:col-span-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800">
            <span>Overtime</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-2xl font-bold text-emerald-700">{stats.overtimeCount}</span>
            <span className="text-xs text-emerald-600 font-mono">
              ({Math.floor(stats.totalOvertimeMins / 60)}h {stats.totalOvertimeMins % 60}m)
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar - Sticky / Fixed */}
      <div className="shrink-0 flex flex-col sm:flex-row gap-2.5 bg-white border border-slate-200 p-2.5 rounded-lg shadow-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by employee name or ID..."
            className="h-8 rounded-lg pl-9 text-[12px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            triggerClassName="h-8 min-w-44 text-[12px]"
            options={[{value:"ALL",label:"All Statuses"},{value:"PRESENT",label:"On-Time (Present)"},{value:"LATE",label:"Late"},{value:"ON_BREAK",label:"Currently on Break"},{value:"CHECKED_OUT",label:"Shift Concluded"}]}
          />
        </div>
      </div>

      {/* Attendance Records Table Container */}
      <div className="flex-1 md:min-h-0 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col">
        {error ? (
          <div className="p-8 text-center text-xs text-rose-700 bg-rose-50/50 border-b border-rose-100 flex flex-col items-center justify-center gap-2">
            <span className="font-semibold text-rose-800">Connection Error</span>
            <span>{parseApiError(error)}</span>
          </div>
        ) : isLoading && records.length === 0 ? (
          <div className="overflow-y-auto no-scrollbar">
            <div className="sm:hidden p-3 space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="p-3.5 space-y-2.5 rounded-lg border border-slate-100 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 bg-slate-200/80 rounded-md animate-pulse" />
                      <div className="h-2.5 w-24 bg-slate-200/80 rounded-md animate-pulse" />
                    </div>
                    <div className="h-5 w-16 bg-slate-200/80 rounded-full animate-pulse" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-slate-50">
                    <div className="h-6 bg-slate-200/60 rounded-md animate-pulse" />
                    <div className="h-6 bg-slate-200/60 rounded-md animate-pulse" />
                    <div className="h-6 bg-slate-200/60 rounded-md animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center justify-between gap-4 py-2 border-b border-slate-100">
                  <div className="h-4 w-40 bg-slate-200/80 rounded-md animate-pulse" />
                  <div className="h-4 w-24 bg-slate-200/80 rounded-md animate-pulse" />
                  <div className="h-4 w-28 bg-slate-200/80 rounded-md animate-pulse" />
                  <div className="h-4 w-20 bg-slate-200/80 rounded-md animate-pulse" />
                  <div className="h-5 w-16 bg-slate-200/80 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-800 space-y-2">
            <User className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-xs">No attendance records found for this criteria.</p>
          </div>
        ) : (
          <div className="flex-1 md:overflow-y-auto overflow-x-auto table-scrollbar">
            {/* Mobile Card List (Hidden on sm/md/lg) */}
            <div className="sm:hidden divide-y divide-slate-200">
              {filteredRecords.map((item) => (
                <div key={item.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{item.user.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {item.user.employeeId} · {item.user.department?.name || "General"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.currentState === "CHECKED_IN" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      )}
                      {item.currentState === "ON_BREAK" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          Break
                        </span>
                      )}
                      {item.currentState === "CHECKED_OUT" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Ended
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === "PRESENT" ? "text-emerald-700 bg-emerald-50 border border-emerald-200" :
                        item.status === "LATE" ? "text-rose-700 bg-rose-50 border border-rose-200" :
                        "text-amber-700 bg-amber-50 border border-amber-200"
                      }`}>
                        {item.status === "PRESENT" ? "On-Time" : item.status === "LATE" ? "Late" : item.status === "HALF_DAY" ? "Half Day" : item.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px]">
                    <div>
                      <span className="text-slate-400 block">Check In</span>
                      <span className="font-mono font-bold text-slate-800">
                        {new Date(item.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Check Out</span>
                      <span className="font-mono font-bold text-slate-800">
                        {item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Work Time</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {item.totalWorkMinutes !== undefined ? `${Math.floor(item.totalWorkMinutes / 60)}h ${item.totalWorkMinutes % 60}m` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Overtime</span>
                      <span className={`font-mono font-bold ${(item.overtimeMinutes || 0) > 0 ? "text-indigo-600" : "text-slate-400"}`}>
                        {(item.overtimeMinutes || 0) > 0 ? `${Math.floor(item.overtimeMinutes! / 60)}h ${item.overtimeMinutes! % 60}m` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Full Table (Hidden on mobile) */}
            <div className="hidden sm:block min-w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-20 bg-slate-100 text-slate-800 shadow-xs border-b border-slate-300">
                  <tr>
                    <th className="py-3 px-4 font-bold bg-slate-100 tracking-wide text-slate-700 border-b border-slate-200">Employee</th>
                    {dateRange.startDate !== dateRange.endDate && (
                      <th className="py-3 px-4 font-bold bg-slate-100 tracking-wide text-slate-700 border-b border-slate-200">Date</th>
                    )}
                    <th className="py-3 px-4 font-bold bg-slate-100 tracking-wide text-slate-700 border-b border-slate-200">Department</th>
                    <th className="py-3 px-4 font-bold bg-slate-100 tracking-wide text-slate-700 border-b border-slate-200">Check-In</th>
                    <th className="py-3 px-4 font-bold bg-slate-100 tracking-wide text-slate-700 border-b border-slate-200">Check-Out</th>
                    <th className="py-3 px-4 font-bold bg-slate-100 tracking-wide text-slate-700 border-b border-slate-200">State</th>
                    <th className="py-3 px-4 font-bold bg-slate-100 tracking-wide text-slate-700 border-b border-slate-200">Status</th>
                    <th className="py-3 px-4 font-bold bg-slate-100 tracking-wide text-slate-700 border-b border-slate-200">Work / Break</th>
                    <th className="py-3 px-4 font-bold bg-slate-100 tracking-wide text-slate-700 border-b border-slate-200">Overtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredRecords.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition border-b border-slate-200">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{item.user.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.user.employeeId}
                        </div>
                      </td>
                      {dateRange.startDate !== dateRange.endDate && (
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {new Date(item.date).toISOString().split("T")[0]}
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-slate-800">
                        <div>{item.user.department?.name || "General"}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.user.designation?.title || "Staff"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-mono">
                        {new Date(item.checkInTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-mono">
                        {item.checkOutTime
                          ? new Date(item.checkOutTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.currentState === "CHECKED_IN" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-800 border border-emerald-200 bg-emerald-50/50">
                            Active
                          </span>
                        )}
                        {item.currentState === "ON_BREAK" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            On Break
                          </span>
                        )}
                        {item.currentState === "CHECKED_OUT" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            Ended
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4 text-slate-800 font-mono">
                        {item.totalWorkMinutes !== undefined
                          ? `${Math.floor(item.totalWorkMinutes / 60)}h ${
                              item.totalWorkMinutes % 60
                            }m`
                          : "-"}{" "}
                        / <span className="text-slate-500">{item.totalBreakMinutes || 0}m break</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {(item.overtimeMinutes || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            +{Math.floor(item.overtimeMinutes! / 60)}h {item.overtimeMinutes! % 60}m
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
