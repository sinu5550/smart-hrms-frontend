'use client';

import React, { useState } from "react";
import { useShifts, useCreateShift, useUpdateShiftMutation, useDeleteShift } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { parseApiError } from "@/services/api";
import { Shift, CreateShiftPayload, ShiftService } from "@/services/shift.service";
import { Clock, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Users, Check, Timer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ShiftsPage() {
  const queryClient = useQueryClient();
  const { data: shifts = [], isLoading } = useShifts();
  const createShiftMutation = useCreateShift();
  const updateShiftMutation = useUpdateShiftMutation();
  const deleteShiftMutation = useDeleteShift();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  // Overtime Rule Modal State
  const [isOtModalOpen, setIsOtModalOpen] = useState(false);
  const [globalOtBuffer, setGlobalOtBuffer] = useState<number>(30);
  const [isSavingOt, setIsSavingOt] = useState(false);
  const [otError, setOtError] = useState<string | null>(null);

  const [shiftName, setShiftName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(30);
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const openOtModal = () => {
    // Read current threshold from default or first shift
    const defaultOt = shifts.find((s) => s.isDefault)?.overtimeThresholdMins ?? shifts[0]?.overtimeThresholdMins ?? 30;
    setGlobalOtBuffer(defaultOt);
    setOtError(null);
    setIsOtModalOpen(true);
  };

  const handleSaveGlobalOt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOt(true);
    setOtError(null);
    try {
      const res = await ShiftService.setBulkOvertimeThreshold(Number(globalOtBuffer));
      await queryClient.invalidateQueries({ queryKey: ["shifts"] });
      setSuccessMsg(res.message || "Overtime rule updated across all shifts successfully!");
      setIsOtModalOpen(false);
    } catch (err: any) {
      setOtError(parseApiError(err) || "Failed to update overtime threshold.");
    } finally {
      setIsSavingOt(false);
    }
  };

  const openCreateModal = () => {
    setEditingShift(null);
    setShiftName("");
    setStartTime("09:00");
    setEndTime("18:00");
    setGracePeriodMinutes(30);
    setIsDefault(shifts.length === 0);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (shift: Shift) => {
    setEditingShift(shift);
    setShiftName(shift.shiftName);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setGracePeriodMinutes(shift.gracePeriodMinutes);
    setIsDefault(shift.isDefault);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    const payload: CreateShiftPayload = {
      shiftName: shiftName.trim() || "Regular Shift",
      startTime,
      endTime,
      gracePeriodMinutes: Number(gracePeriodMinutes),
      isDefault,
    };

    try {
      if (editingShift) {
        await updateShiftMutation.mutateAsync({ id: editingShift.id, payload });
        setSuccessMsg(`Shift "${payload.shiftName}" updated successfully.`);
      } else {
        await createShiftMutation.mutateAsync(payload);
        setSuccessMsg(`Shift "${payload.shiftName}" created successfully.`);
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(parseApiError(err));
    }
  };

  const handleDelete = async (shift: Shift) => {
    if (shift.isDefault) {
      alert("The default shift cannot be deleted. Designate another shift as default first.");
      return;
    }
    if (!confirm(`Are you sure you want to delete shift "${shift.shiftName}"? Employees in this shift will revert to the default shift.`)) {
      return;
    }
    try {
      await deleteShiftMutation.mutateAsync(shift.id);
      setSuccessMsg(`Shift "${shift.shiftName}" deleted.`);
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  const isSaving = createShiftMutation.isPending || updateShiftMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-700" /> Shift Schedules
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure work timings, grace periods, day/evening shifts, and part-time hours for employees. Total Shifts: <span className="font-bold text-slate-800">{shifts.length}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            onClick={openOtModal}
            variant="outline"
            className="h-9 rounded-lg px-3.5 text-xs font-semibold border-emerald-300 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100/70 hover:text-emerald-900 transition flex items-center gap-2 cursor-pointer shadow-xs"
            title="Configure global overtime threshold buffer for all shifts"
          >
            <Timer className="w-4 h-4 text-emerald-700" />
            <span>Overtime Rules</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white font-mono">
              {shifts.find((s) => s.isDefault)?.overtimeThresholdMins ?? shifts[0]?.overtimeThresholdMins ?? 30}m buffer
            </span>
          </Button>

          <Button onClick={openCreateModal} className="h-9 rounded-lg px-4 text-xs font-semibold">
            <Plus className="w-4 h-4" /> Create New Shift
          </Button>
        </div>
      </div>

      {/* Global Overtime Policy Summary Card */}
      <div className="p-3.5 bg-white border border-slate-200/90 rounded-lg shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>Active Overtime Policy</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Company-wide Active
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Requires full shift duty fulfillment first. Overtime buffer is set to{" "}
              <strong className="text-emerald-700 font-mono font-bold">
                {shifts.find((s) => s.isDefault)?.overtimeThresholdMins ?? shifts[0]?.overtimeThresholdMins ?? 30} minutes
              </strong>{" "}
              (e.g. 40 mins extra with 30m buffer = 10 mins overtime).
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={openOtModal}
          variant="ghost"
          className="h-8 px-3 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg shrink-0 cursor-pointer"
        >
          Change Policy
        </Button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-2 text-xs text-emerald-900 font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Shifts Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading shift schedules...</div>
      ) : shifts.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-lg space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No Shifts Configured</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create standard shifts (e.g. Day Shift 09:00 - 18:00, Evening Shift 14:00 - 22:00, or Part-Time).
          </p>
          <Button onClick={openCreateModal} className="h-9 rounded-lg text-xs font-semibold">
            <Plus className="w-4 h-4" /> Add Shift Schedule
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className={`bg-white border rounded-lg p-5 shadow-xs transition space-y-4 flex flex-col justify-between ${
                shift.isDefault ? "border-emerald-300 ring-1 ring-emerald-500/20" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{shift.shiftName}</h3>
                      {shift.isDefault && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Default
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-xs font-semibold text-slate-700 mt-1">
                      {shift.startTime} &mdash; {shift.endTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(shift)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!shift.isDefault && (
                      <button
                        onClick={() => handleDelete(shift)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <p>
                    Late Grace Period: <span className="font-semibold text-slate-800">{shift.gracePeriodMinutes} mins</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {shift._count?.users ?? 0} {shift._count?.users === 1 ? "Employee" : "Employees"} Assigned
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Shift Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingShift ? "Edit Shift Schedule" : "Create Shift Schedule"}
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
              <label className="text-xs font-semibold text-slate-800">Shift Name *</label>
              <Input
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                placeholder="e.g. Day Shift, Evening Shift, Part-Time Morning"
                className="mt-1 h-10 rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-800">Start Time (24h) *</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 h-10 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-800">End Time (24h) *</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 h-10 rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-800">Late Grace Period (Minutes)</label>
              <Input
                type="number"
                min={0}
                max={120}
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                className="mt-1 h-10 rounded-lg"
                required
              />
              <p className="text-[10px] text-slate-500 mt-1">Arrivals within this grace period are not marked as late.</p>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Set as default shift for new employees</span>
            </label>

            <div className="pt-2 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-10 flex-1 rounded-lg">
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="h-10 flex-1 rounded-lg">
                {isSaving ? "Saving..." : editingShift ? "Save Changes" : "Create Shift"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Global Overtime Rules Modal */}
      <Dialog open={isOtModalOpen} onOpenChange={setIsOtModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Timer className="w-5 h-5 text-emerald-700" />
              <span>Company Overtime Policy</span>
            </DialogTitle>
          </DialogHeader>

          {otError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{otError}</span>
            </div>
          )}

          <form onSubmit={handleSaveGlobalOt} className="space-y-4 mt-2">
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1">
              <p className="text-xs font-bold text-emerald-950">How Overtime is Calculated:</p>
              <ul className="text-[11px] text-emerald-800 space-y-1 list-disc list-inside">
                <li>Employee must fulfill their required shift duty hours first.</li>
                <li>Overtime begins once the threshold buffer is passed.</li>
                <li>This setting automatically updates across all company shifts!</li>
              </ul>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-800">
                Overtime Threshold Buffer (Minutes) *
              </label>
              <Input
                type="number"
                min={0}
                max={300}
                value={globalOtBuffer}
                onChange={(e) => setGlobalOtBuffer(Number(e.target.value))}
                className="mt-1 h-10 rounded-lg font-mono"
                placeholder="30"
                required
              />
              <p className="text-[10px] text-slate-500 mt-1">
                E.g. Set <strong>30</strong> minutes. Extra work beyond shift duty hours will only count as overtime if it exceeds 30 minutes.
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOtModalOpen(false)} className="h-10 flex-1 rounded-lg">
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingOt} className="h-10 flex-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white">
                {isSavingOt ? "Applying..." : "Apply to All Shifts"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
