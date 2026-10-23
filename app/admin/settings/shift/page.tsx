'use client';

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useShiftRules, useUpdateShiftRules } from "@/hooks";
import { parseApiError } from "@/services/api";
import { Sliders, Clock, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ShiftConfigurationPage() {
  const { data: shift, isLoading } = useShiftRules();
  const updateShiftMutation = useUpdateShiftRules();

  const { register, handleSubmit, reset } = useForm<any>();

  useEffect(() => {
    if (shift) {
      reset({
        shiftName: shift.shiftName,
        startTime: shift.startTime,
        endTime: shift.endTime,
        gracePeriodMinutes: shift.gracePeriodMinutes,
      });
    }
  }, [shift, reset]);

  const isSubmitting = updateShiftMutation.isPending;

  const onSubmit = async (values: any) => {
    try {
      await updateShiftMutation.mutateAsync({
        ...values,
        gracePeriodMinutes: Number(values.gracePeriodMinutes),
      });
      alert("Shift timings updated successfully! New office hours are active.");
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  if (isLoading) {
    return <div className="p-8 text-xs text-slate-800">Loading shift settings...</div>;
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          Shift Timing & Grace Period Rules <Sliders className="w-5 h-5 text-slate-800" />
        </h1>
        <p className="text-xs text-slate-800 mt-1">
          Dynamically configures what constitutes on-time vs. late attendance across the organization.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-800">Shift Name</label>
            <Input
              {...register("shiftName")}
              className="mt-1 h-10 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-800">Official Shift Start (24hr)</label>
              <Input
                type="text"
                {...register("startTime")}
                placeholder="09:00"
                className="mt-1 h-10 rounded-lg font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Format: HH:mm (e.g. 09:00)</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-800">Official Shift End (24hr)</label>
              <Input
                type="text"
                {...register("endTime")}
                placeholder="18:00"
                className="mt-1 h-10 rounded-lg font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Format: HH:mm (e.g. 18:00)</p>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <label className="text-xs font-semibold text-slate-800">Grace Period (Minutes)</label>
            </div>
            <Input
              type="number"
              {...register("gracePeriodMinutes")}
              className="h-10 rounded-lg font-mono"
            />
            <p className="text-[11px] text-slate-800">
              Arrivals after <span className="text-amber-600 font-semibold">[Shift Start + Grace Period]</span> are
              automatically cataloged as <strong className="text-rose-700">LATE</strong>.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-lg"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Committing Changes..." : "Save Shift Rules"}
          </Button>
        </form>
      </div>
    </div>
  );
}
