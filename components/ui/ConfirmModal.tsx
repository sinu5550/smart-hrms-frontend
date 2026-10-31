'use client';

import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  AlertTriangle,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Info,
  X,
  LucideIcon
} from "lucide-react";

export type ConfirmationVariant = "danger" | "warning" | "info" | "success" | "sync";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  isLoading?: boolean;
  icon?: LucideIcon;
  badge?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  isLoading = false,
  icon,
  badge,
}) => {
  if (!isOpen) return null;

  // Variant themes: Colors, Icons, and subtle gradient glows
  const variantConfig: Record<
    ConfirmationVariant,
    {
      icon: LucideIcon;
      iconBg: string;
      iconColor: string;
      iconRing: string;
      btnBg: string;
      glowBg: string;
      badgeColor: string;
    }
  > = {
    danger: {
      icon: Trash2,
      iconBg: "bg-rose-50 text-rose-600",
      iconColor: "text-rose-600",
      iconRing: "ring-rose-100",
      btnBg: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs",
      glowBg: "from-rose-50/70 via-rose-50/20 to-transparent",
      badgeColor: "bg-rose-100/70 text-rose-700 border-rose-200",
    },
    warning: {
      icon: AlertTriangle,
      iconBg: "bg-amber-50 text-amber-600",
      iconColor: "text-amber-600",
      iconRing: "ring-amber-100",
      btnBg: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs",
      glowBg: "from-amber-50/70 via-amber-50/20 to-transparent",
      badgeColor: "bg-amber-100/70 text-amber-700 border-amber-200",
    },
    sync: {
      icon: RefreshCw,
      iconBg: "bg-emerald-50 text-emerald-600",
      iconColor: "text-emerald-600",
      iconRing: "ring-emerald-100",
      btnBg: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs",
      glowBg: "from-emerald-50/70 via-emerald-50/20 to-transparent",
      badgeColor: "bg-emerald-100/70 text-emerald-700 border-emerald-200",
    },
    success: {
      icon: CheckCircle2,
      iconBg: "bg-teal-50 text-teal-600",
      iconColor: "text-teal-600",
      iconRing: "ring-teal-100",
      btnBg: "bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs",
      glowBg: "from-teal-50/70 via-teal-50/20 to-transparent",
      badgeColor: "bg-teal-100/70 text-teal-700 border-teal-200",
    },
    info: {
      icon: HelpCircle,
      iconBg: "bg-blue-50 text-blue-600",
      iconColor: "text-blue-600",
      iconRing: "ring-blue-100",
      btnBg: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs",
      glowBg: "from-blue-50/70 via-blue-50/20 to-transparent",
      badgeColor: "bg-blue-100/70 text-blue-700 border-blue-200",
    },
  };

  const currentVariant = variantConfig[variant] || variantConfig.info;
  const DisplayIcon = icon || currentVariant.icon;

  const handleConfirmClick = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[420px] p-0 overflow-hidden rounded-lg bg-white border border-slate-200/90 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {/* Soft decorative ambient glow header */}
        <div className={`relative px-6 pt-7 pb-4 bg-gradient-to-b ${currentVariant.glowBg} border-b border-slate-100/80`}>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/80 transition focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3.5">
            {/* Cute Icon Avatar with subtle ring */}
            <div
              className={`w-12 h-12 rounded-2xl ${currentVariant.iconBg} ring-4 ${currentVariant.iconRing} flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 hover:scale-105`}
            >
              <DisplayIcon className={`w-6 h-6 ${currentVariant.iconColor} ${variant === "sync" && isLoading ? "animate-spin" : ""}`} />
            </div>

            <div className="flex-1 pt-0.5">
              {badge && (
                <span
                  className={`inline-block px-2 py-0.5 mb-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${currentVariant.badgeColor}`}
                >
                  {badge}
                </span>
              )}
              <h3 className="text-[17px] font-bold text-slate-900 tracking-tight leading-snug">
                {title}
              </h3>
            </div>
          </div>
        </div>

        {/* Modal Description Body */}
        <div className="px-6 py-4">
          <p className="text-[13.5px] leading-relaxed text-slate-600">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 flex items-center justify-end gap-3 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-10 px-5 rounded-lg text-[13px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 shadow-2xs transition inline-flex items-center justify-center cursor-pointer disabled:opacity-50 select-none leading-none"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isLoading}
            className={`h-10 px-5 rounded-lg text-[13px] font-semibold text-white shadow-2xs transition inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none leading-none ${currentVariant.btnBg}`}
          >
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin shrink-0" />}
            <span className="whitespace-nowrap">{isLoading ? "Processing..." : confirmText}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
