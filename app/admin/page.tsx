'use client';

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useEmployees, useAttendanceByDate, useDepartments, useOrganization, useEmploymentStatuses } from "@/hooks";
import { useDashboardStats } from "@/hooks/useEmployees";
import { EmployeeBirthdaysModal } from "@/components/admin/EmployeeBirthdaysModal";
import {
  CalendarDays,
  CalendarOff,
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
  Building2,
  TrendingUp,
} from "lucide-react";

export default function AdminOverviewPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: attendance = [], isLoading: attendanceLoading } = useAttendanceByDate(today);
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments();
  const { data: organization } = useOrganization();
  const { data: configuredStatuses = [] } = useEmploymentStatuses();

  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");

  // Determine which employment statuses have "count_in_attendance = true" (tick-marked in Core HR)
  const attendanceEligibleCodes = React.useMemo(() => {
    if (configuredStatuses.length > 0) {
      const eligible = configuredStatuses.filter((s) => s.countInAttendance).map((s) => s.code);
      if (eligible.length > 0) return eligible;
    }
    return ["ACTIVE", "ON_PROBATION", "INTERN"];
  }, [configuredStatuses]);

  // Strictly filter only employees whose status is tick-marked in Core HR
  const attendanceEligibleEmployees = React.useMemo(() => {
    return employees.filter(
      (emp) =>
        !emp.isDeleted &&
        !emp.attendanceExempt &&
        attendanceEligibleCodes.includes(emp.status)
    );
  }, [employees, attendanceEligibleCodes]);

  // Filter attendance records to only count/show eligible tick-marked employees
  const eligibleAttendance = React.useMemo(() => {
    return (attendance as any[]).filter((record) => {
      const userStatus =
        record.user?.status ||
        employees.find((e) => e.id === record.user?.id || e.id === record.userId)?.status;
      if (!userStatus) return true;
      return attendanceEligibleCodes.includes(userStatus);
    });
  }, [attendance, employees, attendanceEligibleCodes]);

  const active = attendanceEligibleEmployees.length;
  const late = eligibleAttendance.filter((record) => record.status === "LATE").length;
  const working = eligibleAttendance.filter(
    (record) => record.currentState === "CHECKED_IN" || record.currentState === "ON_BREAK"
  ).length;

  const outworkToday = dashboardStats?.outworkToday || [];
  const onLeaveToday = dashboardStats?.onLeaveToday || [];
  const birthdays = dashboardStats?.birthdays || [];
  const currentMonthName = dashboardStats?.currentMonthName || "November";

  // Day Off employees today (strictly attendance-eligible tick-marked employees)
  const dayOffToday = React.useMemo(() => {
    if (dashboardStats?.dayOffToday && Array.isArray(dashboardStats.dayOffToday)) {
      return dashboardStats.dayOffToday;
    }
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayDayName = dayNames[new Date().getDay()];
    const orgWeekendDays = Array.isArray((organization as any)?.weekendDays) && (organization as any).weekendDays.length > 0
      ? (organization as any).weekendDays
      : ["Friday"];
    const rosterDeptIds = Array.isArray((organization as any)?.rosterDepartmentIds)
      ? (organization as any).rosterDepartmentIds
      : [];
    const orgHasRoster = Boolean((organization as any)?.hasRosterDuty);

    return attendanceEligibleEmployees
      .filter((emp) => {
        const isRosterEmp = Boolean(orgHasRoster && emp.departmentId && rosterDeptIds.includes(emp.departmentId));
        const empRosterOffDays = Array.isArray((emp as any).rosterOffDays) ? (emp as any).rosterOffDays : [];
        return isRosterEmp ? empRosterOffDays.includes(todayDayName) : orgWeekendDays.includes(todayDayName);
      })
      .map((emp) => ({
        id: emp.id,
        userId: emp.id,
        fullName: emp.fullName,
        employeeId: emp.employeeId,
        avatarUrl: emp.avatarUrl || null,
        department: emp.department?.name || "General",
        offDayType: "Weekly Off",
        dayName: todayDayName,
      }));
  }, [dashboardStats?.dayOffToday, attendanceEligibleEmployees, organization]);

  // Attendance metrics calculation
  // Strictly reflects tick-marked active personnel count
  const totalEmployeesCount =
    typeof dashboardStats?.totalActive === "number"
      ? dashboardStats.totalActive
      : attendanceEligibleEmployees.length;
  const presentCount = eligibleAttendance.length;
  const onLeaveCount = onLeaveToday.length;
  const absentCount = Math.max(0, totalEmployeesCount - (presentCount + onLeaveCount));
  const attendanceRate = totalEmployeesCount > 0 ? ((presentCount / totalEmployeesCount) * 100).toFixed(1) : "0";
  const absentRate = totalEmployeesCount > 0 ? ((absentCount / totalEmployeesCount) * 100).toFixed(1) : "0";
  const onLeaveRate = totalEmployeesCount > 0 ? ((onLeaveCount / totalEmployeesCount) * 100).toFixed(1) : "0";

  // Department-wise Attendance breakdown calculation (strictly attendance-eligible tick-marked employees)
  const deptAttendanceList = React.useMemo(() => {
    // Collect unique department IDs from employees
    const map = new Map<string, { id: string; name: string; total: number; present: number }>();

    // Seed from departments list
    departments.forEach((d) => {
      map.set(d.id, { id: d.id, name: d.name, total: 0, present: 0 });
    });

    // Populate total counts from active attendance-eligible employees
    attendanceEligibleEmployees.forEach((emp) => {
      const deptId = emp.department?.id || emp.departmentId || "unassigned";
      const deptName = emp.department?.name || "General";
      if (!map.has(deptId)) {
        map.set(deptId, { id: deptId, name: deptName, total: 0, present: 0 });
      }
      const entry = map.get(deptId)!;
      entry.total += 1;
    });

    // Populate present counts from attendance
    eligibleAttendance.forEach((att: any) => {
      const deptId = att.user?.department?.id || "unassigned";
      if (map.has(deptId)) {
        map.get(deptId)!.present += 1;
      }
    });

    return Array.from(map.values())
      .filter((d) => d.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [departments, attendanceEligibleEmployees, eligibleAttendance]);

  // Status breakdown summary for attendance-eligible employees
  const statusSummaryText = React.useMemo(() => {
    if (dashboardStats?.statusSummary) {
      return dashboardStats.statusSummary;
    }
    const map = new Map<string, number>();
    attendanceEligibleEmployees.forEach((emp) => {
      const rawCode = emp.status || "ACTIVE";
      const config = configuredStatuses.find((c) => c.code === rawCode);
      const rawName = config?.name || (rawCode === "ACTIVE" ? "Permanent" : rawCode.replace(/_/g, " "));
      const formatted = rawName.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      map.set(formatted, (map.get(formatted) || 0) + 1);
    });
    const summary = Array.from(map.entries()).map(([name, count]) => `${name}: ${count}`).join(", ");
    return summary || `${totalEmployeesCount} active personnel count`;
  }, [dashboardStats?.statusSummary, attendanceEligibleEmployees, configuredStatuses, totalEmployeesCount]);

  // Top KPI Metric Cards (Active, In-Office, Out of Work, Late, On Leave)
  const kpiCards = [
    {
      title: "Total Employees",
      value: statsLoading && employeesLoading ? "..." : totalEmployeesCount,
      hint: statusSummaryText,
      icon: Users,
      tone: "text-blue-600 bg-blue-50 border-blue-200",
      href: "/admin/employees",
    },
    {
      title: "Currently in Office",
      value: attendanceLoading ? "..." : working,
      hint: `${presentCount} present today (${Math.max(0, presentCount - working)} checked out)`,
      icon: Clock3,
      tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
      href: "/admin/attendance",
    },
    {
      title: "Out of Work",
      value: statsLoading ? "..." : outworkToday.length,
      hint: "Approved field visits & off-site duties",
      icon: Briefcase,
      tone: "text-purple-600 bg-purple-50 border-purple-200",
      href: "/admin/outwork",
    },
    {
      title: "Late Arrivals",
      value: attendanceLoading ? "..." : late,
      hint: "Logged after shift threshold",
      icon: CalendarDays,
      tone: "text-rose-600 bg-rose-50 border-rose-200",
      href: "/admin/attendance",
    },
    {
      title: "On Leave Today",
      value: statsLoading ? "..." : onLeaveCount,
      hint: "Covered by approved leave request",
      icon: Palmtree,
      tone: "text-amber-600 bg-amber-50 border-amber-200",
      href: "/admin/leave",
    },
  ];

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
    <div className="w-full space-y-5">
      {/* KPI Summary Cards Section */}
      <section className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {employeesLoading || attendanceLoading ? (
          [1, 2, 3, 4, 5].map((n) => (
            <article key={n} className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="h-3 w-20 bg-slate-200/70 rounded animate-pulse" />
                  <div className="h-6 w-12 bg-slate-200/80 rounded animate-pulse" />
                </div>
                <div className="h-8 w-8 bg-slate-200/70 rounded-lg animate-pulse" />
              </div>
              <div className="h-2.5 w-24 bg-slate-200/50 rounded animate-pulse" />
            </article>
          ))
        ) : (
          kpiCards.map(({ title, value, hint, icon: Icon, tone, href }) => (
            <Link
              key={title}
              href={href}
              className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-xs hover:border-emerald-500 hover:shadow-sm transition group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 group-hover:text-emerald-700 transition">{title}</p>
                  <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">{value}</p>
                </div>
                <span className={`rounded-lg p-2 border ${tone} transition group-hover:scale-105`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-[10px] font-medium text-slate-500 line-clamp-2" title={hint}>{hint}</p>
            </Link>
          ))
        )}
      </section>

      {/* Row 1: 3-Column Visual Cards Matching Requested Design */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Attendance Overview (Today & Department-wise Breakdown) */}
        <article className="rounded-lg border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Attendance Overview</span>
              <span className="text-[11px] font-normal text-slate-400">(Today)</span>
            </h2>
            <Link href="/admin/attendance" className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-0.5">
              Live Monitor <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-3 flex items-center gap-4">
            {/* Circular Progress Ring */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
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
                <span className="text-base font-black text-slate-900 tracking-tight">{attendanceRate}%</span>
                <span className="text-[8px] font-semibold text-slate-400 leading-tight">Rate</span>
              </div>
            </div>

            {/* Metrics Legend */}
            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  Present
                </span>
                <span className="font-bold text-slate-800 text-[11px]">
                  {presentCount} <span className="font-normal text-[10px] text-slate-400">({attendanceRate}%)</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  Absent
                </span>
                <span className="font-bold text-slate-800 text-[11px]">
                  {absentCount} <span className="font-normal text-[10px] text-slate-400">({absentRate}%)</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  On Leave
                </span>
                <span className="font-bold text-slate-800 text-[11px]">
                  {onLeaveCount} <span className="font-normal text-[10px] text-slate-400">({onLeaveRate}%)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Department-wise Attendance breakdown list */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                Department Breakdown
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Present / Enlisted</span>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {deptAttendanceList.length > 0 ? (
                deptAttendanceList.map((dept) => {
                  const pct = dept.total > 0 ? Math.round((dept.present / dept.total) * 100) : 0;
                  return (
                    <div key={dept.id} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-700 truncate max-w-[130px]">{dept.name}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-800">
                          {dept.present}/{dept.total} <span className="text-slate-400 font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-rose-400"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-[10px] text-slate-400 text-center py-2">No departments assigned yet.</p>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Enlisted: {totalEmployeesCount} personnel</span>
            <Link href="/admin/attendance" className="font-semibold text-emerald-700 hover:underline">
              View Log &rarr;
            </Link>
          </div>
        </article>

        {/* Card 2: Day OFF Employees Today */}
        <article className="rounded-lg border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarOff className="w-4 h-4 text-emerald-600" />
              <span>Day OFF Employees</span>
              <span className="text-[11px] font-normal text-slate-400">(Today)</span>
            </h2>
            <Link href="/admin/shifts" className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-0.5">
              View Shifts <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-100 flex-1 max-h-56 overflow-y-auto pr-1">
            {dayOffToday.length > 0 ? (
              dayOffToday.map((person: any) => (
                <div key={person.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-700">
                      {person.avatarUrl ? (
                        <Image src={person.avatarUrl} alt="" width={32} height={32} unoptimized className="w-full h-full object-cover" />
                      ) : (
                        person.fullName.charAt(0)
                      )}
                    </div>
                    <div>
                      <Link href={`/admin/employees/${person.userId || person.id}`} className="text-xs font-bold text-slate-800 hover:text-emerald-700 transition">
                        {person.fullName}
                      </Link>
                      <p className="text-[10px] text-slate-500">{person.department}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    {person.offDayType || "Day Off"}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No scheduled day off today</p>
                <p className="text-[11px] text-slate-400">All personnel are scheduled for regular work hours today.</p>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Day Off: <strong className="text-slate-700">{dayOffToday.length}</strong></span>
            <Link href="/admin/shifts" className="font-semibold text-emerald-700 hover:underline">
              Roster & Off-Days &rarr;
            </Link>
          </div>
        </article>

        {/* Card 3: Employee Birthdays (Current Month) */}
        <article className="rounded-lg border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cake className="w-4 h-4 text-emerald-600" />
              <span>Employee Birthdays</span>
              <span className="text-[11px] font-normal text-slate-400">({currentMonthName})</span>
            </h2>
            <button
              onClick={() => setIsBirthdayModalOpen(true)}
              className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-0.5"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 flex-1 max-h-56 overflow-y-auto pr-1">
            {birthdays.length > 0 ? (
              birthdays.map((person) => (
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

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 shrink-0">
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

      {/* Row 2: Today at a glance + Upcoming Events & Activities + Quick Actions (All 3 in One Row) */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Live Attendance Today at a Glance */}
        <article className="rounded-lg border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today at a glance</h2>
              <p className="text-[11px] text-slate-500">Live team attendance activity</p>
            </div>
            <Link className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1" href="/admin/attendance">
              <span>Monitor</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-100 flex-1 max-h-64 overflow-y-auto pr-1">
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
            ) : eligibleAttendance.length > 0 ? (
              eligibleAttendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 border border-emerald-100 overflow-hidden shrink-0">
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
                    <div className="min-w-0">
                      <Link
                        href={`/admin/employees/${record.user?.id}`}
                        className="text-xs font-bold text-slate-800 hover:text-emerald-700 transition truncate block"
                      >
                        {record.user?.fullName}
                      </Link>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {record.user?.employeeId} &bull; {record.user?.department?.name || "General"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold shrink-0 ml-2 ${
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

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Punches recorded: {attendance.length}</span>
            <Link href="/admin/attendance" className="font-semibold text-emerald-700 hover:underline">
              Full Log &rarr;
            </Link>
          </div>
        </article>

        {/* Card 2: Upcoming Events & Activities (Static for now as specified) */}
        <article className="rounded-lg border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <span>Upcoming Events & Activities</span>
            </h2>
            <button
              onClick={() => alert("Calendar scheduler feature coming soon!")}
              className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-0.5"
            >
              Calendar <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-3 space-y-2 flex-1 max-h-64 overflow-y-auto pr-1">
            {staticEvents.map((event) => {
              const Icon = event.icon;
              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${event.tone}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{event.title}</p>
                      <p className="text-[10px] text-slate-400">Company Internal</p>
                    </div>
                  </div>

                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 ml-2">
                    {event.dateBadge}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Scheduled milestones: {staticEvents.length}</span>
            <span className="text-[10px] text-slate-400">Static preview</span>
          </div>
        </article>

        {/* Card 3: Quick Actions Card */}
        <article className="rounded-lg border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Quick Actions</span>
            </h2>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 flex-1 content-center">
            <Link
              href="/admin/employees"
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 transition group text-center"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition">
                <UserRoundPlus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 mt-1.5 group-hover:text-emerald-800 transition">
                Add Employee
              </span>
            </Link>

            <Link
              href="/admin/attendance"
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 transition group text-center"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 group-hover:scale-105 transition">
                <Clock3 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 mt-1.5 group-hover:text-blue-800 transition">
                Mark Attendance
              </span>
            </Link>

            <Link
              href="/admin/outwork"
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 transition group text-center"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 group-hover:scale-105 transition">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 mt-1.5 group-hover:text-rose-800 transition">
                Add Out of Work
              </span>
            </Link>

            <Link
              href="/admin/leave"
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 transition group text-center"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-105 transition">
                <Palmtree className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 mt-1.5 group-hover:text-amber-800 transition">
                Apply Leave
              </span>
            </Link>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-[11px]">
              <SlidersHorizontal className="w-3 h-3 text-emerald-600" />
              Shifts & Late:
            </span>
            <Link href="/admin/shifts" className="font-semibold text-emerald-700 hover:underline text-[11px]">
              Manage Shifts &rarr;
            </Link>
          </div>
        </article>
      </section>

      {/* Birthday Modal for full list with search */}
      <EmployeeBirthdaysModal
        isOpen={isBirthdayModalOpen}
        onClose={() => setIsBirthdayModalOpen(false)}
        birthdays={birthdays}
        currentMonthName={currentMonthName}
      />
    </div>
  );
}
