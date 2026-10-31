'use client';

import React, { useState } from "react";
import { Employee } from "@/services/employee.service";
import { parseApiError } from "@/services/api";
import { AlertTriangle, Trash2, X, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBulkDeleteEmployees } from "@/hooks";

interface BulkDeleteModalProps {
  selectedEmployees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkDeleteEmployeesModal: React.FC<BulkDeleteModalProps> = ({
  selectedEmployees,
  onClose,
  onSuccess,
}) => {
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const bulkDeleteMutation = useBulkDeleteEmployees();

  const count = selectedEmployees.length;
  const requiredString = `DELETE_${count}_EMPLOYEES`;
  const isMatch = typedConfirmation.trim().toUpperCase() === requiredString;
  const isDeleting = bulkDeleteMutation.isPending;

  const handleDelete = async () => {
    if (!isMatch) return;
    try {
      const ids = selectedEmployees.map((e) => e.id);
      await bulkDeleteMutation.mutateAsync(ids);
      onSuccess();
    } catch (err: any) {
      alert(parseApiError(err));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-md rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-lg">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div>
          <DialogHeader>
            <DialogTitle className="text-base text-rose-950 font-bold">
              Bulk Delete ({count}) Personnel
            </DialogTitle>
            <DialogDescription className="mt-1 leading-relaxed text-xs text-slate-600">
              You are about to permanently delete <span className="font-bold text-slate-900">{count} selected employees</span> from your database. 
              This will completely erase their profiles from the system.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Selected List Preview */}
        <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-1.5 text-xs">
          {selectedEmployees.map((emp) => (
            <div key={emp.id} className="flex items-center justify-between text-slate-700 bg-white px-2 py-1 rounded border border-slate-200/80">
              <span className="font-medium truncate max-w-[200px]">{emp.fullName}</span>
              <span className="font-mono text-[10px] text-slate-500 font-semibold">{emp.employeeId}</span>
            </div>
          ))}
        </div>

        <div className="bg-rose-50/70 p-3 rounded-lg border border-rose-200">
          <p className="text-[11px] text-rose-900 font-medium mb-1">
            To confirm this bulk action, type this exact text below:
          </p>
          <code className="text-xs font-mono font-bold text-rose-700 select-all block bg-white px-2 py-1 rounded border border-rose-200">
            {requiredString}
          </code>
        </div>

        <Input
          type="text"
          value={typedConfirmation}
          onChange={(e) => setTypedConfirmation(e.target.value)}
          placeholder={`Type "${requiredString}"`}
          className="h-10 text-xs font-mono"
        />

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={isDeleting} className="h-9 px-4 text-xs font-semibold rounded-lg">
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={!isMatch || isDeleting}
            className="h-9 px-4 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? "Deleting..." : `Delete ${count} Employees`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
