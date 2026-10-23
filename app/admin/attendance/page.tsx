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
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const { data, error, isLoading } = useAttendanceByDate(selectedDate);

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
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-slate-800" /> Attendance Monitoring
          </h1>
          <p className="text-xs text-slate-800 mt-1">
            Real-time verification logs, active breaks, and punch records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 rounded-lg text-sm"
          />
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.list({ date: selectedDate }) })}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-800 transition shadow-sm"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-800">
            <span>Logged Today</span>
            <CheckCircle2 className="w-4 h-4 text-slate-800" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">{stats.totalCheckedIn}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-800">
            <span>On-Time</span>
            <Clock className="w-4 h-4 text-slate-800" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">{stats.present}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-800">
            <span>Late Arrivals</span>
            <AlertTriangle className="w-4 h-4 text-rose-700" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">{stats.late}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-800">
            <span>Currently on Break</span>
            <Coffee className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{stats.onBreak}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white border border-slate-200 p-3 rounded-lg">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by employee name or ID..."
            className="h-10 rounded-lg pl-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-800" />
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            triggerClassName="h-10 min-w-52 rounded-lg text-sm"
            options={[{value:"ALL",label:"All Statuses"},{value:"PRESENT",label:"On-Time (Present)"},{value:"LATE",label:"Late"},{value:"ON_BREAK",label:"Currently on Break"},{value:"CHECKED_OUT",label:"Shift Concluded"}]}
          />
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {isLoading && records.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-800">Loading attendance data...</div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-700">{parseApiError(error)}</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-800 space-y-2">
            <User className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-xs">No attendance records found for this criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-800 bg-white/50">
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Check-In</th>
                  <th className="py-3 px-4 font-semibold">Check-Out</th>
                  <th className="py-3 px-4 font-semibold">State</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Work / Break</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-white/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.user.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {item.user.employeeId}
                      </div>
                    </td>
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-800 text-slate-800 border border-emerald-200">
                          Active
                        </span>
                      )}
                      {item.currentState === "ON_BREAK" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-700 border border-amber-200 animate-pulse">
                          On Break
                        </span>
                      )}
                      {item.currentState === "CHECKED_OUT" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white text-slate-800">
                          Ended
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === "PRESENT" && (
                        <span className="text-slate-800 font-semibold">On-Time</span>
                      )}
                      {item.status === "LATE" && (
                        <span className="text-rose-700 font-semibold">Late</span>
                      )}
                      {item.status === "HALF_DAY" && (
                        <span className="text-amber-400 font-semibold">Half Day</span>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
