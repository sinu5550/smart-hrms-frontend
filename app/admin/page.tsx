'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useEmployees, useAttendanceByDate } from "@/hooks";
import { useDashboardStats } from "@/hooks/useEmployees";
import {
  CalendarDays,
  Users,
  Clock3,
  ArrowUpRight,
  UserRoundPlus,
  SlidersHorizontal,
  Briefcase,
  Cake,
  Calendar,
  Zap,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  GraduationCap,
  Trophy,
  Users2,
  FileCheck,
  Palmtree,
  ArrowRight,
  Eye,
} from "lucide-react";

export default function AdminOverviewPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: attendance = [], isLoading: attendanceLoading } = useAttendanceByDate(today);
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();

  const active = employees.filter((person) => person.status === "ACTIVE").length;
  const late = (attendance as any[]).filter((record) => record.status === "LATE").length;
  const working = (attendance as any[]).filter(
    (record) => record.currentState === "CHECKED_IN" || record.currentState === "ON_BREAK"
  ).length;

  const outworkToday = dashboardStats?.outworkToday || [];
  const onLeaveToday = dashboardStats?.onLeaveToday || [];
  const birthdays = dashboardStats?.birthdays || [];
  const currentMonthName = dashboardStats?.currentMonthName || "November";

  // Attendance metrics calculation
  const totalEmployeesCount = active || employees.length || 1;
  const presentCount = attendance.length;
  const onLeaveCount = onLeaveToday.length;
  const absentCount = Math.max(0, totalEmployeesCount - (presentCount + onLeaveCount));
  const attendanceRate = totalEmployeesCount > 0 ? ((presentCount / totalEmployeesCount) * 100).toFixed(1) : "0";
  const absentRate = totalEmployeesCount > 0 ? ((absentCount / totalEmployeesCount) * 100).toFixed(1) : "0";
  const onLeaveRate = totalEmployeesCount > 0 ? ((onLeaveCount / totalEmployeesCount) * 100).toFixed(1) : "0";

  // Static Upcoming Events & Activities as requested
  const staticEvents = [
    {
      id: "1",
      title: "Monthly Team Meeting",
      dateBadge: "Nov 10",
      icon: Megaphone,
      tone: "text-amber-600 bg-amber-50",
    },
    {
      id: "2",
      title: "Product Photography Training",
      dateBadge: "Nov 15",
      icon: GraduationCap,
      tone: "text-purple-600 bg-purple-50",
    },
    {
      id: "3",
      title: "Q4 Campaign Planning",
      dateBadge: "Nov 20",
      icon: Trophy,
      tone: "text-amber-500 bg-amber-50",
    },
    {
      id: "4",
      title: "E-commerce Sales Review",
      dateBadge: "Nov 28",
      icon: Users2,
      tone: "text-indigo-600 bg-indigo-50",
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Top Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 md:p-8 text-white shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs uppercase tracking-[.2em] text-emerald-300 font-semibold">People Operations</p>
          <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">Good work starts with a clear view.</h1>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            Monitor real-time office attendance, field visits, on-leave employees, and upcoming team milestones.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/admin/employees"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white transition shadow-sm"
            >
              <UserRoundPlus className="h-3.5 w-3.5" /> Add Employee
            </Link>
            <Link
              href="/admin/attendance"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              Live Attendance Monitor <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-24 h-72 w-72 rounded-full border-[36px] border-white/5 pointer-events-none" />
        <div className="absolute right-28 -bottom-36 h-72 w-72 rounded-full border-[36px] border-white/5 pointer-events-none" />
      </section>

      {/* Row 1: 3-Column Visual Cards Matching Requested Design */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Attendance Overview (Today) */}
        <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Attendance Overview</span>
              <span className="text-[11px] font-normal text-slate-400">(Today)</span>
            </h2>
          </div>

          <div className="mt-4 flex items-center gap-5">
            {/* Circular Progress Ring */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                {/* Present Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10b981"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={`${(parseFloat(attendanceRate) * 2.51).toFixed(1)} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-slate-900 tracking-tight">{attendanceRate}%</span>
                <span className="text-[9px] font-semibold text-slate-400 leading-tight">Attendance Rate</span>
              </div>
            </div>

            {/* Metrics Legend */}
            <div className="flex-1 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  Present
                </span>
                <span className="font-bold text-slate-800">
                  {presentCount} <span className="font-normal text-[11px] text-slate-400">({attendanceRate}%)</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  Absent
                </span>
                <span className="font-bold text-slate-800">
                  {absentCount} <span className="font-normal text-[11px] text-slate-400">({absentRate}%)</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  On Leave
                </span>
                <span className="font-bold text-slate-800">
                  {onLeaveCount} <span className="font-normal text-[11px] text-slate-400">({onLeaveRate}%)</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Enlisted: {totalEmployeesCount} personnel</span>
            <Link href="/admin/attendance" className="font-semibold text-emerald-700 hover:underline">
              View Log &rarr;
            </Link>
          </div>
        </article>

        {/* Card 2: Out of Work (Today) / On Leave (Today) */}
        <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Out of Work</span>
              <span className="text-[11px] font-normal text-slate-400">(Today)</span>
            </h2>
            <Link href="/admin/outwork" className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-0.5">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-100 flex-1 flex flex-col justify-center">
            {outworkToday.length > 0 ? (
              outworkToday.slice(0, 3).map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-700">
                      {item.avatarUrl ? (
                        <Image src={item.avatarUrl} alt="" width={32} height={32} unoptimized className="w-full h-full object-cover" />
                      ) : (
                        item.fullName.charAt(0)
                      )}
                    </div>
                    <div>
                      <Link href={`/admin/employees/${item.userId}`} className="text-xs font-bold text-slate-800 hover:text-emerald-700 transition">
                        {item.fullName}
                      </Link>
                      <p className="text-[10px] text-slate-500">{item.department}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Out of Work
                  </span>
                </div>
              ))
            ) : onLeaveToday.length > 0 ? (
              onLeaveToday.slice(0, 3).map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-700">
                      {item.avatarUrl ? (
                        <Image src={item.avatarUrl} alt="" width={32} height={32} unoptimized className="w-full h-full object-cover" />
                      ) : (
                        item.fullName.charAt(0)
                      )}
                    </div>
                    <div>
                      <Link href={`/admin/employees/${item.userId}`} className="text-xs font-bold text-slate-800 hover:text-emerald-700 transition">
                        {item.fullName}
                      </Link>
                      <p className="text-[10px] text-slate-500">{item.department}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    On Leave ({item.leaveType})
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">All personnel stationed in-office</p>
                <p className="text-[11px] text-slate-400">No active out-of-work or field visit requests for today.</p>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Approved Field Visits: {outworkToday.length}</span>
            <Link href="/admin/leave" className="font-semibold text-emerald-700 hover:underline">
              Leave ({onLeaveToday.length}) &rarr;
            </Link>
          </div>
        </article>

        {/* Card 3: Employee Birthdays (Current Month) */}
        <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cake className="w-4 h-4 text-emerald-600" />
              <span>Employee Birthdays</span>
              <span className="text-[11px] font-normal text-slate-400">({currentMonthName})</span>
            </h2>
            <Link href="/admin/employees" className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-0.5">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-100 flex-1 flex flex-col justify-center">
            {birthdays.length > 0 ? (
              birthdays.slice(0, 3).map((person) => (
                <div key={person.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-emerald-800">
                      {person.avatarUrl ? (
                        <Image src={person.avatarUrl} alt="" width={32} height={32} unoptimized className="w-full h-full object-cover" />
                      ) : (
                        person.fullName.charAt(0)
                      )}
                    </div>
                    <div>
                      <Link href={`/admin/employees/${person.id}`} className="text-xs font-bold text-slate-800 hover:text-emerald-700 transition">
                        {person.fullName}
                      </Link>
                      <p className="text-[10px] text-slate-500">{person.department}</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800">
                    <Calendar className="w-3 h-3 text-emerald-600" />
                    <span>{person.displayDate}</span>
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center space-y-1">
                <Cake className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No birthdays this month</p>
                <p className="text-[11px] text-slate-400">Keep birthdays updated in employee registration forms.</p>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Celebrations this month: {birthdays.length}</span>
            <span className="text-[10px] text-emerald-600 font-medium">🎂 Birthday wishes</span>
          </div>
        </article>
      </section>

      {/* Row 2: Upcoming Events & Activities + Quick Actions */}
      <section className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Upcoming Events & Activities (Static for now as specified) */}
        <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <span>Upcoming Events & Activities</span>
            </h2>
            <button
              onClick={() => alert("Calendar scheduler feature coming soon!")}
              className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-0.5"
            >
              View Calendar <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
            {staticEvents.map((event) => {
              const Icon = event.icon;
              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${event.tone}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{event.title}</p>
                      <p className="text-[10px] text-slate-400">Company Internal Event</p>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {event.dateBadge}
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        {/* Quick Actions Card */}
        <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Quick Actions</span>
            </h2>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/admin/employees"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 transition group text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition">
                <UserRoundPlus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 mt-2.5 group-hover:text-emerald-800 transition">
                Add Employee
              </span>
            </Link>

            <Link
              href="/admin/attendance"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 transition group text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 group-hover:scale-105 transition">
                <Clock3 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 mt-2.5 group-hover:text-blue-800 transition">
                Mark Attendance
              </span>
            </Link>

            <Link
              href="/admin/outwork"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 transition group text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 group-hover:scale-105 transition">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 mt-2.5 group-hover:text-rose-800 transition">
                Add Out of Work
              </span>
            </Link>

            <Link
              href="/admin/leave"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 transition group text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-105 transition">
                <Palmtree className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 mt-2.5 group-hover:text-amber-800 transition">
                Apply Leave
              </span>
            </Link>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              Shift & Late configuration:
            </span>
            <Link href="/admin/shifts" className="font-semibold text-emerald-700 hover:underline">
              Manage Shifts &rarr;
            </Link>
          </div>
        </article>
      </section>

      {/* Row 3: Live Attendance Today at a Glance */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Today at a glance</h2>
            <p className="text-[11px] text-slate-500">Latest attendance punches recorded from your team</p>
          </div>
          <Link className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1" href="/admin/attendance">
            <span>Open monitor</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="mt-3 divide-y divide-slate-100">
          {attendanceLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-slate-200/80 animate-pulse" />
                    <div className="space-y-1">
                      <div className="h-3.5 w-28 bg-slate-200/80 rounded animate-pulse" />
                      <div className="h-2.5 w-20 bg-slate-200/60 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-5 w-16 bg-slate-200/80 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : attendance.length > 0 ? (
            attendance.slice(0, 6).map((record) => (
              <div key={record.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 border border-emerald-100 overflow-hidden">
                    {record.user?.avatarUrl ? (
                      <Image
                        src={record.user.avatarUrl}
                        alt=""
                        width={32}
                        height={32}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      record.user?.fullName?.charAt(0) || "U"
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/admin/employees/${record.user?.id}`}
                      className="text-xs font-bold text-slate-800 hover:text-emerald-700 transition"
                    >
                      {record.user?.fullName}
                    </Link>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {record.user?.employeeId} &bull; {record.user?.department?.name || "General"}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    record.status === "LATE"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : record.currentState === "CHECKED_OUT"
                      ? "bg-slate-100 text-slate-600 border border-slate-200 font-medium"
                      : record.currentState === "ON_BREAK"
                      ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {record.status === "LATE"
                    ? "Late"
                    : record.currentState === "CHECKED_OUT"
                    ? "Checked Out"
                    : record.currentState === "ON_BREAK"
                    ? "On Break"
                    : "Present"}
                </span>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-xs text-slate-400">No attendance recorded for today.</p>
          )}
        </div>
      </section>
    </div>
  );
}
