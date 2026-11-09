'use client';

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, parseApiError } from "@/services/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { useOrganization } from "@/hooks";
import {
  CalendarDays,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  FileText,
  ShieldCheck,
  Building2,
  Download,
  Eye,
  X,
} from "lucide-react";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LeaveRequestItem {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  deptHeadStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  deptHeadActionedAt?: string | null;
  deptHeadNote?: string | null;
  rejectionNote?: string | null;
  createdAt: string;
  leaveType: {
    id: string;
    name: string;
    isPaid: boolean;
  };
  user: {
    id: string;
    fullName: string;
    employeeId: string;
    avatarUrl?: string | null;
    email?: string;
    phone?: string | null;
    department?: { id: string; name: string } | null;
    designation?: { id: string; name: string } | null;
    branch?: { id: string; name: string } | null;
  };
}

export default function AdminLeaveManagementPage() {
  const { user: currentUser } = useAuth();
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewModalItem, setViewModalItem] = useState<LeaveRequestItem | null>(null);

  const { data: leaves = [], isLoading, refetch } = useQuery<LeaveRequestItem[]>({
    queryKey: ["admin", "leaves"],
    queryFn: async () => {
      const { data } = await apiClient.get<LeaveRequestItem[]>("/leave");
      return data;
    },
  });

  // Final Admin/HR approval
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) => {
      const { data } = await apiClient.patch(`/leave/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "leaves"] });
      queryClient.invalidateQueries({ queryKey: ["portal", "leave"] });
      setProcessingId(null);
    },
    onError: (err) => {
      alert(parseApiError(err));
      setProcessingId(null);
    },
  });

  // Department Head recommendation / approval
  const deptHeadStatusMutation = useMutation({
    mutationFn: async ({ id, deptHeadStatus }: { id: string; deptHeadStatus: "APPROVED" | "REJECTED" }) => {
      const { data } = await apiClient.patch(`/leave/${id}/dept-head-status`, { deptHeadStatus });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "leaves"] });
      queryClient.invalidateQueries({ queryKey: ["portal", "leave"] });
      setProcessingId(null);
    },
    onError: (err) => {
      alert(parseApiError(err));
      setProcessingId(null);
    },
  });

  const handleUpdateStatus = (id: string, status: "APPROVED" | "REJECTED") => {
    setProcessingId(id);
    statusMutation.mutate({ id, status });
  };

  const handleUpdateDeptHeadStatus = (id: string, deptHeadStatus: "APPROVED" | "REJECTED") => {
    setProcessingId(id);
    deptHeadStatusMutation.mutate({ id, deptHeadStatus });
  };

  // Generate Official Leave Application Form PDF
  const handleDownloadLeavePDF = (item: LeaveRequestItem) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const primaryDark: [number, number, number] = [15, 23, 42]; // slate-900
      const slateGray: [number, number, number] = [71, 85, 105]; // slate-600
      const borderGray: [number, number, number] = [203, 213, 225]; // slate-300

      // Outer formal border
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.4);
      doc.rect(10, 10, 190, 277);

      // Header: Company Name & Formal Title
      const companyName = organization?.name || "SMART HRM PLATFORM";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...primaryDark);
      doc.text(companyName.toUpperCase(), 105, 20, { align: "center" });

      if (organization?.address) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...slateGray);
        doc.text(organization.address, 105, 25, { align: "center" });
      }

      // Title Banner
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, 29, 182, 10, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...primaryDark);
      doc.text("EMPLOYEE LEAVE APPLICATION FORM", 105, 35.5, { align: "center" });

      // Application Ref and Date
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...slateGray);
      const appRef = `REF: LEV-${item.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
      doc.text(appRef, 16, 45);
      doc.text(`Application Date: ${formatDate(item.createdAt)}`, 194, 45, { align: "right" });

      // Thin separator
      doc.setDrawColor(...borderGray);
      doc.line(14, 48, 196, 48);

      // Formal Addressing
      let currentY = 55;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...primaryDark);
      doc.text("To:", 16, currentY);
      doc.setFont("helvetica", "normal");
      doc.text("The Management / HR & Admin Department", 24, currentY);
      currentY += 5;
      doc.text(companyName, 24, currentY);
      currentY += 8;

      // Subject Line
      doc.setFont("helvetica", "bold");
      doc.text(`Subject: Application for ${item.leaveType?.name || "Leave"} (${item.totalDays} Day${item.totalDays > 1 ? "s" : ""})`, 16, currentY);
      currentY += 7;

      doc.setFont("helvetica", "normal");
      doc.text("Dear Sir/Madam,", 16, currentY);
      currentY += 5;
      doc.text(
        "I am submitting this formal application to request leave of absence from office duties as per the details mentioned below:",
        16,
        currentY
      );
      currentY += 5;

      // Applicant Particulars & Leave Schedule Table
      autoTable(doc, {
        startY: currentY,
        head: [["1. APPLICANT DETAILS", "2. LEAVE SCHEDULE & DETAILS"]],
        body: [
          [
            `Full Name: ${item.user?.fullName || "—"}\nEmployee ID: ${item.user?.employeeId || "—"}\nDepartment: ${item.user?.department?.name || "General"}\nDesignation: ${item.user?.designation?.name || "Staff"}\nBranch: ${item.user?.branch?.name || "Head Office"}\nContact No: ${item.user?.phone || "—"}`,
            `Leave Type: ${item.leaveType?.name || "Leave"} (${item.leaveType?.isPaid ? "Paid Leave" : "Unpaid Leave"})\nFrom Date: ${formatDate(item.startDate)}\nTo Date: ${formatDate(item.endDate)}\nTotal Duration: ${item.totalDays} Calendar Day(s)\nApplication Status: ${item.status}\nDept. Head Status: ${item.deptHeadStatus || "Pending"}`,
          ],
        ],
        theme: "plain",
        styles: {
          fontSize: 8.5,
          cellPadding: 3.5,
          textColor: [15, 23, 42],
          lineColor: [203, 213, 225],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [15, 23, 42],
          fontStyle: "bold",
          fontSize: 8.5,
        },
      });

      // @ts-ignore
      currentY = (doc as any).lastAutoTable.finalY + 6;

      // Statement of Purpose / Reason Box
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...primaryDark);
      doc.text("Statement of Reason / Purpose of Leave:", 16, currentY);
      currentY += 4;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(...borderGray);
      doc.roundedRect(14, currentY, 182, 22, 1, 1, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const splitReason = doc.splitTextToSize(item.reason || "No specific reason provided.", 174);
      doc.text(splitReason, 18, currentY + 6);

      currentY += 28;

      // Applicant Undertaking Statement
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...slateGray);
      doc.text(
        "\"I undertake that I will resume my official duties promptly on completion of the sanctioned leave period. I also confirm that urgent operational handover has been communicated to my respective team/supervisor.\"",
        16,
        currentY,
        { maxWidth: 178 }
      );

      currentY += 15;

      // Department Head Recommendation & HR Verification Box
      autoTable(doc, {
        startY: currentY,
        head: [["DEPARTMENTAL RECOMMENDATION", "HR & ADMINISTRATION VERIFICATION"]],
        body: [
          [
            `Status: ${item.deptHeadStatus || "Pending Review"}\nActioned: ${item.deptHeadActionedAt ? formatDate(item.deptHeadActionedAt) : "—"}\nNote: ${item.deptHeadNote || "None"}`,
            `Leave Record: Verified with Employee Balance\nCompany Policy: Compliant with rules\nSanction Status: ${item.status}`,
          ],
        ],
        theme: "plain",
        styles: {
          fontSize: 8,
          cellPadding: 3,
          textColor: [51, 65, 85],
          lineColor: [203, 213, 225],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [15, 23, 42],
          fontStyle: "bold",
          fontSize: 8,
        },
      });

      // Signature Section at Bottom (Applicant, HR & Admin, Management)
      const sigY = 246;

      // 1. Applicant Signature (Left)
      doc.setDrawColor(...primaryDark);
      doc.setLineWidth(0.4);
      doc.line(18, sigY, 68, sigY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...primaryDark);
      doc.text("Applicant Signature", 43, sigY + 5, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...slateGray);
      doc.text(item.user?.fullName || "Employee", 43, sigY + 9, { align: "center" });
      doc.text(`Date: ${formatDate(item.createdAt)}`, 43, sigY + 13, { align: "center" });

      // 2. HR & Admin Signature (Middle)
      doc.setDrawColor(...primaryDark);
      doc.line(78, sigY, 132, sigY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...primaryDark);
      doc.text("HR & Admin Department", 105, sigY + 5, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...slateGray);
      doc.text("Verified & Recommended", 105, sigY + 9, { align: "center" });
      doc.text("Date: _________________", 105, sigY + 13, { align: "center" });

      // 3. Management Signature (Right)
      doc.setDrawColor(...primaryDark);
      doc.line(142, sigY, 192, sigY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...primaryDark);
      doc.text("Management / Authority", 167, sigY + 5, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...slateGray);
      doc.text("Approved & Sanctioned", 167, sigY + 9, { align: "center" });
      doc.text("Date: _________________", 167, sigY + 13, { align: "center" });

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `SmartHRM Official Enterprise Leave Application Form • Generated on ${new Date().toLocaleString()}`,
        105,
        282,
        { align: "center" }
      );

      const safeEmpCode = (item.user?.employeeId || "emp").replace(/[^a-zA-Z0-9_-]/g, "_");
      doc.save(`Leave_Application_${safeEmpCode}_${item.startDate}.pdf`);
    } catch (err) {
      console.error("Failed to generate leave application PDF:", err);
      alert("Failed to generate leave application PDF.");
    }
  };

  const filtered = leaves.filter((item) => {
    const matchesStatus = filterStatus === "ALL" || item.status === filterStatus;
    const matchesSearch =
      (item.user?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.user?.employeeId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reason || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.leaveType?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = leaves.filter((l) => l.status === "PENDING").length;
  const approvedCount = leaves.filter((l) => l.status === "APPROVED").length;
  const rejectedCount = leaves.filter((l) => l.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
            Leave Management
          </h1>
          <p className="text-xs text-slate-500">
            Review, recommend, approve, and export formal leave applications.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Approved Leaves</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{approvedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Rejected</p>
            <p className="text-2xl font-bold text-rose-600 mt-0.5">{rejectedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                filterStatus === tab
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab === "ALL" ? "All Requests" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employee, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Leave Requests Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Mobile View: Card List */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading leave requests...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No matching leave requests found.</div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-700">
                      {item.user?.avatarUrl ? (
                        <Image src={item.user.avatarUrl} alt="" width={32} height={32} unoptimized className="w-full h-full object-cover" />
                      ) : (
                        item.user?.fullName?.charAt(0) || "U"
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-slate-900">{item.user?.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{item.user?.employeeId} • {item.user?.department?.name || "General"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewModalItem(item)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        item.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : item.status === "REJECTED"
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setViewModalItem(item)}
                  className="bg-slate-50 p-2.5 rounded-lg text-xs space-y-1 cursor-pointer hover:bg-slate-100/80 transition"
                  title="Click to view full details"
                >
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold text-slate-800">{item.leaveType?.name || "LEAVE"}</span>
                    <span className="font-semibold text-emerald-700">{item.totalDays} Day{item.totalDays > 1 ? "s" : ""}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {formatDate(item.startDate)} to {formatDate(item.endDate)}
                  </p>
                  <p className="text-slate-700 text-[11px] pt-1 border-t border-slate-200/50 line-clamp-2">
                    <span className="font-medium text-slate-500">Reason: </span>
                    {item.reason}
                  </p>
                </div>

                {/* Mobile Actions: Approve, Reject, View & Download PDF */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setViewModalItem(item)}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
                    title="View Full Details"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>View</span>
                  </button>
                  {item.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(item.id, "APPROVED")}
                        disabled={processingId === item.id}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(item.id, "REJECTED")}
                        disabled={processingId === item.id}
                        className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDownloadLeavePDF(item)}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
                    title="Download Official Leave Application Form PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>PDF</span>
                  </button>
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
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading leave requests...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No matching leave requests found.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-700">
                          {item.user?.avatarUrl ? (
                            <Image src={item.user.avatarUrl} alt="" width={32} height={32} unoptimized className="w-full h-full object-cover" />
                          ) : (
                            item.user?.fullName?.charAt(0) || "U"
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{item.user?.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{item.user?.employeeId} • {item.user?.department?.name || "General"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {item.leaveType?.name || "LEAVE"}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-700">
                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                      {item.totalDays} Day{item.totalDays > 1 ? "s" : ""}
                    </td>

                    <td 
                      onClick={() => setViewModalItem(item)}
                      className="py-3 px-4 text-slate-600 max-w-[200px] truncate cursor-pointer hover:text-emerald-700 hover:underline transition" 
                      title="Click to view full reason"
                    >
                      {item.reason}
                    </td>

                    {/* Final Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          item.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : item.status === "REJECTED"
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Actions: View Details, Approve / Reject, and Download PDF */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Full Application Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => setViewModalItem(item)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold transition border border-slate-200 cursor-pointer"
                          title="View Full Leave Details & Reason"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                        </button>

                        {item.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(item.id, "APPROVED")}
                              disabled={processingId === item.id}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition shadow-xs disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(item.id, "REJECTED")}
                              disabled={processingId === item.id}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition shadow-xs disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* Download Official Leave Application PDF */}
                        <button
                          type="button"
                          onClick={() => handleDownloadLeavePDF(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-[11px] font-semibold transition shadow-2xs border border-slate-200 cursor-pointer"
                          title="Download Official Leave Application Form (PDF)"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>PDF</span>
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

      {/* Leave Application Details Modal */}
      {viewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Leave Application Details</h3>
                  <p className="text-[11px] text-slate-500">
                    Submitted on {formatDate(viewModalItem.createdAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewModalItem(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Employee Header Card */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                    {viewModalItem.user?.avatarUrl ? (
                      <Image
                        src={viewModalItem.user.avatarUrl}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      viewModalItem.user?.fullName?.charAt(0) || "U"
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{viewModalItem.user?.fullName}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {viewModalItem.user?.employeeId} • {viewModalItem.user?.department?.name || "General"}
                    </p>
                    {viewModalItem.user?.designation?.name && (
                      <p className="text-[10px] text-slate-400">{viewModalItem.user.designation.name}</p>
                    )}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border shrink-0 ${
                    viewModalItem.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : viewModalItem.status === "REJECTED"
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {viewModalItem.status}
                </span>
              </div>

              {/* Leave Info Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Leave Type</span>
                  <p className="font-bold text-slate-900 mt-0.5">{viewModalItem.leaveType?.name || "LEAVE"}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Total Duration</span>
                  <p className="font-bold text-emerald-700 mt-0.5">
                    {viewModalItem.totalDays} Day{viewModalItem.totalDays > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="col-span-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Leave Dates</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {formatDate(viewModalItem.startDate)} &mdash; {formatDate(viewModalItem.endDate)}
                  </p>
                </div>
              </div>

              {/* Full Reason Statement */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Reason for Leave / Statement
                </span>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto font-sans text-xs sm:text-[13px]">
                  {viewModalItem.reason || "No detailed statement provided."}
                </div>
              </div>

              {/* Department Head Recommendation (if present) */}
              {viewModalItem.deptHeadStatus && (
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-slate-600">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">Dept Head Recommendation:</span>
                    <span className={`font-bold uppercase ${viewModalItem.deptHeadStatus === "APPROVED" ? "text-emerald-700" : "text-rose-700"}`}>
                      {viewModalItem.deptHeadStatus}
                    </span>
                  </div>
                  {viewModalItem.deptHeadNote && (
                    <p className="text-[11px] text-slate-500 mt-1 italic">&ldquo;{viewModalItem.deptHeadNote}&rdquo;</p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleDownloadLeavePDF(viewModalItem)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs border border-slate-300 transition shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Download Form (PDF)</span>
              </button>

              <div className="flex items-center gap-2">
                {viewModalItem.status === "PENDING" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateStatus(viewModalItem.id, "REJECTED");
                        setViewModalItem(null);
                      }}
                      disabled={processingId === viewModalItem.id}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition shadow-xs disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateStatus(viewModalItem.id, "APPROVED");
                        setViewModalItem(null);
                      }}
                      disabled={processingId === viewModalItem.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition shadow-xs disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setViewModalItem(null)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
