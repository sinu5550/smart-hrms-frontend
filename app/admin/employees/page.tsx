'use client';

import React, { useState } from "react";
import Image from "next/image";
import { Employee, EmploymentStatus } from "@/services/employee.service";
import { parseApiError } from "@/services/api";
import { EmployeeFormDrawer } from "@/components/admin/EmployeeFormDrawer";
import { EmployeeEditModal } from "@/components/admin/EmployeeEditModal";
import { DeleteEmployeeConfirmModal } from "@/components/admin/DeleteEmployeeConfirmModal";
import {
  UserPlus,
  Search,
  Trash2,
  Edit2,
  Clock,
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
  const [targetEditEmployee, setTargetEditEmployee] = useState<Employee | null>(null);
  const [targetDeleteEmployee, setTargetDeleteEmployee] = useState<Employee | null>(null);

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

    return matchesSearch && matchesStatus && matchesDepartment && matchesBlood;
  });

  const handleStatusToggle = async (emp: Employee, newStatus: EmploymentStatus) => {
    try {
      await changeStatusMutation.mutateAsync({ id: emp.id, status: newStatus });
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Employee Directory</h1>
          <p className="text-xs text-slate-800">Total Personnel Count: {employees.length}</p>
        </div>
        <Button
          onClick={() => setIsDrawerOpen(true)}
          className="h-9 rounded-lg px-4 text-xs font-semibold"
        >
          <UserPlus className="w-4 h-4" /> Enlist New Employee
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <Input
            type="text"
            placeholder="Search by name, ID (e.g. EKH-26-0001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-lg pl-9 text-xs"
          />
        </div>

        <Select
          value={departmentFilter}
          onValueChange={setDepartmentFilter}
          triggerClassName="h-9 rounded-lg text-xs"
          options={[
            { value: "ALL", label: "All Departments" },
            ...departments.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />

        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          triggerClassName="h-9 rounded-lg text-xs"
          options={[{value:"ALL",label:"All Statuses"},{value:"ACTIVE",label:"ACTIVE"},{value:"ON_PROBATION",label:"ON PROBATION"},{value:"RESIGNED",label:"RESIGNED"},{value:"TERMINATED",label:"TERMINATED"}]}
        />

        <Select
          value={bloodGroupFilter}
          onValueChange={setBloodGroupFilter}
          triggerClassName="h-9 rounded-lg text-xs"
          options={[{value:"ALL",label:"All Blood Groups"}, ...["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => ({value:bg,label:bg}))]}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-white/80 text-[11px] uppercase font-semibold text-slate-800 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Department / Shift</th>
                <th className="py-3 px-4">Blood</th>
                <th className="py-3 px-4">Employment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading personnel database...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No matching personnel found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition">
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
                ))
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

      {targetDeleteEmployee && (
        <DeleteEmployeeConfirmModal
          employee={targetDeleteEmployee}
          onClose={() => setTargetDeleteEmployee(null)}
          onSuccess={() => setTargetDeleteEmployee(null)}
        />
      )}
    </div>
  );
}
