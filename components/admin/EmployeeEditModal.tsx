'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Employee, EmploymentStatus } from "@/services/employee.service";
import { CloudinaryService } from "@/services/cloudinary.service";
import { useUpdateEmployee, useDepartments, useShifts, useRoles } from "@/hooks";
import { parseApiError } from "@/services/api";
import { X, Upload, Check, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/shared/ScrollArea";
import { PhoneInputWithCountry } from "@/components/shared/PhoneInputWithCountry";

const editEmployeeSchema = z.object({
  employeeId: z.string().optional(),
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid business email"),
  phone: z.string().min(10, "Phone number must be at least 10-11 digits"),
  departmentId: z.string().optional(),
  shiftId: z.string().optional(),
  customRoleId: z.string().optional(),
  bloodGroup: z.string().optional(),
  presentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
});

type EditFormData = z.infer<typeof editEmployeeSchema>;

interface Props {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmployeeEditModal: React.FC<Props> = ({ employee, isOpen, onClose, onSuccess }) => {
  const { data: departments = [] } = useDepartments();
  const { data: shifts = [] } = useShifts();
  const { data: roles = [] } = useRoles();
  const updateEmployeeMutation = useUpdateEmployee();

  const [departmentIdValue, setDepartmentIdValue] = useState<string>("");
  const [shiftIdValue, setShiftIdValue] = useState<string>("");
  const [customRoleIdValue, setCustomRoleIdValue] = useState<string>("");
  const [bloodGroupValue, setBloodGroupValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
    reset,
  } = useForm<EditFormData>({
    resolver: zodResolver(editEmployeeSchema),
  });

  useEffect(() => {
    if (employee && isOpen) {
      reset({
        employeeId: employee.employeeId || "",
        fullName: employee.fullName || "",
        email: employee.email || "",
        phone: employee.phone || "",
        departmentId: employee.departmentId || "",
        shiftId: employee.shiftId || "",
        customRoleId: employee.customRoleId || "",
        bloodGroup: employee.bloodGroup || "",
        presentAddress: (employee as any).presentAddress || "",
        permanentAddress: (employee as any).permanentAddress || "",
        emergencyContactName: (employee as any).emergencyContactName || "",
        emergencyContactPhone: (employee as any).emergencyContactPhone || "",
        emergencyContactRelation: (employee as any).emergencyContactRelation || "",
      });
      setDepartmentIdValue(employee.departmentId || "");
      setShiftIdValue(employee.shiftId || "");
      setCustomRoleIdValue(employee.customRoleId || "");
      setBloodGroupValue(employee.bloodGroup || "");
      setPhoneValue(employee.phone || "");
      setAvatarPreview(employee.avatarUrl || null);
      setAvatarFile(null);
      setFormError(null);
    }
  }, [employee, isOpen, reset]);

  if (!isOpen || !employee) return null;

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("File size exceeds 3MB limit.");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: EditFormData) => {
    setFormError(null);
    try {
      let avatarUrl = employee.avatarUrl;
      if (avatarFile) {
        try {
          avatarUrl = await CloudinaryService.uploadImage(avatarFile, "hrms/employee-avatars");
        } catch (uploadErr) {
          console.warn("Avatar upload failed:", uploadErr);
        }
      }

      await updateEmployeeMutation.mutateAsync({
        id: employee.id,
        payload: {
          ...data,
          departmentId: departmentIdValue || undefined,
          shiftId: shiftIdValue || undefined,
          customRoleId: customRoleIdValue || undefined,
          bloodGroup: bloodGroupValue || undefined,
          avatarUrl: avatarUrl || undefined,
        },
      });

      onSuccess();
    } catch (err) {
      const errorMessage = parseApiError(err);
      const lower = errorMessage.toLowerCase();
      if (lower.includes("employee id") || lower.includes("employeeid")) {
        setError("employeeId", { message: errorMessage });
      } else if (lower.includes("email")) {
        setError("email", { message: errorMessage });
      } else if (lower.includes("phone")) {
        setError("phone", { message: errorMessage });
      } else {
        setFormError(errorMessage);
      }
    }
  };

  const isSaving = updateEmployeeMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-2xl max-h-[90vh] flex flex-col p-0 rounded-lg overflow-hidden shadow-xl border border-slate-200 bg-white">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800">
              Edit Employee &bull; <span className="font-mono text-emerald-700">{employee.employeeId}</span>
            </DialogTitle>
          </DialogHeader>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-5 space-y-6">
          <form id="edit-employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-lg">
              <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Preview" width={64} height={64} unoptimized className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-800 cursor-pointer hover:underline">
                  Change Profile Picture
                  <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                </label>
                <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, or WEBP up to 3MB</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-800">
                    Employee ID (Work / Terminal ID)
                  </label>
                  <Input
                    value={employee.employeeId || ""}
                    disabled
                    readOnly
                    className="mt-1 h-10 rounded-lg font-mono font-bold text-slate-600 bg-slate-100 cursor-not-allowed select-none border-slate-200"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Employee ID cannot be edited because biometric templates on hardware are anchored to this ID.
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-800">Full Legal Name *</label>
                  <Input {...register("fullName")} className="mt-1 h-10 rounded-lg" />
                  {errors.fullName && <p className="text-[10px] text-rose-700 mt-1">{errors.fullName.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-800">Work Email *</label>
                  <Input {...register("email")} className="mt-1 h-10 rounded-lg" />
                  {errors.email && <p className="text-[10px] text-rose-700 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <PhoneInputWithCountry
                    value={phoneValue}
                    onChange={(val, isValid) => {
                      setPhoneValue(val);
                      setValue("phone", val);
                      if (val && !isValid) {
                        setError("phone", { message: "Invalid phone number for selected country." });
                      } else {
                        clearErrors("phone");
                      }
                    }}
                    error={errors.phone?.message}
                  />
                </div>
              </div>

              {roles.length > 0 && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-800 flex items-center justify-between">
                    <span>Workplace Role Preset <span className="text-slate-400 font-normal">(Auto-syncs permissions)</span></span>
                  </label>
                  <Select
                    value={customRoleIdValue || undefined}
                    onValueChange={(value) => {
                      setCustomRoleIdValue(value);
                      setValue("customRoleId", value);
                    }}
                    triggerClassName="mt-1 h-10 rounded-lg"
                    placeholder="Select Role Preset"
                    options={[
                      { value: "", label: "No Custom Preset" },
                      ...roles.map((r: any) => ({ value: r.id, label: `${r.name} (${r.permissions?.length || 0} permissions)` })),
                    ]}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-800">Department</label>
                  <Select
                    value={departmentIdValue || undefined}
                    onValueChange={(value) => {
                      setDepartmentIdValue(value);
                      setValue("departmentId", value);
                    }}
                    triggerClassName="mt-1 h-10 rounded-lg"
                    placeholder="Select Department"
                    options={[
                      { value: "", label: "No Department" },
                      ...departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
                    ]}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-800">Office Shift</label>
                  <Select
                    value={shiftIdValue || undefined}
                    onValueChange={(value) => {
                      setShiftIdValue(value);
                      setValue("shiftId", value);
                    }}
                    triggerClassName="mt-1 h-10 rounded-lg"
                    placeholder="Select Shift"
                    options={[
                      { value: "", label: "Default Office Shift" },
                      ...shifts.map((s) => ({
                        value: s.id,
                        label: `${s.shiftName} (${s.startTime} - ${s.endTime})${s.isDefault ? " [Default]" : ""}`,
                      })),
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-800">Blood Group</label>
                <Select
                  value={bloodGroupValue || undefined}
                  onValueChange={(value) => {
                    setBloodGroupValue(value);
                    setValue("bloodGroup", value);
                  }}
                  triggerClassName="mt-1 h-10 rounded-lg"
                  placeholder="Select blood group"
                  options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => ({ value: bg, label: bg }))}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-800">Present Address</label>
                  <Textarea {...register("presentAddress")} rows={2} className="mt-1 rounded-lg" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-800">Permanent Address</label>
                  <Textarea {...register("permanentAddress")} rows={2} className="mt-1 rounded-lg" />
                </div>
              </div>

              <div className="p-3 bg-white/60 border border-slate-200 rounded-lg space-y-3">
                <p className="text-[11px] font-bold text-slate-800">Emergency Contact</p>
                <div className="grid grid-cols-3 gap-2">
                  <Input {...register("emergencyContactName")} placeholder="Name" className="h-9 rounded-lg px-2.5 text-xs" />
                  <Input {...register("emergencyContactPhone")} placeholder="Phone" className="h-9 rounded-lg px-2.5 text-xs" />
                  <Input {...register("emergencyContactRelation")} placeholder="Relation" className="h-9 rounded-lg px-2.5 text-xs" />
                </div>
              </div>
            </div>
          </form>
        </ScrollArea>

        <div className="px-5 py-3.5 border-t border-slate-100 flex gap-2 shrink-0 bg-slate-50/50">
          <Button onClick={onClose} type="button" variant="outline" className="h-10 flex-1 rounded-lg">
            Cancel
          </Button>
          <Button form="edit-employee-form" type="submit" disabled={isSaving} className="h-10 flex-1 rounded-lg">
            {isSaving ? "Saving Changes..." : "Save Details"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
