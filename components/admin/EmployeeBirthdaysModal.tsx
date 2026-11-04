'use client';

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Cake, Calendar, Search, X, Gift, Sparkles, Building2 } from "lucide-react";

export interface BirthdayEmployee {
  id: string;
  fullName: string;
  employeeId: string;
  avatarUrl?: string | null;
  department: string;
  day: number;
  displayDate: string;
}

interface EmployeeBirthdaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  birthdays: BirthdayEmployee[];
  currentMonthName?: string;
}

export function EmployeeBirthdaysModal({
  isOpen,
  onClose,
  birthdays,
  currentMonthName = "November",
}: EmployeeBirthdaysModalProps) {
  const [search, setSearch] = useState("");
  const today = new Date().getDate();

  const filteredBirthdays = birthdays.filter((person) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      person.fullName.toLowerCase().includes(q) ||
      person.employeeId.toLowerCase().includes(q) ||
      person.department.toLowerCase().includes(q) ||
      person.displayDate.toLowerCase().includes(q)
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-lg p-0 rounded-2xl overflow-hidden bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-emerald-300">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                <span>Employee Birthdays</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-normal">
                  {currentMonthName}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-emerald-100/80 mt-0.5">
                Celebrating {birthdays.length} team members this month
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Birthdays List */}
        <div className="p-4 max-h-[360px] overflow-y-auto divide-y divide-slate-100 space-y-1">
          {filteredBirthdays.length > 0 ? (
            filteredBirthdays.map((person) => {
              const isToday = person.day === today;
              const isPassed = person.day < today;

              return (
                <div
                  key={person.id}
                  className={`py-3 px-3 rounded-xl flex items-center justify-between transition ${
                    isToday
                      ? "bg-emerald-50/70 border border-emerald-200 shadow-xs"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-emerald-800">
                      {person.avatarUrl ? (
                        <Image
                          src={person.avatarUrl}
                          alt=""
                          width={40}
                          height={40}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        person.fullName.charAt(0)
                      )}
                      {isToday && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center" title="Birthday Today!">
                          <Sparkles className="w-2 h-2 text-white" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/employees/${person.id}`}
                          onClick={onClose}
                          className="text-xs font-bold text-slate-800 hover:text-emerald-700 transition truncate"
                        >
                          {person.fullName}
                        </Link>
                        {isToday && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            TODAY! 🎉
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <span>{person.employeeId}</span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-0.5 text-slate-600">
                          <Building2 className="w-2.5 h-2.5 text-slate-400" />
                          {person.department}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        isToday
                          ? "bg-emerald-600 text-white shadow-xs"
                          : isPassed
                          ? "bg-slate-100 text-slate-500 border border-slate-200"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      <span>{person.displayDate}</span>
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center space-y-2">
              <Gift className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No birthdays match your search</p>
              <p className="text-[11px] text-slate-400">Try searching for a different employee name or department.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px]">
            Total {filteredBirthdays.length} employee{filteredBirthdays.length === 1 ? "" : "s"} listed
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
