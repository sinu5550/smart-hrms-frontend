'use client';

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, parseApiError } from "@/services/api";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  MapPin,
  Send,
  Navigation,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase,
  RefreshCw,
  Users,
  Building,
} from "lucide-react";
import Image from "next/image";
import { formatDate } from "@/lib/utils";

interface OutworkRecord {
  id: string;
  visitDate: string;
  destination: string;
  purpose: string;
  latitude?: number | null;
  longitude?: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvalNotes?: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    employeeId: string;
    avatarUrl?: string | null;
    department?: { name: string } | null;
  };
}

export default function OutworkSubmissionPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isManager = Boolean(
    user?.role === "HR" ||
    user?.role === "ADMIN" ||
    user?.role === "OWNER" ||
    user?.role === "PLATFORM_ADMIN" ||
    user?.isOwner ||
    user?.department?.name === "HR & Admin" ||
    (Array.isArray(user?.permissions) && (
      user.permissions.includes("attendance.manage") ||
      user.permissions.includes("attendance.view")
    ))
  );

  const [activeTab, setActiveTab] = useState<"APPLY" | "TEAM_REQUESTS">("APPLY");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: records = [], isLoading } = useQuery<OutworkRecord[]>({
    queryKey: ["portal", "outwork"],
    queryFn: async () => {
      const { data } = await apiClient.get<OutworkRecord[]>("/outwork");
      return data;
    },
  });

  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const getGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser/device.");
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsGettingGps(false);
      },
      (err) => {
        alert(`Could not fetch GPS coordinates: ${err.message}`);
        setIsGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const applyMutation = useMutation({
    mutationFn: async (payload: {
      visitDate: string;
      destination: string;
      purpose: string;
      latitude?: number;
      longitude?: number;
    }) => {
      const { data } = await apiClient.post<OutworkRecord>("/outwork", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "outwork"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "today-status"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setDestination("");
      setPurpose("");
      setGpsLocation(null);
      setMessage({
        type: "success",
        text: "Outwork request submitted & check-in recorded successfully!",
      });
    },
    onError: (err) => {
      setMessage({ type: "error", text: parseApiError(err) });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, approvalNotes }: { id: string; status: "APPROVED" | "REJECTED"; approvalNotes?: string }) => {
      const { data } = await apiClient.patch(`/outwork/${id}/status`, { status, approvalNotes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "outwork"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "outwork"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "today-status"] });
      queryClient.invalidateQueries({ queryKey: ["employees", "dashboard-stats"] });
      setProcessingId(null);
      setMessage({ type: "success", text: "Outwork application status updated successfully." });
    },
    onError: (err) => {
      setProcessingId(null);
      setMessage({ type: "error", text: parseApiError(err) });
    },
  });

  const handleAction = (id: string, status: "APPROVED" | "REJECTED") => {
    setProcessingId(id);
    statusMutation.mutate({ id, status });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || !purpose.trim()) return;

    setMessage(null);
    applyMutation.mutate({
      visitDate,
      destination: destination.trim(),
      purpose: purpose.trim(),
      latitude: gpsLocation?.lat,
      longitude: gpsLocation?.lng,
    });
  };

  const teamRequests = records.filter((r) => r.user && r.user.id !== user?.id);
  const myRecords = records.filter((r) => !r.user || r.user.id === user?.id);
  const pendingTeamCount = teamRequests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-emerald-700" />
          Outwork & Field Duty
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Apply for client meetings, field visits, or site duties with automatic check-in.
        </p>
      </div>

      {/* Manager Tab Bar */}
      {isManager && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("APPLY")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "APPLY"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Apply Outwork</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("TEAM_REQUESTS")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "TEAM_REQUESTS"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Approvals</span>
            {pendingTeamCount > 0 && (
              <span className="ml-1 bg-amber-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {pendingTeamCount}
              </span>
            )}
          </button>
        </div>
      )}

      {message && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* TAB 1: APPLY & PERSONAL OUTWORK */}
      {activeTab === "APPLY" && (
        <>
          {/* Submission Form */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-emerald-700" />
              New Outwork Request
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Duty Visit Date *</label>
                  <input
                    type="date"
                    required
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Client / Destination Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Footwear HQ, Gulshan-2"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Purpose & Agenda Details *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your meeting agenda or official visit purpose..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-emerald-600"
                />
              </div>

              {/* Optional Geofenced GPS Tagging */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800">Geotag Coordinates (Optional)</p>
                    <p className="text-[11px] text-slate-500">
                      {gpsLocation
                        ? `Lat: ${gpsLocation.lat.toFixed(5)}, Lng: ${gpsLocation.lng.toFixed(5)}`
                        : "Verify your attendance location via device GPS."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={getGps}
                  disabled={isGettingGps}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md transition disabled:opacity-50"
                >
                  {isGettingGps ? "Fetching..." : gpsLocation ? "Re-tag GPS" : "Capture GPS"}
                </button>
              </div>

              <button
                type="submit"
                disabled={applyMutation.isPending}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {applyMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Submit Outwork Application</span>
              </button>
            </form>
          </div>

          {/* History Log */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              My Outwork History
            </h2>

            {isLoading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-3.5 w-28 bg-slate-200/80 rounded animate-pulse" />
                      <div className="h-5 w-16 bg-slate-200/80 rounded-full animate-pulse" />
                    </div>
                    <div className="h-2.5 w-40 bg-slate-200/60 rounded animate-pulse" />
                    <div className="h-3 w-full bg-slate-200/60 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : myRecords.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No outwork submissions recorded yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myRecords.map((rec) => (
                  <div key={rec.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{rec.destination}</h3>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(rec.visitDate)}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                          rec.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : rec.status === "REJECTED"
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-md">{rec.purpose}</p>

                    {rec.approvalNotes && (
                      <p className="text-[10px] text-emerald-800 font-medium bg-emerald-50 p-1.5 rounded">
                        Manager Note: {rec.approvalNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: TEAM APPROVALS (FOR MANAGERS / HR / ADMIN) */}
      {isManager && activeTab === "TEAM_REQUESTS" && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                Team Outwork Applications ({teamRequests.length})
              </h2>
              <p className="text-[11px] text-slate-500">
                Review and approve client visits & outdoor duty submissions across your team.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading team applications...</div>
          ) : teamRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No team outwork applications found.</div>
          ) : (
            <div className="space-y-3">
              {teamRequests.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-white transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-700">
                        {rec.user?.avatarUrl ? (
                          <Image
                            src={rec.user.avatarUrl}
                            alt=""
                            width={32}
                            height={32}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          rec.user?.fullName?.charAt(0) || "U"
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{rec.user?.fullName}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {rec.user?.employeeId} &bull; {rec.user?.department?.name || "General"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border shrink-0 ${
                        rec.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : rec.status === "REJECTED"
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        {rec.destination}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {formatDate(rec.visitDate)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">{rec.purpose}</p>
                    {rec.latitude && rec.longitude && (
                      <p className="text-[10px] text-emerald-700 font-mono">
                        GPS: {rec.latitude.toFixed(5)}, {rec.longitude.toFixed(5)}
                      </p>
                    )}
                  </div>

                  {rec.status === "PENDING" ? (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAction(rec.id, "APPROVED")}
                        disabled={processingId === rec.id}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {processingId === rec.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAction(rec.id, "REJECTED")}
                        disabled={processingId === rec.id}
                        className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : rec.approvalNotes ? (
                    <p className="text-[10px] text-slate-500 italic bg-slate-100 p-1.5 rounded">
                      Note: {rec.approvalNotes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
