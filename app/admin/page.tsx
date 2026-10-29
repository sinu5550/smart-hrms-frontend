'use client';

import Link from "next/link";
import { useEmployees, useAttendanceByDate } from "@/hooks";
import { CalendarDays, Users, Clock3, ArrowUpRight, UserRoundPlus, SlidersHorizontal } from "lucide-react";

export default function AdminOverviewPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: attendance = [], isLoading: attendanceLoading } = useAttendanceByDate(today);
  const active = employees.filter((person) => person.status === "ACTIVE").length;
  const late = (attendance as any[]).filter((record) => record.status === "LATE").length;
  const working = (attendance as any[]).filter((record) => record.currentState === "CHECKED_IN" || record.currentState === "ON_BREAK").length;
  const cards = [
    {
      title: "Active Employees",
      value: employeesLoading ? "..." : active,
      hint: `${employees.length} enlisted personnel profiles`,
      icon: Users,
      tone: "text-blue-600 bg-blue-50",
    },
    {
      title: "Currently in Office",
      value: attendanceLoading ? "..." : working,
      hint: `${(attendance as any[]).length} checked in today (${(attendance as any[]).length - working} checked out)`,
      icon: Clock3,
      tone: "text-emerald-700 bg-emerald-50",
    },
    {
      title: "Late Arrivals",
      value: attendanceLoading ? "..." : late,
      hint: "Logged after shift threshold today",
      icon: CalendarDays,
      tone: "text-amber-700 bg-amber-50",
    },
  ];
  return <div className="w-full space-y-6">
    <section className="relative overflow-hidden rounded-lg bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 md:p-8 text-white shadow-sm">
      <div className="relative z-10 max-w-2xl">
        <p className="text-xs uppercase tracking-[.2em] text-emerald-300 font-semibold">People operations</p>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">Good work starts with a clear view.</h1>
        <p className="mt-2 text-xs leading-5 text-slate-300">Review today&apos;s attendance and keep your employee records moving from one calm workspace.</p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link href="/admin/employees" className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 transition shadow-sm">
            <UserRoundPlus className="h-3.5 w-3.5"/> Add employee
          </Link>
          <Link href="/admin/attendance" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition">
            View attendance <ArrowUpRight className="h-3.5 w-3.5"/>
          </Link>
        </div>
      </div>
      <div className="absolute -right-8 -bottom-24 h-72 w-72 rounded-full border-[36px] border-white/5"/>
      <div className="absolute right-28 -bottom-36 h-72 w-72 rounded-full border-[36px] border-white/5"/>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {employeesLoading || attendanceLoading ? (
        [1, 2, 3].map((n) => (
          <article key={n} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-3 w-28 bg-slate-200/80 rounded animate-pulse" />
                <div className="h-7 w-16 bg-slate-200/80 rounded animate-pulse" />
              </div>
              <div className="h-8 w-8 bg-slate-200/80 rounded-lg animate-pulse" />
            </div>
            <div className="h-2.5 w-32 bg-slate-200/60 rounded animate-pulse" />
          </article>
        ))
      ) : (
        cards.map(({ title, value, hint, icon: Icon, tone }) => (
          <article key={title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-semibold text-slate-700">{title}</p>
                <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-900">{value}</p>
              </div>
              <span className={`rounded-lg p-2 ${tone}`}><Icon className="h-4 w-4"/></span>
            </div>
            <p className="mt-2.5 text-[12px] font-medium text-slate-500">{hint}</p>
          </article>
        ))
      )}
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-bold text-slate-800">Today at a glance</h2>
            <p className="text-[11px] text-slate-500">Latest attendance from your team</p>
          </div>
          <Link className="text-xs font-semibold text-emerald-700 hover:underline" href="/admin/attendance">
            Open monitor &rarr;
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
          ) : (
            attendance.slice(0, 5).map((record) => (
              <div key={record.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 border border-emerald-100">
                    {record.user.fullName.charAt(0)}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{record.user.fullName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{record.user.employeeId}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  record.status === "LATE"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : record.currentState === "CHECKED_OUT"
                    ? "bg-slate-100 text-slate-600 border border-slate-200 font-medium"
                    : record.currentState === "ON_BREAK"
                    ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                  {record.status === "LATE"
                    ? "Late"
                    : record.currentState === "CHECKED_OUT"
                    ? "Ended"
                    : record.currentState === "ON_BREAK"
                    ? "Break"
                    : "On-Time"}
                </span>
              </div>
            ))
          )}
          {!attendanceLoading && attendance.length === 0 && (
            <p className="py-8 text-center text-xs text-slate-400">No attendance recorded for today.</p>
          )}
        </div>
      </article>

      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-3">Quick access</h2>
        <div className="mt-3 space-y-2">
          <Link href="/admin/employees" className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
            <span className="flex items-center gap-2.5"><Users className="h-4 w-4 text-emerald-600"/>Employee directory</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400"/>
          </Link>
          <Link href="/admin/settings/shift" className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
            <span className="flex items-center gap-2.5"><SlidersHorizontal className="h-4 w-4 text-emerald-600"/>Shift & late rules</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400"/>
          </Link>
        </div>
      </article>
    </section>
  </div>;
}
