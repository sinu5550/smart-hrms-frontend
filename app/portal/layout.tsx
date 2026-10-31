'use client';

import React from "react";
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
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Punch", href: "/portal/attendance", icon: Clock },
    { label: "DWR", href: "/portal/dwr", icon: FileSpreadsheet },
    { label: "Outwork", href: "/portal/outwork", icon: Briefcase },
    { label: "Loans", href: "/portal/loans", icon: HandCoins },
    { label: "Leave", href: "/portal/leave", icon: CalendarDays },
    { label: "Payslip", href: "/portal/payslip", icon: Coins },
    { label: "Chat", href: "/portal/chat", icon: MessageSquare },
    { label: "Profile", href: "/portal/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col pb-20 md:pb-0">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-7 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-xs shadow-xs">
            {user?.organization?.name?.charAt(0) || "H"}
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

        <div className="flex items-center gap-3">
          {/* Allow Admin Console for Owners, Admins, HRs, and Department Heads */}
          {(user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "HR" || user?.role === "PLATFORM_ADMIN" || user?.isOwner || user?.isDeptHead || (user?.headedDepartments && user.headedDepartments.length > 0)) && (
            <Link
              href="/admin/departments"
              className="text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-600 flex items-center gap-1.5 transition shadow-xs active:scale-95"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{user?.role === "EMPLOYEE" ? "Dept Head Portal" : "Admin Console"}</span>
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

      {/* Mobile PWA Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-40 flex items-center justify-around px-2 shadow-lg backdrop-blur-md">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-14 py-1 rounded-lg transition ${
                isActive
                  ? "text-emerald-700 font-bold"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <div className={`p-1 rounded-md transition ${isActive ? "bg-emerald-50 text-emerald-700" : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
