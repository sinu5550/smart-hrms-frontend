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
  FileText,
  Briefcase,
  MapPin,
  HandCoins,
  CalendarDays,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, refreshProfile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.replace("/login");
    } else {
      refreshProfile();
    }
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

  const isOwner = Boolean(
    user?.email &&
    user?.organization &&
    (user?.role === "ADMIN" || user?.email === user?.organization?.ownerEmail)
  );
  const userPerms = Array.isArray(user?.permissions) ? user.permissions : [];
  const hasFullAccess = user?.role === "PLATFORM_ADMIN" || user?.role === "ADMIN" || isOwner;

  const hasPerm = (requiredPerm?: string) => {
    if (hasFullAccess || !requiredPerm) return true;
    // If user has specific permission in their list
    if (userPerms.includes(requiredPerm)) return true;
    // If user has no permissions explicitly listed yet and is HR, default to standard HR items
    if (userPerms.length === 0 && user?.role === "HR") {
      const defaultHrExcluded = ["employees.permissions", "employees.roles", "organization.settings"];
      return !defaultHrExcluded.includes(requiredPerm);
    }
    return false;
  };

  const allMainNavItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Attendance Monitor", href: "/admin/attendance", icon: CalendarCheck, perm: "attendance.view" },
    { label: "Outwork & Visits", href: "/admin/outwork", icon: MapPin },
    { label: "Leave Requests", href: "/admin/leave", icon: CalendarDays },
    { label: "Employee Directory", href: "/admin/employees", icon: Users, perm: "employees.view" },
    { label: "Company Loans", href: "/admin/loans", icon: HandCoins },
    { label: "Departments", href: "/admin/departments", icon: Building2, perm: "departments.manage" },
    { label: "Shift Schedules", href: "/admin/shifts", icon: Sliders, perm: "shift.settings" },
    { label: "Biometric & Hardware", href: "/admin/devices", icon: Cpu, perm: "devices.view" },
    { label: "Lifecycle & ATS", href: "/admin/lifecycle", icon: Briefcase, perm: "employees.view" },
    { label: "MIS & Compliance", href: "/admin/reports", icon: FileText, perm: "reports.export" },
  ];

  const allSettingsNavItems = [
    { label: "Core HR & Branches", href: "/admin/settings/core-hr", icon: Layers, perm: "organization.settings" },
    { label: "Permission & Access", href: "/admin/settings/permissions", icon: ShieldCheck, perm: "employees.permissions" },
    { label: "Organization & Branding", href: "/admin/settings/organization", icon: Building2, perm: "organization.settings" },
  ];

  const mainNavItems = allMainNavItems.filter((i) => hasPerm(i.perm));
  const settingsNavItems = allSettingsNavItems.filter((i) => hasPerm(i.perm));

  const orgName = user?.organization?.name || "Ekhone IT";
  const orgLogo = user?.organization?.logoUrl;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 flex flex-col md:flex-row">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar: Desktop fixed/collapsible + Mobile sliding drawer */}
      <aside
        className={`fixed md:sticky top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between h-screen ${
          // Mobile classes
          isMobileMenuOpen ? "translate-x-0 w-72 shadow-2xl" : "-translate-x-full md:translate-x-0"
        } ${
          // Desktop classes
          isSidebarOpen ? "md:w-64" : "md:w-20"
        }`}
      >
        <div className="overflow-y-auto flex-1 flex flex-col min-h-0">
          {/* Top Brand Logo */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center shrink-0 shadow-sm text-white">
                <Shield className="w-4 h-4" />
              </div>
              {(isSidebarOpen || isMobileMenuOpen) && (
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs tracking-wider text-slate-900">
                    HRMS<span className="text-emerald-700">CORE</span>
                  </span>
                  <span className="text-[9px] bg-slate-900 text-white font-black px-1.5 py-0.5 rounded tracking-wide">
                    PRO
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Collapse Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${!isSidebarOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 text-sm font-bold"
            >
              &times;
            </button>
          </div>

          {/* Workspace Switcher / Organization Header */}
          <div className="p-3 border-b border-slate-100 relative shrink-0" ref={workspaceMenuRef}>
            <button
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
              className={`w-full flex items-center justify-between p-2 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition text-left ${
                isWorkspaceMenuOpen ? "bg-slate-50 ring-2 ring-emerald-500/20" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {orgLogo ? (
                  <img
                    src={orgLogo}
                    alt={orgName}
                    className="w-7 h-7 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
                    {orgName.charAt(0).toUpperCase()}
                  </div>
                )}
                {(isSidebarOpen || isMobileMenuOpen) && (
                  <div className="overflow-hidden min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{orgName}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {user?.organization?.employeePrefix ? `${user.organization.employeePrefix} Workspace` : "Workspace"}
                    </p>
                  </div>
                )}
              </div>
              {(isSidebarOpen || isMobileMenuOpen) && (
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isWorkspaceMenuOpen ? "rotate-180" : ""}`} />
              )}
            </button>

            {/* Switch Workspace Dropdown */}
            {isWorkspaceMenuOpen && (
              <div className="absolute left-3 right-3 top-16 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Workspace
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs font-semibold text-emerald-900">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">{orgName}</span>
                  </div>
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>

                <Link
                  href="/register-organization"
                  onClick={() => setIsWorkspaceMenuOpen(false)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Create new workspace</span>
                </Link>

                <div className="pt-1 border-t border-slate-100">
                  <Link
                    href="/admin/settings/organization"
                    onClick={() => setIsWorkspaceMenuOpen(false)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Workspace Settings & Logo</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 flex-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition active:scale-[0.99] ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {(isSidebarOpen || isMobileMenuOpen) && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}

            {/* Collapsible Settings Menu */}
            {settingsNavItems.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isSettingsActive
                      ? "bg-slate-100 text-slate-900 font-bold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings className={`w-4 h-4 shrink-0 ${isSettingsActive ? "text-emerald-700" : ""}`} />
                    {(isSidebarOpen || isMobileMenuOpen) && <span>Settings</span>}
                  </div>
                  {(isSidebarOpen || isMobileMenuOpen) && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isSettingsOpen ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>

                {/* Sub-items for Settings */}
                {isSettingsOpen && (
                  <div className={`mt-1 space-y-0.5 ${(isSidebarOpen || isMobileMenuOpen) ? "pl-4 ml-2 border-l border-slate-200/80" : ""}`}>
                    {settingsNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                            isActive
                              ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          {(isSidebarOpen || isMobileMenuOpen) && <span className="truncate">{item.label}</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-slate-100 shrink-0 bg-white">
          <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {user?.fullName?.charAt(0) || "U"}
              </div>
              {(isSidebarOpen || isMobileMenuOpen) && (
                <div className="overflow-hidden min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.fullName || "HR Admin"}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email || "Signed in"}</p>
                </div>
              )}
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Mobile & Desktop Header */}
        <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3.5 md:px-7 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5">
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition active:scale-95"
              aria-label="Open navigation menu"
            >
              <div className="space-y-1 w-4">
                <span className="block w-4 h-0.5 bg-slate-700 rounded-full" />
                <span className="block w-3 h-0.5 bg-slate-700 rounded-full" />
                <span className="block w-4 h-0.5 bg-slate-700 rounded-full" />
              </div>
            </button>

            <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg text-slate-700 border border-slate-200/80 truncate max-w-[130px] sm:max-w-[200px]">
              {orgName}
            </span>

            <h2 className="text-xs font-semibold text-slate-400 hidden sm:flex items-center gap-1.5">
              <span>/</span>
              <span className="capitalize">{pathname === "/admin" ? "Overview" : pathname.split("/").pop()?.replace(/-/g, " ")}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <Link
              href="/admin/settings/organization"
              className="hidden sm:flex text-slate-600 hover:text-emerald-700 text-xs items-center gap-1.5 font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Settings</span>
            </Link>
            <Link
              href="/portal/attendance"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Punch</span> Portal
            </Link>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 md:p-7 overflow-y-auto w-full">
          {children}
        </main>

        {/* Mobile Bottom App Navigation Bar (App-like feel) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1 flex items-center justify-around shadow-lg">
          <Link
            href="/admin"
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-semibold transition ${
              pathname === "/admin" ? "text-emerald-700" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Home</span>
          </Link>
          <Link
            href="/admin/attendance"
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-semibold transition ${
              pathname.startsWith("/admin/attendance") ? "text-emerald-700" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <CalendarCheck className="w-4 h-4 mb-0.5" />
            <span>Attendance</span>
          </Link>
          <Link
            href="/admin/employees"
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-semibold transition ${
              pathname.startsWith("/admin/employees") ? "text-emerald-700" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span>Employees</span>
          </Link>
          <Link
            href="/admin/devices"
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-semibold transition ${
              pathname.startsWith("/admin/devices") ? "text-emerald-700" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Cpu className="w-4 h-4 mb-0.5" />
            <span>Devices</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition"
          >
            <Sliders className="w-4 h-4 mb-0.5" />
            <span>More</span>
          </button>
        </div>
      </div>
    </div>
  );
}
