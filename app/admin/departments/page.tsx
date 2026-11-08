'use client';

import React, { useState } from "react";
import {
  useDepartments,
  useDepartmentDetails,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useUpdateEmployeeRosterOffDays,
  useUpdateEmployeeShift,
  useShifts,
  useEmploymentStatuses,
  useEmployees,
} from "@/hooks";
import {
  useRosterShiftRequests,
  useActionRosterShiftRequest,
} from "@/hooks/useDepartments";
import { useOrganization } from "@/hooks/useOrganization";
import { parseApiError } from "@/services/api";
import { Department } from "@/services/department.service";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Info,
  Clock,
  XCircle,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/components/auth/AuthProvider";
import Image from "next/image";

const WEEK_DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function DepartmentsPage() {
  const { user } = useAuth();
  const { data: allDepartments = [], isLoading } = useDepartments();
  const { data: allEmployees = [] } = useEmployees();
  const { data: organization } = useOrganization();
  const { data: availableShifts = [] } = useShifts();
  const createDepartmentMutation = useCreateDepartment();
  const updateDepartmentMutation = useUpdateDepartment();
  const deleteDepartmentMutation = useDeleteDepartment();
  const updateRosterOffDaysMutation = useUpdateEmployeeRosterOffDays();
  const updateEmployeeShiftMutation = useUpdateEmployeeShift();
  const { data: rosterShiftRequests = [] } = useRosterShiftRequests();
  const actionShiftRequestMutation = useActionRosterShiftRequest();

  // Main page tab: "DEPARTMENTS" vs "SHIFT_REQUESTS"
  const [activeMainTab, setActiveMainTab] = useState<"DEPARTMENTS" | "SHIFT_REQUESTS">("DEPARTMENTS");
  const [shiftRequestStatusFilter, setShiftRequestStatusFilter] = useState<string>("ALL");
  const [shiftRequestSearch, setShiftRequestSearch] = useState<string>("");
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const pendingShiftRequests = React.useMemo(() => {
    return Array.isArray(rosterShiftRequests)
      ? rosterShiftRequests.filter((r) => r.status === "PENDING")
      : [];
  }, [rosterShiftRequests]);

  const pendingShiftCount = pendingShiftRequests.length;

  const filteredShiftRequests = React.useMemo(() => {
    if (!Array.isArray(rosterShiftRequests)) return [];
    return rosterShiftRequests.filter((r) => {
      const q = shiftRequestSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.user?.fullName || "").toLowerCase().includes(q) ||
        (r.user?.employeeId || "").toLowerCase().includes(q) ||
        (r.user?.department?.name || "").toLowerCase().includes(q) ||
        (r.targetShift?.shiftName || "").toLowerCase().includes(q) ||
        (r.reason || "").toLowerCase().includes(q);

      const matchesStatus =
        shiftRequestStatusFilter === "ALL"
          ? true
          : r.status === shiftRequestStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rosterShiftRequests, shiftRequestSearch, shiftRequestStatusFilter]);

  const handleActionShiftRequest = async (id: string, action: "APPROVED" | "REJECTED", employeeName?: string) => {
    try {
      setProcessingRequestId(id);
      await actionShiftRequestMutation.mutateAsync({ id, action });
      setSuccessMsg(
        action === "APPROVED"
          ? `Approved roster shift change for ${employeeName || "employee"}. Shift schedule updated successfully.`
          : `Rejected roster shift change for ${employeeName || "employee"}.`
      );
    } catch (err) {
      alert(parseApiError(err));
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Optimistic UI state maps
  const [optimisticOffDays, setOptimisticOffDays] = useState<Record<string, string[]>>({});
  const [optimisticShifts, setOptimisticShifts] = useState<Record<string, string | null>>({});
  const [optimisticHeadUserIds, setOptimisticHeadUserIds] = useState<Record<string, string | null>>({});

  // If logged-in user is a Department Head with EMPLOYEE role, only show the department(s) they manage
  const isDeptHeadOnly = Boolean(
    user?.role === "EMPLOYEE" &&
    (user?.isDeptHead || (user?.headedDepartments && user.headedDepartments.length > 0))
  );

  const departments = isDeptHeadOnly
    ? allDepartments.filter((d) => d.headUserId === user?.id || user?.headedDepartments?.some((hd) => hd.id === d.id))
    : allDepartments;

  // Create / Edit Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Department Details & Roster Modal
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const { data: selectedDept, isLoading: isLoadingDeptDetails } = useDepartmentDetails(selectedDeptId);

  const { data: configuredStatuses = [] } = useEmploymentStatuses();

  // Determine which employment statuses have "count_in_attendance = true" (tick-marked in Core HR)
  const attendanceEligibleCodes = React.useMemo(() => {
    if (configuredStatuses.length > 0) {
      const eligible = configuredStatuses.filter((s) => s.countInAttendance).map((s) => s.code);
      if (eligible.length > 0) return eligible;
    }
    return ["ACTIVE", "ON_PROBATION"];
  }, [configuredStatuses]);

  // Only active personnel employees (counted in attendance) in department
  const activeDepartmentUsers = React.useMemo(() => {
    if (!selectedDept?.users) return [];
    return selectedDept.users.filter((emp) => attendanceEligibleCodes.includes(emp.status));
  }, [selectedDept?.users, attendanceEligibleCodes]);

  const openCreateModal = () => {
    setEditingDept(null);
    setName("");
    setCode("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, dept: Department) => {
    e.stopPropagation();
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setFormError("Department name is required.");
      return;
    }

    try {
      if (editingDept) {
        await updateDepartmentMutation.mutateAsync({
          id: editingDept.id,
          payload: { name: name.trim(), code: code.trim().toUpperCase() || undefined },
        });
        setSuccessMsg(`Department "${name}" updated successfully.`);
      } else {
        await createDepartmentMutation.mutateAsync({
          name: name.trim(),
          code: code.trim().toUpperCase() || undefined,
        });
        setSuccessMsg(`Department "${name}" created successfully.`);
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(parseApiError(err));
    }
  };

  const handleDelete = async (e: React.MouseEvent, dept: Department) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete department "${dept.name}"? Employees in this department will become unassigned.`)) {
      return;
    }
    try {
      await deleteDepartmentMutation.mutateAsync(dept.id);
      setSuccessMsg(`Department "${dept.name}" deleted.`);
      if (selectedDeptId === dept.id) {
        setSelectedDeptId(null);
      }
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  // Change Department Head
  const handleAssignHead = async (headUserId: string) => {
    if (!selectedDeptId) return;
    const previousHeadId = selectedDept?.headUserId ?? null;
    const newHeadId = headUserId ? headUserId : null;

    // Instant optimistic update in modal
    setOptimisticHeadUserIds((prev) => ({
      ...prev,
      [selectedDeptId]: newHeadId,
    }));

    try {
      await updateDepartmentMutation.mutateAsync({
        id: selectedDeptId,
        payload: { headUserId: newHeadId },
      });
      setSuccessMsg("Department Head updated successfully.");
    } catch (err) {
      // Revert optimistic state on error
      setOptimisticHeadUserIds((prev) => ({
        ...prev,
        [selectedDeptId]: previousHeadId,
      }));
      alert(parseApiError(err));
    }
  };

  // Synchronous ref to prevent stale closures and ensure rapid clicks are never dropped
  const offDaysRef = React.useRef<Record<string, string[]>>({});
  const debounceTimersRef = React.useRef<Record<string, NodeJS.Timeout>>({});

  // Flush any pending off-day mutations immediately when closing the modal or unmounting
  const flushPendingOffDays = React.useCallback(() => {
    const deptId = selectedDeptId;
    if (!deptId) return;
    Object.entries(debounceTimersRef.current).forEach(([empId, timer]) => {
      clearTimeout(timer);
      const pendingDays = offDaysRef.current[empId];
      if (pendingDays) {
        updateRosterOffDaysMutation.mutate({
          departmentId: deptId,
          employeeUserId: empId,
          rosterOffDays: pendingDays,
        });
      }
    });
    debounceTimersRef.current = {};
  }, [selectedDeptId, updateRosterOffDaysMutation]);

  React.useEffect(() => {
    return () => {
      flushPendingOffDays();
    };
  }, [flushPendingOffDays]);

  const handleCloseDeptModal = () => {
    flushPendingOffDays();
    setSelectedDeptId(null);
  };

  // Toggle Roster Off-Day for an Employee with Instant Optimistic UI and Guaranteed Background Persistence
  const handleToggleOffDay = (employeeUserId: string, currentOffDays: string[] = [], day: string) => {
    if (!selectedDeptId) return;
    const current = offDaysRef.current[employeeUserId] ??
      optimisticOffDays[employeeUserId] ??
      (Array.isArray(currentOffDays) ? currentOffDays : []);

    const exists = current.includes(day);
    const updated = exists ? current.filter((d) => d !== day) : [...current, day];

    // 1. Synchronously update ref (so rapid subsequent clicks immediately see the latest array)
    offDaysRef.current[employeeUserId] = updated;

    // 2. Instant local optimistic state update (immediate responsive UI)
    setOptimisticOffDays((prev) => ({ ...prev, [employeeUserId]: updated }));

    // 3. Debounce network dispatch by 350ms to consolidate rapid toggles into one single, accurate write
    if (debounceTimersRef.current[employeeUserId]) {
      clearTimeout(debounceTimersRef.current[employeeUserId]);
    }

    const deptId = selectedDeptId;
    debounceTimersRef.current[employeeUserId] = setTimeout(() => {
      delete debounceTimersRef.current[employeeUserId];
      updateRosterOffDaysMutation.mutate({
        departmentId: deptId,
        employeeUserId,
        rosterOffDays: updated,
      });
    }, 350);
  };

  // Change Shift for an Employee with Instant Optimistic UI
  const handleAssignEmployeeShift = async (employeeUserId: string, currentShiftId: string | null, newShiftId: string) => {
    if (!selectedDeptId) return;
    const finalShiftId = newShiftId === "DEFAULT" ? null : newShiftId;

    // 1. Instant local optimistic update
    setOptimisticShifts((prev) => ({ ...prev, [employeeUserId]: finalShiftId }));

    try {
      await updateEmployeeShiftMutation.mutateAsync({
        departmentId: selectedDeptId,
        employeeUserId,
        shiftId: finalShiftId,
      });
    } catch (err) {
      // Revert optimistic update on error
      setOptimisticShifts((prev) => ({ ...prev, [employeeUserId]: currentShiftId }));
      alert(parseApiError(err));
    }
  };

  // Check if department is configured for roster duty
  const isDeptRosterEnabled = Boolean(
    organization?.hasRosterDuty &&
    selectedDept &&
    Array.isArray(organization.rosterDepartmentIds) &&
    organization.rosterDepartmentIds.includes(selectedDept.id)
  );

  const isSaving = createDepartmentMutation.isPending || updateDepartmentMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-700" />
            {isDeptHeadOnly ? "My Department & Shift Requests" : "Departments & Shift Change Requests"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isDeptHeadOnly
              ? "View team members, assign roster off-days, and sanction incoming roster shift change requests."
              : "Organize personnel into functional units, appoint Department Heads, and review roster shift change requests."}
          </p>
        </div>
        {!isDeptHeadOnly && activeMainTab === "DEPARTMENTS" && (
          <Button onClick={openCreateModal} className="h-9 rounded-lg px-4 text-xs font-semibold">
            <Plus className="w-4 h-4" /> Add Department
          </Button>
        )}
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveMainTab("DEPARTMENTS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
            activeMainTab === "DEPARTMENTS"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Departments & Units ({departments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("SHIFT_REQUESTS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition relative ${
            activeMainTab === "SHIFT_REQUESTS"
              ? "bg-purple-700 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Shift Change Requests</span>
          {pendingShiftCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                activeMainTab === "SHIFT_REQUESTS" ? "bg-white text-purple-900" : "bg-rose-500 text-white animate-pulse"
              }`}
            >
              {pendingShiftCount} Pending
            </span>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between gap-2 text-xs text-emerald-900 font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs underline font-normal"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pending Banner inside Departments tab */}
      {activeMainTab === "DEPARTMENTS" && pendingShiftCount > 0 && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-900 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span>
              You have <strong>{pendingShiftCount}</strong> pending roster shift change request(s) awaiting review.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveMainTab("SHIFT_REQUESTS")}
            className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-md text-[11px] shrink-0 transition"
          >
            Review Requests Now →
          </button>
        </div>
      )}

      {/* Departments Grid */}
      {activeMainTab === "DEPARTMENTS" && (
        isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading departments...</div>
      ) : departments.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-lg space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No Departments Created Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create departments such as Engineering, Marketing, HR, or Sales to assign employees and filter rosters.
          </p>
          <Button onClick={openCreateModal} className="h-9 rounded-lg text-xs font-semibold">
            <Plus className="w-4 h-4" /> Create First Department
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const hasRoster =
              organization?.hasRosterDuty &&
              Array.isArray(organization.rosterDepartmentIds) &&
              organization.rosterDepartmentIds.includes(dept.id);

            return (
              <div
                key={dept.id}
                onClick={() => setSelectedDeptId(dept.id)}
                className="group cursor-pointer bg-white border border-slate-200 hover:border-emerald-500/50 hover:shadow-md rounded-lg p-5 transition-all space-y-4 flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition truncate">
                          {dept.name}
                        </h3>
                        {hasRoster && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded font-semibold whitespace-nowrap">
                            Roster Duty
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block">
                        {dept.code}
                      </span>
                    </div>
                    {!isDeptHeadOnly && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => openEditModal(e, dept)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Department"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, dept)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Department Head Preview */}
                  <div className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
                      {dept.headUser?.avatarUrl ? (
                        <Image
                          src={dept.headUser.avatarUrl}
                          alt=""
                          width={28}
                          height={28}
                          unoptimized
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        dept.headUser?.fullName?.charAt(0) || <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Dept Head</p>
                      <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                        {dept.headUser ? dept.headUser.fullName : <span className="text-slate-400 italic">Not Assigned</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {(() => {
                  const activeCount = allEmployees.length > 0
                    ? allEmployees.filter(
                        (e) => !e.isDeleted && e.departmentId === dept.id && attendanceEligibleCodes.includes(e.status)
                      ).length
                    : (dept._count?.users ?? 0);
                  return (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {activeCount} {activeCount === 1 ? "Employee" : "Employees"}
                      </span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        View Details <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      ))}

      {/* VIEW 2: Shift Change Requests */}
      {activeMainTab === "SHIFT_REQUESTS" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <Input
                type="text"
                value={shiftRequestSearch}
                onChange={(e) => setShiftRequestSearch(e.target.value)}
                placeholder="Search by employee name, ID, department, or shift..."
                className="h-9 pl-8 text-xs rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={shiftRequestStatusFilter}
                onValueChange={setShiftRequestStatusFilter}
                triggerClassName="h-9 text-xs w-[180px]"
                options={[
                  { value: "ALL", label: `All Requests (${rosterShiftRequests.length})` },
                  { value: "PENDING", label: `Pending (${pendingShiftCount})` },
                  { value: "APPROVED", label: "Approved" },
                  { value: "REJECTED", label: "Rejected" },
                ]}
              />
            </div>
          </div>

          {/* Shift Requests List */}
          {filteredShiftRequests.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-lg space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-xs">No Shift Change Requests Found</h3>
              <p className="text-[11px] text-slate-400">
                {shiftRequestStatusFilter !== "ALL"
                  ? `No shift change requests with status "${shiftRequestStatusFilter}".`
                  : "Employees on roster duty can submit shift change requests from their portal."}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs divide-y divide-slate-100">
              {filteredShiftRequests.map((req) => {
                const isPending = req.status === "PENDING";
                const isProcessing = processingRequestId === req.id;

                return (
                  <div
                    key={req.id}
                    className="p-4 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-700">
                        {req.user?.avatarUrl ? (
                          <Image
                            src={req.user.avatarUrl}
                            alt=""
                            width={36}
                            height={36}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          req.user?.fullName?.charAt(0) || "U"
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900">{req.user?.fullName}</h4>
                          <span className="text-[10px] font-mono text-slate-400">
                            {req.user?.employeeId}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.2 rounded border border-slate-200">
                            {req.user?.department?.name || "General"}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              req.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : req.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                          <span>
                            Target Shift: <strong className="text-purple-800">{req.targetShift?.shiftName || "Shift"}</strong>{" "}
                            <span className="font-mono text-slate-400">
                              ({req.targetShift?.startTime || "--"} - {req.targetShift?.endTime || "--"})
                            </span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>
                            For Date: <strong className="text-slate-800">{new Date(req.effectiveDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong>
                          </span>
                        </div>

                        {req.reason && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100 italic">
                            Reason: "{req.reason}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    {isPending ? (
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleActionShiftRequest(req.id, "APPROVED", req.user?.fullName)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-xs active:scale-95 transition flex items-center gap-1.5"
                        >
                          {isProcessing ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Accept & Apply</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleActionShiftRequest(req.id, "REJECTED", req.user?.fullName)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-xs active:scale-95 transition flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-right text-[11px] text-slate-400 shrink-0">
                        <span>Resolved</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Department Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingDept ? "Edit Department" : "Add New Department"}
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-semibold text-slate-800">Department Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Engineering, Sales, Human Resources"
                className="mt-1 h-10 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-800">
                Department Code <span className="text-slate-400 font-normal">(Optional — defaults to 3-letters)</span>
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ENG, HR, MKT"
                maxLength={6}
                className="mt-1 h-10 rounded-lg font-mono uppercase"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-10 flex-1 rounded-lg">
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="h-10 flex-1 rounded-lg">
                {isSaving ? "Saving..." : editingDept ? "Save Changes" : "Create Department"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DEPARTMENT DETAILS, HEAD & ROSTER MODAL */}
      <Dialog open={Boolean(selectedDeptId)} onOpenChange={(open) => !open && handleCloseDeptModal()}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-6 rounded-lg bg-white space-y-6">
          {isLoadingDeptDetails || !selectedDept ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading department details & members...</div>
          ) : (
            <div className="space-y-6">
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{selectedDept.name}</h2>
                    <span className="font-mono text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {selectedDept.code}
                    </span>
                    {isDeptRosterEnabled && (
                      <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-bold">
                        Roster Duty Department
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage unit employees, designate Department Head, and set roster duty off-days.
                  </p>
                </div>
              </div>

              {/* Department Head Assignment Card */}
              <div className="p-4 rounded-lg border border-emerald-100 bg-emerald-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Head of Department (In-charge)</h4>
                    <p className="text-[11px] text-slate-500">
                      {isDeptHeadOnly
                        ? "Designated Department Head reviewing leaves and roster off-days."
                        : "The Department Head reviews leave applications and assigns weekly off-days for roster staff."}
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-64">
                  {isDeptHeadOnly ? (
                    // Read-only badge for Dept Head
                    <div className="px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="truncate">
                        {selectedDept.headUser ? `${selectedDept.headUser.fullName} (${selectedDept.headUser.employeeId})` : "Not Assigned"}
                      </span>
                    </div>
                  ) : (
                    // Admin & HR can change Dept Head
                    <Select
                      value={
                        (selectedDeptId && optimisticHeadUserIds[selectedDeptId] !== undefined
                          ? optimisticHeadUserIds[selectedDeptId]
                          : selectedDept.headUserId) || "NONE"
                      }
                      onValueChange={(val) => handleAssignHead(val === "NONE" ? "" : val)}
                      triggerClassName="h-9 text-xs rounded-lg"
                      placeholder="-- Select Department Head --"
                      options={[
                        { value: "NONE", label: "-- No Department Head --" },
                        ...activeDepartmentUsers.map((u) => ({
                          value: u.id,
                          label: `${u.fullName} (${u.employeeId})`,
                        })),
                      ]}
                    />
                  )}
                </div>
              </div>

              {/* Roster Notification Banner */}
              {isDeptRosterEnabled ? (
                <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-lg flex items-start gap-2.5 text-xs text-purple-900">
                  <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Roster Duty Active</p>
                    <p className="text-[11px] text-purple-800 mt-0.5">
                      Employees in this department follow custom weekly off-days. Click on the day buttons below (e.g. Sat, Sun, Mon) to assign or update off-days for each employee.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5 text-xs text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-700">General Fixed Weekend Duty</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      This department uses company-wide standard weekends (
                      {organization?.weekendDays && organization.weekendDays.length > 0
                        ? organization.weekendDays.join(", ")
                        : "Friday"}
                      ). To enable individual roster off-days for this department, activate Roster Duty for it in Organization Settings.
                    </p>
                  </div>
                </div>
              )}

              {/* Department Shift Change Requests Review Section */}
              {isDeptRosterEnabled && (() => {
                const deptRequests = rosterShiftRequests.filter(
                  (r) => r.user?.departmentId === selectedDept.id || r.user?.department?.id === selectedDept.id
                );
                const pendingRequests = deptRequests.filter((r) => r.status === "PENDING");

                if (deptRequests.length === 0) return null;

                return (
                  <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                        <h4 className="text-xs font-bold text-purple-900">
                          Roster Shift Change Requests ({pendingRequests.length} Pending)
                        </h4>
                      </div>
                      <span className="text-[10px] text-purple-700 font-medium">Department Head Review</span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {deptRequests.map((req) => (
                        <div
                          key={req.id}
                          className="bg-white border border-purple-100 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{req.user?.fullName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({req.user?.employeeId})</span>
                              <span
                                className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase ${
                                  req.status === "APPROVED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : req.status === "REJECTED"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {req.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              Target Shift: <span className="font-semibold text-purple-800">{req.targetShift?.shiftName}</span>{" "}
                              <span className="font-mono text-slate-500">({req.targetShift?.startTime} - {req.targetShift?.endTime})</span>
                              {" "}• For Date: <span className="font-bold text-slate-800">{new Date(req.effectiveDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                            </p>
                            {req.reason && (
                              <p className="text-[10px] text-slate-500 italic">"{req.reason}"</p>
                            )}
                          </div>

                          {req.status === "PENDING" && (
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              <button
                                disabled={actionShiftRequestMutation.isPending}
                                onClick={async () => {
                                  try {
                                    await actionShiftRequestMutation.mutateAsync({
                                      id: req.id,
                                      action: "APPROVED",
                                    });
                                    setSuccessMsg(`Approved shift change for ${req.user?.fullName}. Shift updated.`);
                                  } catch (err) {
                                    alert(parseApiError(err));
                                  }
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-md text-[11px] shadow-xs active:scale-95 transition"
                              >
                                Accept
                              </button>
                              <button
                                disabled={actionShiftRequestMutation.isPending}
                                onClick={async () => {
                                  const reason = prompt("Optional rejection reason:") || "";
                                  try {
                                    await actionShiftRequestMutation.mutateAsync({
                                      id: req.id,
                                      action: "REJECTED",
                                      actionNote: reason,
                                    });
                                    setSuccessMsg(`Rejected shift request for ${req.user?.fullName}.`);
                                  } catch (err) {
                                    alert(parseApiError(err));
                                  }
                                }}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-md text-[11px] active:scale-95 transition"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Department Employees List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-500" />
                    Department Personnel ({activeDepartmentUsers.length})
                  </h3>
                </div>

                {activeDepartmentUsers.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-400">
                    No active employees currently assigned to {selectedDept.name}. Assign employees to this department from the Employee Directory.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-800">
                        <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">Employee</th>
                            <th className="py-3 px-4">Designation</th>
                            <th className="py-3 px-4">Shift</th>
                            {isDeptRosterEnabled ? (
                              <th className="py-3 px-4">Weekly Roster Off-Days</th>
                            ) : (
                              <th className="py-3 px-4">Role / Status</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeDepartmentUsers.map((emp) => {
                            const isHead = selectedDept.headUserId === emp.id;
                            const empOffDays = optimisticOffDays[emp.id] ?? (Array.isArray(emp.rosterOffDays) ? emp.rosterOffDays : []);
                            const currentShiftId = optimisticShifts[emp.id] !== undefined ? optimisticShifts[emp.id] : emp.shift?.id || null;

                            const shiftOptions = [
                              { label: "Default Organization Shift", value: "DEFAULT" },
                              ...availableShifts.map((s) => ({
                                label: `${s.shiftName} (${s.startTime} - ${s.endTime})`,
                                value: s.id,
                              })),
                            ];

                            return (
                              <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-700">
                                      {emp.avatarUrl ? (
                                        <Image
                                          src={emp.avatarUrl}
                                          alt=""
                                          width={32}
                                          height={32}
                                          unoptimized
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        emp.fullName?.charAt(0) || "U"
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <p className="font-semibold text-slate-900">{emp.fullName}</p>
                                        {isHead && (
                                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                                            HEAD
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-slate-400 font-mono">{emp.employeeId}</p>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                                  {emp.designation?.name || "—"}
                                </td>

                                <td className="py-3 px-4 min-w-[200px]">
                                  {isDeptRosterEnabled ? (
                                    <Select
                                      value={currentShiftId || "DEFAULT"}
                                      options={shiftOptions}
                                      onValueChange={(val) => handleAssignEmployeeShift(emp.id, emp.shift?.id || null, val)}
                                      className="w-full text-xs"
                                      placeholder="Select shift"
                                    />
                                  ) : emp.shift ? (
                                    <span className="text-slate-700">
                                      {emp.shift.shiftName}{" "}
                                      <span className="text-[10px] text-slate-400">({emp.shift.startTime} - {emp.shift.endTime})</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">Default Shift</span>
                                  )}
                                </td>

                                {isDeptRosterEnabled ? (
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {WEEK_DAYS.map((day) => {
                                        const isSelected = empOffDays.includes(day);
                                        const shortDay = day.slice(0, 3);
                                        return (
                                          <button
                                            key={day}
                                            onClick={() => handleToggleOffDay(emp.id, empOffDays, day)}
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer border ${
                                              isSelected
                                                ? "bg-purple-600 text-white border-purple-600 shadow-xs scale-105"
                                                : "bg-white text-slate-500 hover:bg-slate-100 border-slate-200"
                                            }`}
                                            title={`Toggle ${day} off-duty for ${emp.fullName}`}
                                          >
                                            {shortDay}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </td>
                                ) : (
                                  <td className="py-3 px-4">
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                      {emp.role}
                                    </span>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
