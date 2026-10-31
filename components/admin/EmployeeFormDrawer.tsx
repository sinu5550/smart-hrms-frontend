'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { EmployeeService } from "@/services/employee.service";
import { CloudinaryService } from "@/services/cloudinary.service";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCreateEmployee, useUpdateEmployee, useOrganization, useNextEmployeeId, useDepartments, useShifts, useRoles, useRegistrations } from "@/hooks";
import { RegistrationService, EmployeeRegistration } from "@/services/registration.service";
import { CustomRole } from "@/services/role.service";
import { parseApiError } from "@/services/api";
import { X, Upload, Check, Copy, Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle, HelpCircle, Info, UserPlus, Users, ArrowRight } from "lucide-react";
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
  const { data: pendingRegistrations = [] } = useRegistrations("PENDING");

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
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null);
  const [applicantPasswordHash, setApplicantPasswordHash] = useState<string | null>(null);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(null);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
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
      setExistingAvatarUrl(null);
      setApplicantPasswordHash(null);
      setSelectedRegistrationId(null);
      setShowRegistrationsModal(false);
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
    setExistingAvatarUrl(null);
    setApplicantPasswordHash(null);
    setSelectedRegistrationId(null);
    setShowRegistrationsModal(false);
    reset();
    onClose();
  };

  const handleDone = () => {
    setCreatedCredentials(null);
    setFormError(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    setExistingAvatarUrl(null);
    setApplicantPasswordHash(null);
    setSelectedRegistrationId(null);
    setShowRegistrationsModal(false);
    reset();
    onSuccess();
  };

  const handleSelectRegistration = (applicant: EmployeeRegistration) => {
    setValue("fullName", applicant.fullName, { shouldValidate: true });
    setValue("email", applicant.email, { shouldValidate: true });
    if (applicant.phone) {
      setValue("phone", applicant.phone, { shouldValidate: true });
      setPhoneValue(applicant.phone);
    }
    if (applicant.bloodGroup) {
      setValue("bloodGroup", applicant.bloodGroup);
      setBloodGroupValue(applicant.bloodGroup);
    }
    if (applicant.presentAddress) {
      setValue("presentAddress", applicant.presentAddress);
    }
    if (applicant.permanentAddress) {
      setValue("permanentAddress", applicant.permanentAddress);
    }
    if (applicant.emergencyContactName) {
      setValue("emergencyContactName", applicant.emergencyContactName);
    }
    if (applicant.emergencyContactPhone) {
      setValue("emergencyContactPhone", applicant.emergencyContactPhone);
    }
    if (applicant.emergencyContactRelation) {
      setValue("emergencyContactRelation", applicant.emergencyContactRelation);
    }
    if (applicant.departmentId) {
      setDepartmentIdValue(applicant.departmentId);
      setValue("departmentId", applicant.departmentId);
    }
    if (applicant.avatarUrl) {
      setAvatarPreview(applicant.avatarUrl);
      setExistingAvatarUrl(applicant.avatarUrl);
      setAvatarFile(null);
    }
    if (applicant.passwordHash) {
      setApplicantPasswordHash(applicant.passwordHash);
    } else {
      setApplicantPasswordHash(null);
    }

    // Preserve auto-generated employeeId if already fetched, or maintain current
    if (nextIdData?.nextEmployeeId) {
      setValue("employeeId", nextIdData.nextEmployeeId, { shouldValidate: true });
    }

    setSelectedRegistrationId(applicant.id);
    setShowRegistrationsModal(false);
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
      setExistingAvatarUrl(null);
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
        passwordHash: applicantPasswordHash || undefined,
        role: roleValue,
        customRoleId: customRoleIdValue || undefined,
        departmentId: departmentIdValue || undefined,
        shiftId: shiftIdValue || undefined,
      } as any);

      // Update avatar if provided
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
      } else if (existingAvatarUrl && response.user?.id) {
        try {
          await updateEmployeeMutation.mutateAsync({
            id: response.user.id,
            payload: { avatarUrl: existingAvatarUrl },
          });
        } catch (uploadErr) {
          console.warn("Assigning existing avatar failed:", uploadErr);
        }
      }

      // If imported from registration, mark status as ENLISTED
      if (selectedRegistrationId) {
        try {
          await RegistrationService.updateStatus(selectedRegistrationId, "ENLISTED");
        } catch (regErr) {
          console.warn("Could not mark registration as ENLISTED:", regErr);
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
              {pendingRegistrations.length > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-900">
                        {pendingRegistrations.length} {pendingRegistrations.length === 1 ? "Employee Registered" : "Employees Registered"}
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Self-registered applicants are waiting for review & enlistment
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowRegistrationsModal(true)}
                    className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg gap-1.5 shrink-0 px-3"
                  >
                    Review & Autofill
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              {selectedRegistrationId && (
                <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-lg flex items-center justify-between text-xs text-sky-800">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    Applicant details autofilled from registration form.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRegistrationId(null);
                      setExistingAvatarUrl(null);
                      reset();
                      if (nextIdData?.nextEmployeeId) {
                        setValue("employeeId", nextIdData.nextEmployeeId);
                      }
                    }}
                    className="text-[11px] font-semibold text-sky-700 hover:underline"
                  >
                    Clear Autofill
                  </button>
                </div>
              )}

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
          <DialogContent className="max-w-md p-5 rounded-lg bg-white shadow-2xl border border-slate-200">
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

      {/* Registered Applicants Selection Modal */}
      {showRegistrationsModal && (
        <Dialog open={showRegistrationsModal} onOpenChange={setShowRegistrationsModal}>
          <DialogContent className="max-w-2xl max-h-[85vh] p-0 rounded-lg overflow-hidden bg-white shadow-2xl border border-slate-200 flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold text-slate-800">
                    Registered Applicants ({pendingRegistrations.length})
                  </DialogTitle>
                  <p className="text-[11px] text-slate-500">
                    Select an applicant to autofill all details into the enlistment form
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowRegistrationsModal(false)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-5">
              {pendingRegistrations.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No pending applicant registrations found.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRegistrations.map((applicant) => (
                    <div
                      key={applicant.id}
                      className="p-3.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all flex items-center justify-between gap-3 bg-white"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {applicant.avatarUrl ? (
                            <Image
                              src={applicant.avatarUrl}
                              alt={applicant.fullName}
                              width={48}
                              height={48}
                              unoptimized
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-slate-500">
                              {applicant.fullName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-slate-900 truncate">
                            {applicant.fullName}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {applicant.email} {applicant.phone ? `• ${applicant.phone}` : ""}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {applicant.departmentName && (
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                {applicant.departmentName}
                              </span>
                            )}
                            {applicant.bloodGroup && (
                              <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-medium">
                                {applicant.bloodGroup}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              Registered {new Date(applicant.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSelectRegistration(applicant)}
                        className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shrink-0 px-3 gap-1"
                      >
                        Select & Autofill
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};
