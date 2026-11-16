'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  User,
  CalendarDays,
  FileSpreadsheet,
  HandCoins,
  Coins,
  Briefcase,
  MessageSquare,
  LogOut,
  Building2,
  MoreHorizontal,
  X,
  Edit3,
  CalendarCheck,
  ChevronRight,
  Shield,
  Phone,
  Mail,
  Camera,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  // Close drawer on path change
  useEffect(() => {
    setIsMoreDrawerOpen(false);
  }, [pathname]);

  // Primary bottom navigation items (Clean & spacious: Punch, DWR, Outwork, Leave, More)
  const primaryNavItems = [
    { label: "Punch", href: "/portal/attendance", icon: Clock },
    { label: "DWR", href: "/portal/dwr", icon: FileSpreadsheet },
    { label: "Outwork", href: "/portal/outwork", icon: Briefcase },
    { label: "Leave", href: "/portal/leave", icon: CalendarDays },
    { label: "Chat", href: "/portal/chat", icon: MessageSquare },
  ];

  // More drawer items: Profile, Loans, Payslip, Attendance Logs
  const secondaryNavItems = [
    {
      label: "My Profile",
      description: "Manage personal details, digital ID & password",
      href: "/portal/profile",
      icon: User,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Attendance Logs",
      description: "View date-wise punch history & download PDF",
      href: "/portal/attendance/logs",
      icon: CalendarCheck,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Loans & Advances",
      description: "Apply for company loans and view installments",
      href: "/portal/loans",
      icon: HandCoins,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Salary Payslips",
      description: "Review monthly payroll slips & statements",
      href: "/portal/payslip",
      icon: Coins,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  const isMoreActive =
    pathname === "/portal/profile" ||
    pathname === "/portal/loans" ||
    pathname === "/portal/payslip" ||
    pathname.startsWith("/portal/attendance/logs");

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col pb-20 md:pb-0">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-7 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-xs shadow-xs overflow-hidden">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{user?.fullName?.charAt(0) || "U"}</span>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {user?.organization?.name || "HRMS Portal"}
            </p>
            <p className="text-[10px] text-slate-500 font-mono leading-tight">
              {user?.employeeId} &bull; {user?.fullName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Allow Admin Console for Owners, Admins, HRs, and Department Heads */}
          {(user?.role === "OWNER" ||
            user?.role === "ADMIN" ||
            user?.role === "HR" ||
            user?.role === "PLATFORM_ADMIN" ||
            user?.isOwner ||
            user?.isDeptHead ||
            (user?.headedDepartments && user.headedDepartments.length > 0)) && (
            <Link
              href="/admin/departments"
              className="text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-600 flex items-center gap-1.5 transition shadow-xs active:scale-95"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{user?.role === "EMPLOYEE" ? "Dept Head" : "Admin"}</span>
            </Link>
          )}

          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 md:p-6">{children}</main>

      {/* Mobile Bottom Navigation Bar (5 clean tabs) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 flex items-center justify-around px-2 shadow-lg">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition active:scale-95 ${
                isActive
                  ? "text-emerald-700 font-bold"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <div
                className={`p-1 rounded-lg transition ${
                  isActive ? "bg-emerald-50 text-emerald-700" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* More Tab Button */}
        <button
          type="button"
          onClick={() => setIsMoreDrawerOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition active:scale-95 cursor-pointer ${
            isMoreActive || isMoreDrawerOpen
              ? "text-emerald-700 font-bold"
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <div
            className={`p-1 rounded-lg transition ${
              isMoreActive || isMoreDrawerOpen ? "bg-emerald-50 text-emerald-700" : ""
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">More</span>
        </button>
      </nav>

      {/* Slide-over Drawer / Bottom Sheet for "More" */}
      {isMoreDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsMoreDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Panel */}
          <div className="relative bg-white rounded-t-2xl shadow-2xl z-10 max-w-lg w-full mx-auto max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250">
            {/* Top Drag Pill & Header */}
            <div className="pt-3 pb-2 px-4 flex items-center justify-between border-b border-slate-100">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Account & Services
              </span>
              <button
                onClick={() => setIsMoreDrawerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile Card with Picture & Edit Icon */}
            <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white m-3 rounded-xl shadow-md relative overflow-hidden">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg border-2 border-emerald-400/60 overflow-hidden shadow-inner">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{user?.fullName?.charAt(0) || "U"}</span>
                    )}
                  </div>
                  <Link
                    href="/portal/profile"
                    onClick={() => setIsMoreDrawerOpen(false)}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-md transition"
                    title="Edit Profile"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Link>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white truncate">{user?.fullName}</h3>
                    <Link
                      href="/portal/profile"
                      onClick={() => setIsMoreDrawerOpen(false)}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-emerald-300 border border-white/10 transition flex items-center gap-1"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>Edit</span>
                    </Link>
                  </div>
                  <p className="text-[11px] text-emerald-300 font-mono mt-0.5">
                    ID: {user?.employeeId}
                  </p>
                  <p className="text-[10px] text-slate-300 truncate mt-0.5">
                    {user?.department?.name || "General"} &bull; {user?.designation?.title || (user?.designation as any)?.name || "Staff"}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Links */}
            <div className="px-3 pb-6 space-y-1.5 overflow-y-auto">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href === "/portal/attendance/logs" && pathname.startsWith("/portal/attendance/logs"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreDrawerOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      isActive
                        ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold"
                        : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-tight">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                );
              })}

              {/* Logout inside Drawer */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreDrawerOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out of Workspace</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
