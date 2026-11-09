'use client';

import React, { useState, useMemo } from "react";
import {
  Award,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Briefcase,
} from "lucide-react";
import {
  useDesignations,
  useCreateDesignation,
  useUpdateDesignation,
  useDeleteDesignation,
} from "@/hooks";
import { Designation } from "@/services/designation.service";
import { parseApiError } from "@/services/api";

export default function DesignationsManagementPage() {
  const { data: designations = [], isLoading, refetch } = useDesignations();
  const createMutation = useCreateDesignation();
  const updateMutation = useUpdateDesignation();
  const deleteMutation = useDeleteDesignation();

  const [searchQuery, setSearchQuery] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [targetDesignation, setTargetDesignation] = useState<Designation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Designation | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtered designations
  const filteredDesignations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return designations;
    return designations.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.code && d.code.toLowerCase().includes(q))
    );
  }, [designations, searchQuery]);

  // Aggregate stats
  const totalDesignations = designations.length;
  const totalAssignedStaff = useMemo(() => {
    return designations.reduce((acc, d) => acc + (d._count?.users || 0), 0);
  }, [designations]);

  const openCreateModal = () => {
    setModalMode("create");
    setTargetDesignation(null);
    setFormName("");
    setFormCode("");
    setErrorMessage(null);
  };

  const openEditModal = (desig: Designation) => {
    setModalMode("edit");
    setTargetDesignation(desig);
    setFormName(desig.name);
    setFormCode(desig.code || "");
    setErrorMessage(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setTargetDesignation(null);
    setErrorMessage(null);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    // If creating and code is empty or auto-generated, auto-suggest code
    if (modalMode === "create") {
      const words = val.trim().split(/\s+/).filter(Boolean);
      if (words.length > 1) {
        setFormCode(words.map((w) => w[0]).join("").slice(0, 5).toUpperCase());
      } else if (val.trim()) {
        setFormCode(val.trim().replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase());
      } else {
        setFormCode("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const name = formName.trim();
    const code = formCode.trim().toUpperCase();

    if (!name) {
      setErrorMessage("Designation title is required.");
      return;
    }

    try {
      if (modalMode === "create") {
        await createMutation.mutateAsync({ name, code: code || undefined });
      } else if (modalMode === "edit" && targetDesignation) {
        await updateMutation.mutateAsync({
          id: targetDesignation.id,
          payload: { name, code: code || undefined },
        });
      }
      closeModal();
      refetch();
    } catch (err) {
      setErrorMessage(parseApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            Designations &amp; Job Titles
          </h1>
          <p className="text-xs text-slate-500">
            Define company designations, customize corporate titles, and assign to employees during onboarding.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Designation</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Designations</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalDesignations}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Corporate job positions</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Personnel Assigned</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalAssignedStaff}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Active staff holding designations</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by designation name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
          {filteredDesignations.length} of {totalDesignations} Designations
        </span>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Mobile View: Cards */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading designations...</div>
          ) : filteredDesignations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No designations found.</div>
          ) : (
            filteredDesignations.map((desig) => (
              <div key={desig.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{desig.name}</h4>
                    <span className="inline-block mt-0.5 px-2 py-0.5 font-mono text-[10px] font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                      {desig.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(desig)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(desig)}
                      className="p-1.5 text-slate-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    {desig._count?.users || 0} Employees
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Designation Title</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Assigned Workforce</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Loading designations...</td>
                </tr>
              ) : filteredDesignations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No designations found.</td>
                </tr>
              ) : (
                filteredDesignations.map((desig) => (
                  <tr key={desig.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{desig.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {desig.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-bold text-[11px]">
                        {desig.code}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {desig._count?.users || 0} Staff
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {desig.createdAt ? new Date(desig.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(desig)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg text-xs font-semibold transition border border-slate-200 cursor-pointer"
                          title="Edit Designation"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(desig)}
                          className="p-1.5 text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 rounded-lg text-xs font-semibold transition border border-slate-200 cursor-pointer"
                          title="Delete Designation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {modalMode === "create" ? "Add New Designation" : "Edit Designation"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {modalMode === "create" ? "Create a new corporate job position" : `Editing ${targetDesignation?.name}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Software Engineer, Accounts Manager..."
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation Code (Short code)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SSE, MGR, HR..."
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Unique identifier code (e.g. 2-5 characters). Auto-generated if left blank.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : modalMode === "create"
                    ? "Create Designation"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-sm text-slate-900">Delete Designation?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-slate-800">&ldquo;{deleteTarget.name}&rdquo;</span>?
                Any employees holding this designation will remain safe and become unassigned.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-xs disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

