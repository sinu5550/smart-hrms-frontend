'use client';

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePublicOrgForm } from "@/hooks";
import { CloudinaryService } from "@/services/cloudinary.service";
import { RegistrationService } from "@/services/registration.service";
import {
  Building2,
  Upload,
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  MapPin,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Camera,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function PublicEmployeeRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = (params?.slug as string) || "";

  const { data: org, isLoading, error } = usePublicOrgForm(tenantSlug);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nidOrPassport, setNidOrPassport] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("MALE");
  const [bloodGroup, setBloodGroup] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [presentAddress, setPresentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactRelation, setEmergencyContactRelation] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB. Please choose an image under 5MB.");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError("Full Name is required.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("A valid email address is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      let uploadedAvatarUrl: string | null = null;

      if (avatarFile) {
        try {
          // Cloudinary service automatically runs optimizeImageUnder200KB client-side!
          uploadedAvatarUrl = await CloudinaryService.uploadImage(avatarFile, "hrms/registrations");
        } catch (uploadErr) {
          console.warn("Avatar optimization/upload warning:", uploadErr);
        }
      }

      await RegistrationService.submitRegistration(tenantSlug, {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        nidOrPassport: nidOrPassport.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender,
        bloodGroup: bloodGroup || undefined,
        departmentId: departmentId || undefined,
        designationId: designationId || undefined,
        presentAddress: presentAddress.trim() || undefined,
        permanentAddress: permanentAddress.trim() || undefined,
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined,
        emergencyContactRelation: emergencyContactRelation.trim() || undefined,
        avatarUrl: uploadedAvatarUrl,
      });

      setSubmittedSuccess(true);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to submit registration. Please check fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading Organization Registration Portal...</p>
        </div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Registration Link Unavailable</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            This registration portal link could not be verified or is no longer active. Please contact your organization HR administrator.
          </p>
        </div>
      </div>
    );
  }

  if (submittedSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl p-8 border border-emerald-200 text-center space-y-5 shadow-lg animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Registration Submitted Successfully!</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Thank you, <b>{fullName}</b>! Your profile and onboarding information have been securely delivered to <b>{org.name}</b>.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2 text-xs text-slate-600">
            <p className="flex items-center gap-2 font-medium text-slate-800">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Next Steps:</span>
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-500">
              <li>HR administration will verify your details and assign your official Employee ID.</li>
              <li>Your initial portal login credentials will be issued to: <b>{email}</b>.</li>
              <li>Your photo has been optimized and prepped for biometric office access.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const deptOptions = (org.departments || []).map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const desigOptions = (org.designations || []).map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const bloodGroupOptions = [
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb] py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Org Banner Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-center space-y-3">
          {org.logoUrl ? (
            <img
              src={org.logoUrl}
              alt={org.name}
              className="h-14 object-contain mx-auto"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-xs">
              {org.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{org.name}</h1>
            <p className="text-xs text-slate-500">{org.address || "Official Employee Onboarding & Registration Form"}</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Official Onboarding Portal</span>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
          {formError && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Profile Photo Upload Section */}
          <div className="space-y-2 border-b border-slate-100 pb-6">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Profile Photo (Required for Biometrics & ID)
            </label>
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-xl object-cover border-2 border-emerald-500 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                    <Camera className="w-6 h-6" />
                    <span className="text-[10px] mt-1 font-medium">Add Photo</span>
                  </div>
                )}
                <label
                  htmlFor="avatar-file-input"
                  className="absolute inset-0 cursor-pointer rounded-xl flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition"
                >
                  <Upload className="w-4 h-4" />
                </label>
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>

              <div className="text-xs space-y-1">
                <p className="font-semibold text-slate-800">Clear frontal passport-style photo</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Automatically compressed & optimized under 200KB for facial terminal matching and employee smart ID card.
                </p>
                <label
                  htmlFor="avatar-file-input"
                  className="inline-block text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer pt-1"
                >
                  Choose File...
                </label>
              </div>
            </div>
          </div>

          {/* Personal Info Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Intisar Ahmed Siyan"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Email Address *</label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. employee@domain.com"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01712345678"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">NID / Passport Number</label>
                <Input
                  value={nidOrPassport}
                  onChange={(e) => setNidOrPassport(e.target.value)}
                  placeholder="e.g. 1998123456789"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Date of Birth</label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Gender</label>
                <Select
                  value={gender}
                  onValueChange={setGender}
                  triggerClassName="h-9 text-xs"
                  options={[
                    { value: "MALE", label: "Male" },
                    { value: "FEMALE", label: "Female" },
                    { value: "OTHER", label: "Other" },
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Blood Group</label>
                <Select
                  value={bloodGroup}
                  onValueChange={setBloodGroup}
                  placeholder="Select Blood Group"
                  triggerClassName="h-9 text-xs"
                  options={bloodGroupOptions}
                />
              </div>
            </div>
          </div>

          {/* Department Preference */}
          {(deptOptions.length > 0 || desigOptions.length > 0) && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Department & Designation</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {deptOptions.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Department</label>
                    <Select
                      value={departmentId}
                      onValueChange={setDepartmentId}
                      placeholder="Select Department"
                      triggerClassName="h-9 text-xs"
                      options={deptOptions}
                    />
                  </div>
                )}

                {desigOptions.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Designation / Role</label>
                    <Select
                      value={designationId}
                      onValueChange={setDesignationId}
                      placeholder="Select Designation"
                      triggerClassName="h-9 text-xs"
                      options={desigOptions}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Addresses */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Addresses</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Present Address</label>
                <Textarea
                  rows={2}
                  value={presentAddress}
                  onChange={(e) => setPresentAddress(e.target.value)}
                  placeholder="House, Road, Area, City"
                  className="text-xs rounded-lg resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Permanent Address</label>
                <Textarea
                  rows={2}
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  placeholder="Village, Post, Thana, District"
                  className="text-xs rounded-lg resize-none"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-slate-400" />
              <span>Emergency Contact</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Contact Person Name</label>
                <Input
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. Father/Spouse"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Emergency Phone</label>
                <Input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="e.g. 01710000000"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Relationship</label>
                <Input
                  value={emergencyContactRelation}
                  onChange={(e) => setEmergencyContactRelation(e.target.value)}
                  placeholder="e.g. Father, Mother, Brother"
                  className="h-9 text-xs rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 h-10 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm transition active:scale-95"
            >
              {isSubmitting ? "Submitting Registration..." : "Complete & Submit Registration"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
