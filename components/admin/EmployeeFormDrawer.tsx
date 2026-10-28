'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { EmployeeService } from "@/services/employee.service";
import { CloudinaryService } from "@/services/cloudinary.service";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCreateEmployee, useUpdateEmployee, useOrganization, useNextEmployeeId, useDepartments, useShifts, useRoles } from "@/hooks";
import { CustomRole } from "@/services/role.service";
import { parseApiError } from "@/services/api";
import { X, Upload, Check, Copy, Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle, HelpCircle, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/shared/ScrollArea";
import { PhoneInputWithCountry } from "@/components/shared/PhoneInputWithCountry";

const createEmployeeSchema = (expectedPrefix: string) => {
  const normPrefix = (expectedPrefix || "EKH").trim().toUpperCase();
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const regex = new RegExp(`^${normPrefix}-\\d{2}-\\d+$`);

  return z.object({
    employeeId: z
      .string()
      .trim()
      .toUpperCase()
      .refine(
        (val) => regex.test(val),
        {
          message: `ID must start with your organization prefix '${normPrefix}' and format: ${normPrefix}-${currentYear}-0001 (or numeric serial).`,
        }
      ),
    fullName: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid business email"),
    phone: z.string().min(10, "Phone number must be at least 10-11 digits"),
    role: z.enum(["EMPLOYEE", "HR", "ADMIN"]),
    password: z.string().optional().refine((val) => !val || val.length >= 6, {
      message: "Password must be at least 6 characters if specified",
    }),
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
};

type EmployeeFormData = z.infer<ReturnType<typeof createEmployeeSchema>>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmployeeFormDrawer: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { data: orgData } = useOrganization();
  const employeePrefix = orgData?.employeePrefix || user?.organization?.employeePrefix || "EKH";
  const { data: nextIdData, isLoading: isLoadingNextId } = useNextEmployeeId();
  const { data: departments = [] } = useDepartments();
  const { data: shifts = [] } = useShifts();
  const { data: roles = [] } = useRoles();
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();

  const [roleValue, setRoleValue] = useState<EmployeeFormData["role"]>("EMPLOYEE");
  const [customRoleIdValue, setCustomRoleIdValue] = useState<string>("");
  const [departmentIdValue, setDepartmentIdValue] = useState<string>("");
  const [shiftIdValue, setShiftIdValue] = useState<string>("");
  const [bloodGroupValue, setBloodGroupValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    id: string;
    email: string;
    role: string;
    tempPass: string;
  } | null>(null);

  const currentYear = new Date().getFullYear().toString().slice(-2);
  const employeeSchema = React.useMemo(() => createEmployeeSchema(employeePrefix), [employeePrefix]);

  const [showIdGuideModal, setShowIdGuideModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
    reset,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { role: "EMPLOYEE", phone: "" },
  });

  const wasOpenRef = React.useRef(false);

  // Initialize fresh form only when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setCreatedCredentials(null);
      setFormError(null);
      setAvatarFile(null);
      setAvatarPreview(null);
      setCopied(false);
      reset();
      if (nextIdData?.nextEmployeeId) {
        setValue("employeeId", nextIdData.nextEmployeeId, { shouldValidate: true });
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, nextIdData, setValue, reset]);

  const handleClose = () => {
    setCreatedCredentials(null);
    setFormError(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    reset();
    onClose();
  };

  const handleDone = () => {
    setCreatedCredentials(null);
    setFormError(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    reset();
    onSuccess();
  };

  const isSubmitting = createEmployeeMutation.isPending || updateEmployeeMutation.isPending;

  if (!isOpen) return null;

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

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `HRMS Portal Credentials:\nEmployee ID: ${createdCredentials.id}\nEmail: ${createdCredentials.email}\nRole: ${createdCredentials.role}\nPassword: ${createdCredentials.tempPass}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setFormError(null);
    try {
      const response = await createEmployeeMutation.mutateAsync({
        ...data,
        role: roleValue,
        customRoleId: customRoleIdValue || undefined,
        departmentId: departmentIdValue || undefined,
        shiftId: shiftIdValue || undefined,
      });
      if (avatarFile && response.user?.id) {
        try {
          const cloudinaryUrl = await CloudinaryService.uploadImage(avatarFile, "hrms/employee-avatars");
          await updateEmployeeMutation.mutateAsync({
            id: response.user.id,
            payload: { avatarUrl: cloudinaryUrl },
          });
        } catch (uploadErr) {
          console.warn("Avatar upload failed:", uploadErr);
        }
      }
      setCreatedCredentials({
        id: response.user.employeeId,
        email: response.user.email,
        role: response.user.role || roleValue,
        tempPass: response.initialTemporaryPassword,
      });
      reset();
      setRoleValue("EMPLOYEE");
      setCustomRoleIdValue("");
      setDepartmentIdValue("");
      setShiftIdValue("");
      setBloodGroupValue("");
      setPhoneValue("");
    } catch (err) {
      const errorMessage = parseApiError(err);
      const lower = errorMessage.toLowerCase();

      // Inline field errors
      if (lower.includes("employee id")) {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-2xl max-h-[90vh] flex flex-col p-0 rounded-lg overflow-hidden shadow-xl border border-slate-200 bg-white">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800">
              {createdCredentials ? "Credentials Generated" : "Enlist New Employee"}
            </DialogTitle>
          </DialogHeader>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-5 space-y-6">
          {createdCredentials ? (
            <div className="border border-emerald-200 bg-emerald-50/30 p-6 rounded-lg text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mx-auto text-white shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900">Account Provisioned Successfully</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Share these login credentials with the user to access the HRMS Portal.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-200 text-left font-mono text-xs text-slate-800 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-sans font-medium text-[11px]">System Role</span>
                  <span className="font-semibold text-emerald-800 px-2 py-0.5 bg-emerald-50 rounded-sm border border-emerald-200">{createdCredentials.role}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-sans font-medium text-[11px]">Employee ID</span>
                  <span className="font-semibold text-slate-900">{createdCredentials.id}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-sans font-medium text-[11px]">Work Email</span>
                  <span className="font-semibold text-slate-900">{createdCredentials.email}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 font-sans font-medium text-[11px]">Password</span>
                  <span className="font-bold text-emerald-700 bg-slate-100 px-2 py-0.5 rounded-sm">{createdCredentials.tempPass}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCopyCredentials}
                  type="button"
                  variant="outline"
                  className="h-10 flex-1 rounded-lg border-emerald-300 text-emerald-800 hover:bg-emerald-50 gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied to Clipboard!" : "Copy Credentials"}
                </Button>
                <Button
                  onClick={handleDone}
                  className="h-10 flex-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  Done & Refresh List
                </Button>
              </div>
            </div>
          ) : (
            <form id="onboard-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    Upload Profile Picture
                    <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                  </label>
                  <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, or WEBP up to 3MB</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-semibold text-slate-800">Employee ID *</label>
                      <button
                        type="button"
                        onClick={() => setShowIdGuideModal(true)}
                        className="text-slate-400 hover:text-emerald-700 transition"
                        title="View Employee ID format rules"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                      <Sparkles className="w-3 h-3" /> Auto-Generated
                    </span>
                  </div>
                  <Input
                    {...register("employeeId")}
                    placeholder={`${employeePrefix || "EKH"}-${currentYear}-0001`}
                    className={`mt-1 h-10 rounded-lg font-mono uppercase ${errors.employeeId ? "border-rose-400 focus-visible:ring-rose-400" : ""}`}
                  />
                  {errors.employeeId ? (
                    <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-md">
                      <p className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Invalid Employee ID Format
                      </p>
                      <p className="text-[10px] text-rose-600 mt-0.5 leading-relaxed">
                        {errors.employeeId.message}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowIdGuideModal(true)}
                        className="mt-1 text-[10px] font-bold text-rose-800 underline hover:text-rose-950"
                      >
                        How to write the Employee ID correctly?
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-[10px] text-slate-500 flex items-center gap-1">
                      <span>Must match Org Prefix:</span>
                      <strong className="text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded font-mono">{employeePrefix || "EKH"}-{currentYear}-XXXX</strong>
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-800">System Role Tier</label>
                  <Select value={roleValue} onValueChange={(value) => { const role = value as EmployeeFormData["role"]; setRoleValue(role); setValue("role", role); }} triggerClassName="mt-1 h-10 rounded-lg" options={[{value:"EMPLOYEE",label:"EMPLOYEE"},{value:"HR",label:"HR"},{value:"ADMIN",label:"ADMIN"}]}/>
                </div>
              </div>

              {roles.length > 0 && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-800 flex items-center justify-between">
                    <span>Workplace Role Preset <span className="text-slate-400 font-normal">(Auto-assigns role permissions)</span></span>
                  </label>
                  <Select
                    value={customRoleIdValue || undefined}
                    onValueChange={(value) => {
                      setCustomRoleIdValue(value);
                      setValue("customRoleId", value);
                    }}
                    triggerClassName="mt-1 h-10 rounded-lg"
                    placeholder="Select Role Preset (e.g. Senior Accountant, Shift Manager)"
                    options={[
                      { value: "", label: "No Preset (Standard Tier)" },
                      ...roles.map((r: CustomRole) => ({ value: r.id, label: `${r.name} (${r.permissions?.length || 0} permissions)` })),
                    ]}
                  />
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-800">Full Legal Name *</label>
                  <Input
                    {...register("fullName")}
                    className="mt-1 h-10 rounded-lg"
                  />
                  {errors.fullName && (
                    <p className="text-[10px] text-rose-700 mt-1">{errors.fullName.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-800">Work Email *</label>
                    <Input
                      {...register("email")}
                      className="mt-1 h-10 rounded-lg"
                    />
                    {errors.email && (
                      <p className="text-[10px] text-rose-700 mt-1">{errors.email.message}</p>
                    )}
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
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-800 flex items-center justify-between">
                  <span>Initial Password <span className="text-slate-400 font-normal">(Optional — leave blank to auto-generate)</span></span>
                </label>
                <div className="relative mt-1">
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Set custom password (min. 6 characters)"
                    className="h-10 rounded-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[10px] text-rose-700 mt-1">{errors.password.message}</p>
                )}
              </div>

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
                <Select value={bloodGroupValue || undefined} onValueChange={(value) => { setBloodGroupValue(value); setValue("bloodGroup", value); }} triggerClassName="mt-1 h-10 rounded-lg" placeholder="Select blood group" options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => ({value:bg,label:bg}))}/>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-800">Present Address</label>
                  <Textarea
                    {...register("presentAddress")}
                    rows={2}
                    className="mt-1 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-800">Permanent Address</label>
                  <Textarea
                    {...register("permanentAddress")}
                    rows={2}
                    className="mt-1 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3 bg-white/60 border border-slate-200 rounded-lg space-y-3">
                <p className="text-[11px] font-bold text-slate-800">Emergency Contact</p>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    {...register("emergencyContactName")}
                    placeholder="Name"
                    className="h-9 rounded-lg px-2.5 text-xs"
                  />
                  <Input
                    {...register("emergencyContactPhone")}
                    placeholder="Phone"
                    className="h-9 rounded-lg px-2.5 text-xs"
                  />
                  <Input
                    {...register("emergencyContactRelation")}
                    placeholder="Relation"
                    className="h-9 rounded-lg px-2.5 text-xs"
                  />
                </div>
              </div>
            </form>
          )}
        </ScrollArea>

        {!createdCredentials && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex gap-2 shrink-0 bg-slate-50/50">
            <Button
              onClick={handleClose}
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              form="onboard-form"
              type="submit"
              disabled={isSubmitting}
              className="h-10 flex-1 rounded-lg"
            >
              {isSubmitting ? "Registering..." : "Submit & Create"}
            </Button>
          </div>
        )}
      </DialogContent>

      {/* Employee ID Format Guidance Modal */}
      {showIdGuideModal && (
        <Dialog open={showIdGuideModal} onOpenChange={setShowIdGuideModal}>
          <DialogContent className="max-w-md p-5 rounded-2xl bg-white shadow-2xl border border-slate-200">
            <DialogHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold text-slate-800">
                    Employee ID Formatting Rules
                  </DialogTitle>
                  <p className="text-[11px] text-slate-500">
                    Required for Biometric Terminal compatibility
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <p className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  Must Match Organization Prefix!
                </p>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Your organization prefix in settings is set to{" "}
                  <strong className="underline font-mono uppercase bg-amber-100 px-1 py-0.5 rounded">
                    {employeePrefix || "EKH"}
                  </strong>
                  . Any custom Employee ID must begin with this exact prefix.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-slate-800 text-xs">Format breakdown:</p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-center space-y-2">
                  <div className="text-base font-bold text-emerald-700 tracking-wider">
                    {employeePrefix || "EKH"}-{currentYear}-0001
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-600 pt-1 border-t border-slate-200 font-sans">
                    <div>
                      <strong className="text-slate-800 block font-mono">{employeePrefix || "EKH"}</strong>
                      <span>Org Prefix</span>
                    </div>
                    <div>
                      <strong className="text-slate-800 block font-mono">{currentYear}</strong>
                      <span>Current Year</span>
                    </div>
                    <div>
                      <strong className="text-slate-800 block font-mono">0001</strong>
                      <span>Sequential Serial</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                <p>
                  🔹 <strong>Why this format?</strong> When pushing to Hikvision machines, the system strips hyphens (e.g. <span className="font-mono">{employeePrefix || "EKH"}{currentYear}0001</span>).
                </p>
                <p>
                  🔹 When syncing back from the terminal, the system detects this prefix and reconstructs the hyphenated ID accurately.
                </p>
              </div>

              <Button
                onClick={() => setShowIdGuideModal(false)}
                className="w-full h-9 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
              >
                Understood, Got it!
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};
