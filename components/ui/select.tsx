"use client";
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = { label: string; value: string };
type SelectProps = { value?: string; defaultValue?: string; onValueChange?: (value: string) => void; options: SelectOption[]; placeholder?: string; disabled?: boolean; className?: string; triggerClassName?: string; name?: string; required?: boolean };

export function Select({ value, defaultValue, onValueChange, options, placeholder = "Select an option", disabled, className, triggerClassName, name, required }: SelectProps) {
  return <SelectPrimitive.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled} name={name} required={required}>
    <SelectPrimitive.Trigger className={cn("flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-sm ring-offset-white placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-slate-400", triggerClassName)}>
      <SelectPrimitive.Value placeholder={placeholder}/><SelectPrimitive.Icon asChild><ChevronDown className="h-3.5 w-3.5 opacity-50"/></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal><SelectPrimitive.Content position="popper" sideOffset={5} className={cn("relative z-[100] max-h-80 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-800 shadow-xl animate-in fade-in-80", className)}><SelectPrimitive.Viewport className="p-1">
      {options.map((option) => (
        <SelectPrimitive.Item
          key={option.value}
          value={option.value}
          className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-3 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 hover:text-slate-900 focus:bg-emerald-50 focus:text-emerald-900 transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
        >
          <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
            <SelectPrimitive.ItemIndicator><Check className="h-3.5 w-3.5 text-emerald-600"/></SelectPrimitive.ItemIndicator>
          </span>
          <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
      ))}
    </SelectPrimitive.Viewport></SelectPrimitive.Content></SelectPrimitive.Portal>
  </SelectPrimitive.Root>;
}
