'use client';

import React, { useState } from "react";
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from "@/hooks";
import { parseApiError } from "@/services/api";
import { Department } from "@/services/department.service";
import { Building2, Plus, Edit2, Trash2, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function DepartmentsPage() {
  const { data: departments = [], isLoading } = useDepartments();
  const createDepartmentMutation = useCreateDepartment();
  const updateDepartmentMutation = useUpdateDepartment();
  const deleteDepartmentMutation = useDeleteDepartment();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingDept(null);
    setName("");
    setCode("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
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

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Are you sure you want to delete department "${dept.name}"? Employees in this department will become unassigned.`)) {
      return;
    }
    try {
      await deleteDepartmentMutation.mutateAsync(dept.id);
      setSuccessMsg(`Department "${dept.name}" deleted.`);
    } catch (err) {
      alert(parseApiError(err));
    }
  };

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
            Organize personnel into functional units. Total Departments: <span className="font-bold text-slate-800">{departments.length}</span>
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
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:border-slate-300 transition space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{dept.name}</h3>
                    <span className="font-mono text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block">
                      {dept.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(dept)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {dept._count?.users ?? 0} {dept._count?.users === 1 ? "Employee" : "Employees"}
                </span>
                <span className="text-[10px] text-slate-400">Unit ID &bull; {dept.id.slice(0, 6)}</span>
              </div>
            </div>
          ))}
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
    </div>
  );
}
