'use client';

import React, { useState } from "react";
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useEmployees,
  useUpdateEmployee,
} from "@/hooks";
import { ALL_PERMISSIONS, PermissionDefinition } from "@/config/permissions";
import { useAuth } from "@/components/auth/AuthProvider";
import { parseApiError } from "@/services/api";
import { Employee } from "@/services/employee.service";
import { CustomRole } from "@/services/role.service";
import {
  ShieldCheck,
  User,
  CheckCircle2,
  AlertCircle,
  Save,
  Search,
  Check,
  Key,
  Crown,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Users,
  Layers,
  Shield,
  HelpCircle,
} from "lucide-react";

export default function PermissionsManagementPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"roles" | "users">("roles");

  const isCurrentOwner =
    currentUser?.role === "OWNER" ||
    currentUser?.isOwner ||
    currentUser?.role === "PLATFORM_ADMIN" ||
    (currentUser?.email && currentUser?.organization?.ownerEmail && currentUser.email.toLowerCase() === currentUser.organization.ownerEmail.toLowerCase());
  const currentUserPerms = Array.isArray(currentUser?.permissions) ? currentUser.permissions : [];
  const canManagePermissions = isCurrentOwner || currentUserPerms.includes("employees.permissions");
  const canManageRoles = isCurrentOwner || currentUserPerms.includes("employees.roles");

  // Custom Roles queries & mutations
  const { data: roles = [], isLoading: isLoadingRoles } = useRoles();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  // Employees queries & mutations
  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployees();
  const updateEmployeeMutation = useUpdateEmployee();

  // Role Tab State
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({ id: "", name: "", description: "" });
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [roleActionMessage, setRoleActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // User Tab State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");
  const [selectedUserPermissions, setSelectedUserPermissions] = useState<string[]>([]);
  const [selectedUserRole, setSelectedUserRole] = useState<Employee["role"]>("EMPLOYEE");
  const [selectedUserCustomRoleId, setSelectedUserCustomRoleId] = useState<string>("");
  const [userActionMessage, setUserActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active Role
  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0] || null;

  React.useEffect(() => {
    if (activeRole) {
      setSelectedRoleId(activeRole.id);
      setRolePermissions(activeRole.permissions || []);
    }
  }, [activeRole?.id]);

  // Active Employee
  const activeEmployee = employees.find((e) => e.id === selectedEmployeeId) || employees[0] || null;
  const isOwner = Boolean(activeEmployee?.isOwner);

  React.useEffect(() => {
    if (activeEmployee) {
      setSelectedEmployeeId(activeEmployee.id);
      setSelectedUserRole(activeEmployee.role);
      setSelectedUserCustomRoleId(activeEmployee.customRoleId || "");
      setSelectedUserPermissions(activeEmployee.permissions || []);
    }
  }, [activeEmployee?.id]);

  // Role permission toggles
  const toggleRolePermission = (permId: string) => {
    setRolePermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleRoleSelectCategory = (categoryPermissions: PermissionDefinition[]) => {
    const categoryIds = categoryPermissions.map((p) => p.id);
    const hasAll = categoryIds.every((id) => rolePermissions.includes(id));
    if (hasAll) {
      setRolePermissions((prev) => prev.filter((id) => !categoryIds.includes(id)));
    } else {
      setRolePermissions((prev) => Array.from(new Set([...prev, ...categoryIds])));
    }
  };

  const handleSaveRolePermissions = async () => {
    if (!activeRole) return;
    if (!canManageRoles) {
      setRoleActionMessage({
        type: "error",
        text: "Permission Denied: You do not have 'Manage Roles & Assign Roles' (employees.roles) privilege.",
      });
      return;
    }
    try {
      setRoleActionMessage(null);
      await updateRoleMutation.mutateAsync({
        id: activeRole.id,
        payload: { permissions: rolePermissions },
      });
      setRoleActionMessage({
        type: "success",
        text: `Permissions for role "${activeRole.name}" updated successfully and synced to all assigned members!`,
      });
    } catch (err: any) {
      setRoleActionMessage({ type: "error", text: parseApiError(err) });
    }
  };

  const handleOpenCreateRole = () => {
    if (!canManageRoles) {
      alert("Permission Denied: You do not have 'Manage Roles & Assign Roles' (employees.roles) privilege.");
      return;
    }
    setRoleForm({ id: "", name: "", description: "" });
    setRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: CustomRole) => {
    if (!canManageRoles) {
      alert("Permission Denied: You do not have 'Manage Roles & Assign Roles' (employees.roles) privilege.");
      return;
    }
    setRoleForm({ id: role.id, name: role.name, description: role.description || "" });
    setRoleModalOpen(true);
  };

  const handleSaveRoleMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim()) return;
    if (!canManageRoles) {
      alert("Permission Denied: You do not have 'Manage Roles & Assign Roles' (employees.roles) privilege.");
      return;
    }
    try {
      if (roleForm.id) {
        await updateRoleMutation.mutateAsync({
          id: roleForm.id,
          payload: { name: roleForm.name.trim(), description: roleForm.description.trim() },
        });
      } else {
        const created = await createRoleMutation.mutateAsync({
          name: roleForm.name.trim(),
          description: roleForm.description.trim(),
          permissions: [],
        });
        setSelectedRoleId(created.id);
      }
      setRoleModalOpen(false);
      setRoleActionMessage({
        type: "success",
        text: roleForm.id ? "Role updated successfully!" : "New role created successfully!",
      });
    } catch (err: any) {
      alert(parseApiError(err));
    }
  };

  const handleDeleteRole = async (role: CustomRole) => {
    if (!canManageRoles) {
      alert("Permission Denied: You do not have 'Manage Roles & Assign Roles' (employees.roles) privilege.");
      return;
    }
    if (role._count && role._count.users > 0) {
      alert(`Cannot delete role "${role.name}" because ${role._count.users} employee(s) are assigned to it.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) return;
    try {
      await deleteRoleMutation.mutateAsync(role.id);
      setRoleActionMessage({ type: "success", text: `Role "${role.name}" deleted.` });
    } catch (err: any) {
      alert(parseApiError(err));
    }
  };

  // User tab actions
  const toggleUserPermission = (permId: string) => {
    if (isOwner || !canManagePermissions) return;
    setSelectedUserPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleUserSelectCategory = (categoryPermissions: PermissionDefinition[]) => {
    if (isOwner || !canManagePermissions) return;
    const categoryIds = categoryPermissions.map((p) => p.id);
    const hasAll = categoryIds.every((id) => selectedUserPermissions.includes(id));
    if (hasAll) {
      setSelectedUserPermissions((prev) => prev.filter((id) => !categoryIds.includes(id)));
    } else {
      setSelectedUserPermissions((prev) => Array.from(new Set([...prev, ...categoryIds])));
    }
  };

  const handleAssignCustomRoleToUser = (customRoleId: string) => {
    if (!canManagePermissions) return;
    setSelectedUserCustomRoleId(customRoleId);
    if (customRoleId) {
      const targetRole = roles.find((r) => r.id === customRoleId);
      if (targetRole) {
        // Automatically adopt custom role's permissions
        setSelectedUserPermissions(targetRole.permissions || []);
      }
    }
  };

  const handleSaveUserPermissions = async () => {
    if (!selectedEmployeeId) return;
    if (isOwner) {
      setUserActionMessage({
        type: "error",
        text: "Organization Owner has permanent full access. Role and permissions cannot be edited.",
      });
      return;
    }
    if (!canManagePermissions) {
      setUserActionMessage({
        type: "error",
        text: "Permission Denied: You do not possess the 'Manage Permissions & Access Control' (employees.permissions) privilege.",
      });
      return;
    }
    try {
      setUserActionMessage(null);
      await updateEmployeeMutation.mutateAsync({
        id: selectedEmployeeId,
        payload: {
          role: selectedUserRole,
          customRoleId: selectedUserCustomRoleId || undefined,
          permissions: selectedUserPermissions,
        },
      });
      setUserActionMessage({
        type: "success",
        text: "Access control and role permissions saved successfully!",
      });
    } catch (err: any) {
      setUserActionMessage({ type: "error", text: parseApiError(err) });
    }
  };

  // Categorized permissions
  const categories: Array<PermissionDefinition["category"]> = [
    "Attendance",
    "Employees",
    "Organization & Settings",
    "Biometric & Hardware",
    "Reports & Payroll",
  ];

  const filteredEmployees = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-700" />
            Roles & Permission Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create custom workplace roles, configure role permissions, and sync privileges automatically across all employees.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-lg">
          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeTab === "roles"
                ? "bg-white text-emerald-800 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Role Definitions ({roles.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeTab === "users"
                ? "bg-white text-emerald-800 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Employee Access ({employees.length})</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: ROLE DEFINITIONS & PERMISSIONS ================= */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Roles List */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3 flex flex-col h-[660px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Workplace Roles</span>
              <button
                onClick={handleOpenCreateRole}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Role</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isLoadingRoles ? (
                <p className="text-center py-8 text-xs text-slate-400">Loading roles...</p>
              ) : roles.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <Shield className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">No custom roles created yet.</p>
                  <button
                    onClick={handleOpenCreateRole}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-emerald-800 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Role</span>
                  </button>
                </div>
              ) : (
                roles.map((role) => {
                  const isSelected = role.id === selectedRoleId;
                  return (
                    <div
                      key={role.id}
                      onClick={() => {
                        setSelectedRoleId(role.id);
                        setRolePermissions(role.permissions || []);
                        setRoleActionMessage(null);
                      }}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition ${
                        isSelected
                          ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-500/20"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{role.name}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {role.description || "Custom permission set"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditRole(role);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded"
                            title="Edit role name & description"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRole(role);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          {role.permissions?.length || 0} permissions
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Users className="w-3 h-3" />
                          {role._count?.users || 0} assigned
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Role Permissions Matrix */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-5 flex flex-col h-[660px]">
            {activeRole ? (
              <>
                {/* Header Info */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900">{activeRole.name}</h2>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {activeRole._count?.users || 0} Members Attached
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {activeRole.description || "Assign permissions below to grant full capabilities to this role."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRolePermissions(ALL_PERMISSIONS.map((p) => p.id))}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition"
                    >
                      Grant Full Access
                    </button>
                    <button
                      onClick={() => setRolePermissions([])}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition"
                    >
                      Revoke All
                    </button>
                  </div>
                </div>

                {roleActionMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                      roleActionMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}
                  >
                    {roleActionMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{roleActionMessage.text}</span>
                  </div>
                )}

                {/* Permissions Matrix */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                  {categories.map((category) => {
                    const catPerms = ALL_PERMISSIONS.filter((p) => p.category === category);
                    const allCatSelected = catPerms.every((p) => rolePermissions.includes(p.id));

                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            {category}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleRoleSelectCategory(catPerms)}
                            className="text-[11px] font-semibold text-emerald-700 hover:underline"
                          >
                            {allCatSelected ? "Deselect Category" : "Select Category"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {catPerms.map((perm) => {
                            const isChecked = rolePermissions.includes(perm.id);
                            return (
                              <label
                                key={perm.id}
                                className={`flex items-start gap-2.5 p-3 rounded-lg border transition cursor-pointer ${
                                  isChecked
                                    ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-500/10"
                                    : "border-slate-200/80 hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleRolePermission(perm.id)}
                                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <div className="space-y-0.5">
                                  <p className="text-xs font-semibold text-slate-800">{perm.name}</p>
                                  <p className="text-[11px] text-slate-500 leading-tight">{perm.description}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Save Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    <span className="font-bold text-slate-800">{rolePermissions.length}</span> of{" "}
                    <span className="font-bold text-slate-800">{ALL_PERMISSIONS.length}</span> permissions active
                  </div>

                  <button
                    onClick={handleSaveRolePermissions}
                    disabled={updateRoleMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 transition shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{updateRoleMutation.isPending ? "Syncing..." : "Save Role Permissions"}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <Shield className="w-12 h-12 text-slate-200" />
                <p className="text-sm font-semibold text-slate-700">No role selected</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Select a role from the left sidebar or create a new one to configure module permissions.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: EMPLOYEE ACCESS & ROLE ASSIGNMENT ================= */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Employee Selector List */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3 flex flex-col h-[660px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Select Employee</span>
              <span className="text-[11px] text-slate-400 font-semibold">{employees.length} Members</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Filter by name or ID..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none bg-slate-50/50"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {isLoadingEmployees ? (
                <p className="text-center py-8 text-xs text-slate-400">Loading roster...</p>
              ) : filteredEmployees.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">No employees match.</p>
              ) : (
                filteredEmployees.map((emp) => {
                  const isSelected = emp.id === selectedEmployeeId;
                  return (
                    <button
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployeeId(emp.id);
                        setSelectedUserRole(emp.role);
                        setSelectedUserCustomRoleId(emp.customRoleId || "");
                        setSelectedUserPermissions(emp.permissions || []);
                        setUserActionMessage(null);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition border ${
                        isSelected
                          ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-500/20"
                          : "border-transparent hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{emp.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{emp.employeeId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {emp.isOwner ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-xs">
                            <Crown className="w-2.5 h-2.5 text-amber-700" />
                            OWNER
                          </span>
                        ) : (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              emp.role === "ADMIN"
                                ? "bg-slate-900 text-white"
                                : emp.role === "HR"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {emp.customRole?.name || emp.role}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: User Access Assignment Panel */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-5 flex flex-col h-[660px]">
            {activeEmployee ? (
              <>
                {/* Employee Overview & Role Selector */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg text-white flex items-center justify-center font-bold text-sm shrink-0 ${
                        isOwner ? "bg-amber-600 shadow-sm" : "bg-emerald-700"
                      }`}
                    >
                      {isOwner ? <Crown className="w-5 h-5 text-white" /> : activeEmployee.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900">{activeEmployee.fullName}</h2>
                        {isOwner && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-700" /> Workspace Owner
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-mono">
                        {activeEmployee.employeeId} &bull; {activeEmployee.email}
                      </p>
                    </div>
                  </div>

                  {/* Role Selectors */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Custom Role Preset Dropdown */}
                    {!isOwner && (
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-semibold text-slate-600 shrink-0">Role Preset:</label>
                        <select
                          value={selectedUserCustomRoleId}
                          onChange={(e) => handleAssignCustomRoleToUser(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-emerald-600 shadow-xs"
                        >
                          <option value="">Custom Individual Access</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} ({r.permissions?.length || 0} perms)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* System Role */}
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-semibold text-slate-600 shrink-0">System Tier:</label>
                      {isOwner ? (
                        <span className="px-3 py-1.5 rounded-lg border border-amber-300 text-xs font-bold text-amber-900 bg-amber-50">
                          OWNER (Full Privilege)
                        </span>
                      ) : (
                        <select
                          value={selectedUserRole}
                          onChange={(e) => setSelectedUserRole(e.target.value as Employee["role"])}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-emerald-600 shadow-xs"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="HR">HR</option>
                          <option value="EMPLOYEE">EMPLOYEE</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {userActionMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                      userActionMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}
                  >
                    {userActionMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{userActionMessage.text}</span>
                  </div>
                )}

                {/* Permissions Matrix */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                  {categories.map((category) => {
                    const catPerms = ALL_PERMISSIONS.filter((p) => p.category === category);
                    const allCatSelected = isOwner || catPerms.every((p) => selectedUserPermissions.includes(p.id));

                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            {category}
                          </h3>
                          {!isOwner && (
                            <button
                              type="button"
                              onClick={() => handleUserSelectCategory(catPerms)}
                              className="text-[11px] font-semibold text-emerald-700 hover:underline"
                            >
                              {allCatSelected ? "Deselect Category" : "Select Category"}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {catPerms.map((perm) => {
                            const isChecked = isOwner || selectedUserPermissions.includes(perm.id);
                            return (
                              <label
                                key={perm.id}
                                className={`flex items-start gap-2.5 p-3 rounded-lg border transition ${
                                  isOwner
                                    ? "bg-amber-50/30 border-amber-200/80 cursor-not-allowed opacity-90"
                                    : isChecked
                                    ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-500/10 cursor-pointer"
                                    : "border-slate-200/80 hover:bg-slate-50 cursor-pointer"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isOwner}
                                  onChange={() => toggleUserPermission(perm.id)}
                                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-60"
                                />
                                <div className="space-y-0.5">
                                  <p className="text-xs font-semibold text-slate-800">{perm.name}</p>
                                  <p className="text-[11px] text-slate-500 leading-tight">{perm.description}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    <span className="font-bold text-slate-800">
                      {isOwner ? ALL_PERMISSIONS.length : selectedUserPermissions.length}
                    </span>{" "}
                    of <span className="font-bold text-slate-800">{ALL_PERMISSIONS.length}</span> permissions granted
                  </div>

                  <div className="flex items-center gap-2">
                    {!isOwner && (
                      <button
                        type="button"
                        onClick={() => setSelectedUserPermissions(ALL_PERMISSIONS.map((p) => p.id))}
                        className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition"
                      >
                        Grant Full Access
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveUserPermissions}
                      disabled={updateEmployeeMutation.isPending || isOwner}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 transition shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{updateEmployeeMutation.isPending ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <User className="w-12 h-12 text-slate-200" />
                <p className="text-sm font-semibold text-slate-700">No employee selected</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Select an employee from the roster on the left to configure their custom roles and module access.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= ROLE CREATE / EDIT MODAL ================= */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {roleForm.id ? "Edit Workplace Role" : "Create New Workplace Role"}
              </h3>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveRoleMeta} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Role Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Accountant, Shift Manager, Line Supervisor"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what responsibilities this role handles..."
                  value={roleForm.description}
                  onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition shadow-sm"
                >
                  {createRoleMutation.isPending || updateRoleMutation.isPending
                    ? "Saving..."
                    : roleForm.id
                    ? "Update Role"
                    : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
