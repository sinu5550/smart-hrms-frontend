'use client';

import React, { useState } from "react";
import {
  useDepartments,
  useDepartmentDetails,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useUpdateEmployeeRosterOffDays,
} from "@/hooks";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import Image from "next/image";

const WEEK_DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function DepartmentsPage() {
  const { data: departments = [], isLoading } = useDepartments();
  const { data: organization } = useOrganization();
  const createDepartmentMutation = useCreateDepartment();
  const updateDepartmentMutation = useUpdateDepartment();
  const deleteDepartmentMutation = useDeleteDepartment();
  const updateRosterOffDaysMutation = useUpdateEmployeeRosterOffDays();

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
    try {
      await updateDepartmentMutation.mutateAsync({
        id: selectedDeptId,
        payload: { headUserId: headUserId || null },
      });
      setSuccessMsg("Department Head updated successfully.");
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  // Toggle Roster Off-Day for an Employee
  const handleToggleOffDay = async (employeeUserId: string, currentOffDays: string[] = [], day: string) => {
    if (!selectedDeptId) return;
    const exists = currentOffDays.includes(day);
    const updated = exists ? currentOffDays.filter((d) => d !== day) : [...currentOffDays, day];

    try {
      await updateRosterOffDaysMutation.mutateAsync({
        departmentId: selectedDeptId,
        employeeUserId,
        rosterOffDays: updated,
      });
    } catch (err) {
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
            <Building2 className="w-5 h-5 text-emerald-700" /> Departments & Units
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize personnel into functional units. Click any department card to manage its members, appoint Head of Department, and assign roster off-days.
          </p>
        </div>
        <Button onClick={openCreateModal} className="h-9 rounded-lg px-4 text-xs font-semibold">
          <Plus className="w-4 h-4" /> Add Department
        </Button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-2 text-xs text-emerald-900 font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Departments Grid */}
      {isLoading ? (
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

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {dept._count?.users ?? 0} {dept._count?.users === 1 ? "Employee" : "Employees"}
                  </span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
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
      <Dialog open={Boolean(selectedDeptId)} onOpenChange={(open) => !open && setSelectedDeptId(null)}>
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
                      The Department Head reviews leave applications and assigns weekly off-days for roster staff.
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-64">
                  <Select
                    value={selectedDept.headUserId || "NONE"}
                    onValueChange={(val) => handleAssignHead(val === "NONE" ? "" : val)}
                    triggerClassName="h-9 text-xs rounded-lg"
                    placeholder="-- Select Department Head --"
                    options={[
                      { value: "NONE", label: "-- No Department Head --" },
                      ...(selectedDept.users || []).map((u) => ({
                        value: u.id,
                        label: `${u.fullName} (${u.employeeId})`,
                      })),
                    ]}
                  />
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

              {/* Department Employees List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-500" />
                    Department Personnel ({selectedDept.users?.length || 0})
                  </h3>
                </div>

                {(!selectedDept.users || selectedDept.users.length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-400">
                    No employees currently assigned to {selectedDept.name}. Assign employees to this department from the Employee Directory.
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
                          {selectedDept.users.map((emp) => {
                            const isHead = selectedDept.headUserId === emp.id;
                            const empOffDays = Array.isArray(emp.rosterOffDays) ? emp.rosterOffDays : [];

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

                                <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                                  {emp.shift ? (
                                    <span>
                                      {emp.shift.shiftName}{" "}
                                      <span className="text-[10px] text-slate-400">({emp.shift.startTime} - {emp.shift.endTime})</span>
                                    </span>
                                  ) : (
                                    "—"
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
                                            disabled={updateRosterOffDaysMutation.isPending}
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition border ${
                                              isSelected
                                                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
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
