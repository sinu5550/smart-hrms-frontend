'use client';

import React, { useState } from "react";
import { EmployeeService } from "@/services/employee.service";
import { parseApiError } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/hooks/queryKeys";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  X,
} from "lucide-react";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const queryClient = useQueryClient();
  const [jsonInput, setJsonInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    totalImported: number;
    totalSkipped: number;
    skipped?: Array<{ row: any; reason: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSampleDownload = () => {
    const sample = [
      {
        fullName: "Rahim Chowdhury",
        employeeId: "EKH-26-0005",
        email: "rahim@company.com",
        phone: "+8801712345678",
        role: "EMPLOYEE",
        bloodGroup: "B_POSITIVE",
      },
      {
        fullName: "Fatema Akter",
        employeeId: "EKH-26-0006",
        email: "fatema@company.com",
        phone: "+8801798765432",
        role: "HR",
        bloodGroup: "O_POSITIVE",
      },
    ];

    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hrms_employees_bulk_template.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Verify JSON parsing
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          alert("File must contain a JSON array of employee records.");
          return;
        }
        setJsonInput(JSON.stringify(parsed, null, 2));
      } catch (err) {
        alert("Invalid JSON format in uploaded file.");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    try {
      setError(null);
      setResult(null);

      let rows: any[];
      try {
        rows = JSON.parse(jsonInput);
      } catch (err) {
        setError("Invalid JSON format. Please verify syntax.");
        return;
      }

      if (!Array.isArray(rows) || rows.length === 0) {
        setError("Input must be a non-empty array of employee objects.");
        return;
      }

      setIsSubmitting(true);
      const res = await EmployeeService.bulkImport(rows);
      setResult(res);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Bulk Employee Import (JSON / Spreadsheet)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <div>
            <p className="font-semibold text-slate-700">Need the data schema template?</p>
            <p className="text-[11px] text-slate-400">Download formatted JSON structure with sample fields</p>
          </div>
          <button
            onClick={handleSampleDownload}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-md flex items-center gap-1.5 text-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample Template</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Import Process Completed!</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Successfully enrolled <b>{result.totalImported}</b> personnel. Skipped: {result.totalSkipped}.
            </p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">JSON Payload / Records</label>
            <label className="cursor-pointer text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1">
              <Upload className="w-3 h-3" />
              <span>Upload JSON file</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <textarea
            rows={8}
            placeholder='[&#10;  { "fullName": "Karim Mia", "employeeId": "EKH-26-0007", "email": "karim@domain.com", "role": "EMPLOYEE" }&#10;]'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600 resize-none"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Close
          </button>
          <button
            onClick={handleImport}
            disabled={isSubmitting || !jsonInput.trim()}
            className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>Start Bulk Import</span>
          </button>
        </div>
      </div>
    </div>
  );
}
