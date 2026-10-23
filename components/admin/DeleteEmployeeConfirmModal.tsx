'use client';

import React, { useState } from "react";
import { Employee } from "@/services/employee.service";
import { parseApiError } from "@/services/api";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSoftDeleteEmployee } from "@/hooks";

interface Props {
  employee: Employee;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteEmployeeConfirmModal: React.FC<Props> = ({ employee, onClose, onSuccess }) => {
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const deleteMutation = useSoftDeleteEmployee();

  const requiredString = `DELETE_EMPLOYEE_${employee.employeeId}`;
  const isMatch = typedConfirmation === requiredString;
  const isDeleting = deleteMutation.isPending;

  const handleDelete = async () => {
    if (!isMatch) return;
    try {
      await deleteMutation.mutateAsync({
        id: employee.id,
        confirmationText: typedConfirmation,
      });
      onSuccess();
    } catch (err) {
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
          <DialogHeader><DialogTitle className="text-base">Soft-Delete Employee</DialogTitle><DialogDescription className="mt-1 leading-relaxed">
            This will immediately revoke active JWT sessions and set <span className="font-semibold text-slate-800">{employee.fullName}</span> ({employee.employeeId}) to TERMINATED status.
          </DialogDescription></DialogHeader>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <p className="text-[11px] text-slate-800 mb-1">To execute this, enter this exact string:</p>
          <code className="text-xs font-mono font-bold text-rose-700 select-all">{requiredString}</code>
        </div>

        <Input
          type="text"
          value={typedConfirmation}
          onChange={(e) => setTypedConfirmation(e.target.value)}
          placeholder={`Type "${requiredString}"`}
          className="h-10 rounded-lg font-mono"
        />

        <div className="flex gap-2 pt-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="h-10 flex-1 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={!isMatch || isDeleting}
            variant="destructive"
            className="h-10 flex-1 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? "Archiving..." : "Delete Employee"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
