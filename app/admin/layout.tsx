'use client';

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Users,
  Sliders,
  Shield,
  ChevronLeft,
  ChevronDown,
  CalendarCheck,
  LogOut,
  Sparkles,
  LayoutDashboard,
  Building2,
  Check,
  PlusCircle,
  ShieldCheck,
  Settings,
  Cpu,
  Layers,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!localStorage.getItem("access_token")) router.replace("/login");
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isSettingsActive = pathname.startsWith("/admin/settings");
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  const mainNavItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Attendance Monitor", href: "/admin/attendance", icon: CalendarCheck },
    { label: "Employee Directory", href: "/admin/employees", icon: Users },
    { label: "Departments", href: "/admin/departments", icon: Building2 },
    { label: "Shift Schedules", href: "/admin/shifts", icon: Sliders },
    { label: "Biometric Devices", href: "/admin/devices", icon: Cpu },
  ];

  const settingsNavItems = [
    { label: "Core HR & Branches", href: "/admin/settings/core-hr", icon: Layers },
    { label: "Permission & Access", href: "/admin/settings/permissions", icon: ShieldCheck },
    { label: "Organization & Branding", href: "/admin/settings/organization", icon: Building2 },
  ];

  const orgName = user?.organization?.name || "Ekhone IT";
  const orgLogo = user?.organization?.logoUrl;

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 flex">
      <aside
        className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div>
          {/* Top Brand Logo (HRMS System Brand) */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200/80 bg-white">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-md bg-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              {isSidebarOpen && (
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs tracking-wider text-slate-900">
                    HRMS<span className="text-emerald-700">CORE</span>
                  </span>
                  <span className="text-[10px] bg-slate-900 text-white font-black px-1.5 py-0.5 rounded tracking-wide">
                    PRO
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200/60"
            >
              <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${!isSidebarOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Workspace Switcher / Organization Header */}
          <div className="p-3 border-b border-slate-100 relative" ref={workspaceMenuRef}>
            <button
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
              className={`w-full flex items-center justify-between p-2 rounded-lg border border-slate-200/80 hover:bg-slate-50 transition text-left ${
                isWorkspaceMenuOpen ? "bg-slate-50 ring-2 ring-emerald-500/20" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {orgLogo ? (
                  <img
                    src={orgLogo}
                    alt={orgName}
                    className="w-7 h-7 rounded-md object-contain bg-white border border-slate-200 p-0.5 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
                    {orgName.charAt(0).toUpperCase()}
                  </div>
                )}
                {isSidebarOpen && (
                  <div className="overflow-hidden min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{orgName}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {user?.organization?.employeePrefix ? `${user.organization.employeePrefix} Workspace` : "Primary Workspace"}
                    </p>
                  </div>
                )}
              </div>
              {isSidebarOpen && (
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isWorkspaceMenuOpen ? "rotate-180" : ""}`} />
              )}
            </button>

            {/* Switch Workspace Dropdown */}
            {isWorkspaceMenuOpen && (
              <div className="absolute left-3 right-3 top-16 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-1.5 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Workspace
                </div>

                <div className="flex items-center justify-between p-2 rounded-md bg-emerald-50/60 border border-emerald-100 text-xs font-semibold text-emerald-900">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">{orgName}</span>
                  </div>
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>

                <Link
                  href="/register-organization"
                  onClick={() => setIsWorkspaceMenuOpen(false)}
                  className="w-full flex items-center gap-2 p-2 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Create new workspace</span>
                </Link>

                <div className="pt-1 border-t border-slate-100">
                  <Link
                    href="/admin/settings/organization"
                    onClick={() => setIsWorkspaceMenuOpen(false)}
                    className="w-full flex items-center gap-2 p-2 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Workspace Settings & Logo</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {isSidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}

            {/* Collapsible Settings Menu */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  isSettingsActive
                    ? "bg-slate-100 text-slate-900 font-bold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className={`w-4 h-4 shrink-0 ${isSettingsActive ? "text-emerald-700" : ""}`} />
                  {isSidebarOpen && <span>Settings</span>}
                </div>
                {isSidebarOpen && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      isSettingsOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {/* Sub-items for Settings */}
              {isSettingsOpen && (
                <div className={`mt-1 space-y-0.5 ${isSidebarOpen ? "pl-4 ml-2 border-l border-slate-200/80" : ""}`}>
                  {settingsNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                          isActive
                            ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        {isSidebarOpen && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                {user?.fullName?.charAt(0) || "U"}
              </div>
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-800 truncate">{user?.fullName || "HR Admin"}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email || "Signed in"}</p>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 px-5 md:px-7 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 border border-slate-200">
              {orgName}
            </span>
            <h2 className="text-xs font-semibold text-slate-500 hidden sm:flex items-center gap-1.5">
              <span>/</span>
              <span>{pathname === "/admin" ? "Overview" : pathname.split("/").pop()?.replace("-", " ")}</span>
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Link
              href="/admin/settings/organization"
              className="text-slate-600 hover:text-emerald-700 text-xs flex items-center gap-1.5 font-medium"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Workspace Settings</span>
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href="/portal/attendance"
              className="text-emerald-700 hover:underline text-xs flex items-center gap-1 font-semibold"
            >
              Launch Portal
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-7 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
