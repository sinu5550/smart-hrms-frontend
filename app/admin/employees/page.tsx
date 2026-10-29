'use client';

import React, { useState } from "react";
import Image from "next/image";
import { Employee, EmploymentStatus } from "@/services/employee.service";
import { parseApiError } from "@/services/api";
import { EmployeeFormDrawer } from "@/components/admin/EmployeeFormDrawer";
import { EmployeeEditModal } from "@/components/admin/EmployeeEditModal";
import { DeleteEmployeeConfirmModal } from "@/components/admin/DeleteEmployeeConfirmModal";
import { BulkImportModal } from "@/components/admin/BulkImportModal";
import { BulkDeleteEmployeesModal } from "@/components/admin/BulkDeleteEmployeesModal";
import {
  UserPlus,
  Search,
  Trash2,
  Edit2,
  Clock,
  UploadCloud,
  CheckSquare,
  Square,
  MinusSquare,
  Fingerprint,
  ScanFace,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEmployees, useChangeEmployeeStatus, useOrganization, useDepartments } from "@/hooks";

export default function EmployeesDirectoryPage() {
  const { user: currentUser } = useAuth();
  const { data: orgData } = useOrganization();
  const ownerEmail = orgData?.ownerEmail?.toLowerCase();

  const { data: employees = [], isLoading } = useEmployees();
  const { data: departments = [] } = useDepartments();
  const changeStatusMutation = useChangeEmployeeStatus();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>("ALL");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [targetEditEmployee, setTargetEditEmployee] = useState<Employee | null>(null);
  const [targetDeleteEmployee, setTargetDeleteEmployee] = useState<Employee | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (emp.fullName || "").toLowerCase().includes(q) ||
      (emp.employeeId || "").toLowerCase().includes(q) ||
      (emp.email || "").toLowerCase().includes(q) ||
      (emp.phone || "").toLowerCase().includes(q);

    const matchesStatus = statusFilter === "ALL" || emp.status === statusFilter;
    const matchesDepartment = departmentFilter === "ALL" || emp.departmentId === departmentFilter;
    const matchesBlood = bloodGroupFilter === "ALL" || emp.bloodGroup === bloodGroupFilter;
    const isOwner = Boolean(ownerEmail && emp.email?.toLowerCase() === ownerEmail);

    return !isOwner && matchesSearch && matchesStatus && matchesDepartment && matchesBlood;
  });

  // Select all or deselect helpers
  const allSelectableIds = filteredEmployees.map((e) => e.id);
  const isAllSelected = allSelectableIds.length > 0 && allSelectableIds.every((id) => selectedIds.includes(id));
  const isPartiallySelected = selectedIds.length > 0 && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allSelectableIds);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedEmployeeObjects = employees.filter((e) => selectedIds.includes(e.id));

  const handleStatusToggle = async (emp: Employee, newStatus: EmploymentStatus) => {
    try {
      await changeStatusMutation.mutateAsync({ id: emp.id, status: newStatus });
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  return (
    <div className="flex-1 md:h-full flex flex-col md:min-h-0 gap-4 md:overflow-hidden">
      {/* Top Header Row - Fixed/Sticky */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Employee Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total Personnel Count: {employees.length}
            {selectedIds.length > 0 && (
              <span className="ml-2 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {selectedIds.length} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="h-9 rounded-lg px-3.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-xs transition"
            >
              <Trash2 className="w-4 h-4" /> Bulk Delete ({selectedIds.length})
            </Button>
          )}
          <Button
            onClick={() => setIsBulkModalOpen(true)}
            variant="outline"
            className="h-9 rounded-lg px-3.5 text-xs font-semibold flex items-center gap-1.5 border-slate-200"
          >
            <UploadCloud className="w-4 h-4 text-emerald-700" /> Bulk Import
          </Button>
          <Button
            onClick={() => setIsDrawerOpen(true)}
            className="h-9 rounded-lg px-4 text-xs font-semibold"
          >
            <UserPlus className="w-4 h-4" /> Enlist New Employee
          </Button>
        </div>
      </div>

      {/* Filters Bar - Fixed/Sticky */}
      <div className="shrink-0 grid grid-cols-1 md:grid-cols-5 gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative md:col-span-2">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by name, ID (e.g. EKH-26-0001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 rounded-lg pl-8 text-[12px]"
          />
        </div>

        <Select
          value={departmentFilter}
          onValueChange={setDepartmentFilter}
          triggerClassName="h-8 text-[12px]"
          options={[
            { value: "ALL", label: "All Departments" },
            ...departments.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />

        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          triggerClassName="h-8 text-[12px]"
          options={[{value:"ALL",label:"All Statuses"},{value:"ACTIVE",label:"ACTIVE"},{value:"ON_PROBATION",label:"ON PROBATION"},{value:"RESIGNED",label:"RESIGNED"},{value:"TERMINATED",label:"TERMINATED"}]}
        />

        <Select
          value={bloodGroupFilter}
          onValueChange={setBloodGroupFilter}
          triggerClassName="h-8 text-[12px]"
          options={[{value:"ALL",label:"All Blood Groups"}, ...["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => ({value:bg,label:bg}))]}
        />
      </div>

      {/* Employee List Container - Only this table body scrolls with hidden scrollbar */}
      <div className="flex-1 md:min-h-0 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs flex flex-col">
        {/* Mobile View: Standalone Rounded App Cards */}
        <div className="sm:hidden p-3 space-y-3 bg-slate-50/60">
          {/* Select all bar for mobile */}
          {filteredEmployees.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
                <span>Select All ({filteredEmployees.length})</span>
              </label>
              {selectedIds.length > 0 && (
                <span className="text-[11px] font-bold text-rose-700">
                  {selectedIds.length} Selected
                </span>
              )}
            </div>
          )}

          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="p-3.5 space-y-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-slate-200/80 animate-pulse shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-32 bg-slate-200/80 rounded animate-pulse" />
                        <div className="h-2.5 w-24 bg-slate-200/60 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-6 w-14 bg-slate-200/80 rounded-lg animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="h-3.5 w-20 bg-slate-200/60 rounded animate-pulse" />
                    <div className="h-7 w-24 bg-slate-200/80 rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              No matching personnel found.
            </div>
          ) : (
            filteredEmployees.map((emp) => {
              const isChecked = selectedIds.includes(emp.id);
              return (
                <div
                  key={emp.id}
                  className={`p-3.5 space-y-3 rounded-xl border transition ${
                    isChecked ? "border-rose-300 bg-rose-50/20 shadow-xs" : "border-slate-200/90 bg-white shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectOne(emp.id)}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4 shrink-0"
                      />
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-700">
                        {emp.avatarUrl ? (
                          <Image src={emp.avatarUrl} alt="" width={40} height={40} unoptimized className="w-full h-full object-cover" />
                        ) : (
                          emp.fullName.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{emp.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{emp.phone || emp.email}</p>
                        <span className="inline-block mt-0.5 font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                          {emp.employeeId}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setTargetEditEmployee(emp)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 active:bg-emerald-100 transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {emp.email.toLowerCase() === ownerEmail ? (
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Owner</span>
                      ) : (
                        <button
                          onClick={() => setTargetDeleteEmployee(emp)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 active:bg-rose-100 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
                      <span className="font-semibold text-slate-700 truncate">{emp.department?.name || "No Dept"}</span>
                      {emp.bloodGroup && (
                        <span className="shrink-0 px-1.5 py-0.2 rounded font-bold text-[9px] bg-rose-50 border border-rose-200 text-rose-700">
                          {emp.bloodGroup}
                        </span>
                      )}
                    </div>
                    <div className="shrink-0">
                      {emp.email.toLowerCase() === ownerEmail ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ACTIVE
                        </span>
                      ) : (
                        <Select
                          value={emp.status}
                          onValueChange={(value) => handleStatusToggle(emp, value as EmploymentStatus)}
                          triggerClassName={`h-7 w-28 text-[10px] font-bold rounded-md border ${
                            emp.status === "ACTIVE"
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                              : emp.status === "ON_PROBATION"
                              ? "bg-amber-50 border-amber-300 text-amber-800"
                              : "bg-rose-50 border-rose-300 text-rose-800"
                          }`}
                          options={[{value:"ACTIVE",label:"ACTIVE"},{value:"ON_PROBATION",label:"PROBATION"},{value:"RESIGNED",label:"RESIGNED"},{value:"TERMINATED",label:"TERMINATED"}]}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table with Sticky Header, sleek scrollbar and prominent row lines */}
        <div className="hidden sm:block flex-1 min-h-0 overflow-y-auto overflow-x-auto table-scrollbar">
          <table className="w-full text-left text-xs text-slate-800 border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-100 text-[11px] uppercase font-bold text-slate-700 shadow-xs border-b border-slate-300">
              <tr>
                <th className="py-3 px-4 w-10 bg-slate-100 border-b border-slate-200">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    disabled={filteredEmployees.length === 0}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                    title="Select All"
                  />
                </th>
                <th className="py-3 px-4 bg-slate-100 border-b border-slate-200">Employee</th>
                <th className="py-3 px-4 bg-slate-100 border-b border-slate-200">Employee ID</th>
                <th className="py-3 px-4 text-center bg-slate-100 border-b border-slate-200">Biometrics</th>
                <th className="py-3 px-4 bg-slate-100 border-b border-slate-200">Department / Shift</th>
                <th className="py-3 px-4 bg-slate-100 border-b border-slate-200">Blood</th>
                <th className="py-3 px-4 bg-slate-100 border-b border-slate-200">Employment Status</th>
                <th className="py-3 px-4 text-right bg-slate-100 border-b border-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <tr key={n} className="border-b border-slate-100">
                      <td className="py-3 px-4"><div className="h-4 w-4 bg-slate-200/70 rounded animate-pulse" /></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200/80 animate-pulse shrink-0" />
                          <div className="space-y-1">
                            <div className="h-3.5 w-28 bg-slate-200/80 rounded animate-pulse" />
                            <div className="h-2.5 w-20 bg-slate-200/60 rounded animate-pulse" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><div className="h-5 w-24 bg-slate-200/70 rounded animate-pulse" /></td>
                      <td className="py-3 px-4 text-center"><div className="h-5 w-14 mx-auto bg-slate-200/70 rounded animate-pulse" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-32 bg-slate-200/70 rounded animate-pulse" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-10 bg-slate-200/70 rounded animate-pulse" /></td>
                      <td className="py-3 px-4"><div className="h-7 w-28 bg-slate-200/70 rounded-lg animate-pulse" /></td>
                      <td className="py-3 px-4 text-right"><div className="h-6 w-14 ml-auto bg-slate-200/70 rounded animate-pulse" /></td>
                    </tr>
                  ))}
                </>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No matching personnel found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const isChecked = selectedIds.includes(emp.id);
                  return (
                    <tr
                      key={emp.id}
                      className={`transition border-b border-slate-200 ${isChecked ? "bg-rose-50/30 hover:bg-rose-50/50" : "hover:bg-slate-50"}`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(emp.id)}
                          className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-800">
                            {emp.avatarUrl ? (
                              <Image src={emp.avatarUrl} alt="" width={32} height={32} unoptimized className="w-full h-full object-cover" />
                            ) : (
                              emp.fullName.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{emp.fullName}</p>
                            <p className="text-[10px] text-slate-500">{emp.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800 font-medium">
                          {emp.employeeId}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const perms = Array.isArray(emp.permissions) ? emp.permissions : [];
                          const hasFP = perms.includes("bio:fingerprint");
                          const hasFace = perms.includes("bio:face");
                          return (
                            <div className="inline-flex items-center gap-1.5 justify-center">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-lg border transition ${
                                  hasFP
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                    : "bg-slate-100 text-slate-300 border-slate-200"
                                }`}
                                title={hasFP ? "Fingerprint Registered on Hardware" : "No Fingerprint Enrolled"}
                              >
                                <Fingerprint className="w-3.5 h-3.5" />
                              </span>
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-lg border transition ${
                                  hasFace
                                    ? "bg-purple-50 text-purple-700 border-purple-300"
                                    : "bg-slate-100 text-slate-300 border-slate-200"
                                }`}
                                title={hasFace ? "Face Recognition Registered on Hardware" : "No Face Enrolled"}
                              >
                                <ScanFace className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{emp.department?.name || "Unassigned"}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {emp.shift ? `${emp.shift.shiftName} (${emp.shift.startTime} - ${emp.shift.endTime})` : "Default Shift"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        {emp.bloodGroup ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-700">
                            {emp.bloodGroup}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {emp.email.toLowerCase() === ownerEmail ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-amber-100 border border-amber-300 text-amber-900" title="Organization Owner status is permanent">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                            OWNER (ACTIVE)
                          </span>
                        ) : (
                          <Select
                            value={emp.status}
                            onValueChange={(value) => handleStatusToggle(emp, value as EmploymentStatus)}
                            triggerClassName={`h-8 w-36 text-[11px] font-bold rounded-lg border transition ${
                              emp.status === "ACTIVE"
                                ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                                : emp.status === "ON_PROBATION"
                                ? "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
                                : "bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100"
                            }`}
                            options={[{value:"ACTIVE",label:"ACTIVE"},{value:"ON_PROBATION",label:"ON PROBATION"},{value:"RESIGNED",label:"RESIGNED"},{value:"TERMINATED",label:"TERMINATED"}]}
                          />
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setTargetEditEmployee(emp)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition"
                            title="Edit Employee Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {emp.email.toLowerCase() === ownerEmail ? (
                            <span className="text-[10px] font-medium text-slate-400 italic px-1">Protected</span>
                          ) : (
                            <button
                              onClick={() => setTargetDeleteEmployee(emp)}
                              className="p-1.5 text-slate-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition"
                              title="Soft Delete Employee"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EmployeeFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => setIsDrawerOpen(false)}
      />

      <EmployeeEditModal
        employee={targetEditEmployee}
        isOpen={Boolean(targetEditEmployee)}
        onClose={() => setTargetEditEmployee(null)}
        onSuccess={() => setTargetEditEmployee(null)}
      />

      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
      />

      {targetDeleteEmployee && (
        <DeleteEmployeeConfirmModal
          employee={targetDeleteEmployee}
          onClose={() => setTargetDeleteEmployee(null)}
          onSuccess={() => setTargetDeleteEmployee(null)}
        />
      )}

      {isBulkDeleteModalOpen && selectedEmployeeObjects.length > 0 && (
        <BulkDeleteEmployeesModal
          selectedEmployees={selectedEmployeeObjects}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onSuccess={() => {
            setIsBulkDeleteModalOpen(false);
            setSelectedIds([]);
          }}
        />
      )}
    </div>
  );
}
