'use client';

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, parseApiError } from "@/services/api";
import {
  MapPin,
  Send,
  Navigation,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  RefreshCw,
} from "lucide-react";

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
}

export default function OutworkSubmissionPage() {
  const queryClient = useQueryClient();

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
      setDestination("");
      setPurpose("");
      setGpsLocation(null);
      setMessage({ type: "success", text: "Outwork request submitted successfully for manager approval." });
    },
    onError: (err) => {
      setMessage({ type: "error", text: parseApiError(err) });
    },
  });

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

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-emerald-700" />
          Outwork & Field Duty Submission
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Apply for client meetings, field visits, or site duties with automatic GPS logging.
        </p>
      </div>

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

      {/* Submission Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
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
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Client / Site Destination *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Textiles Factory, Gazipur"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Purpose of Visit & Scope *</label>
            <textarea
              required
              rows={3}
              placeholder="State client agenda, machine inspection, or deliverable purpose..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600 resize-none"
            />
          </div>

          {/* GPS Verification */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Live GPS Location Stamp
              </span>
              <p className="text-[10px] text-slate-400 font-mono">
                {gpsLocation
                  ? `Lat: ${gpsLocation.lat.toFixed(5)}, Lng: ${gpsLocation.lng.toFixed(5)}`
                  : "Tap to record current field GPS location coordinates"}
              </p>
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
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-500" />
          Outwork History & Approvals
        </h2>

        {isLoading ? (
          <div className="text-center py-6 text-xs text-slate-400">Loading outwork applications...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">No outwork submissions recorded yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {records.map((rec) => (
              <div key={rec.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{rec.destination}</h3>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(rec.visitDate).toLocaleDateString()}
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
    </div>
  );
}
