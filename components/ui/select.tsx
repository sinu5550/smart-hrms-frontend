"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = { label: string; value: string };

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  name?: string;
  required?: boolean;
}

export function Select({
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder = "Select an option",
  disabled,
  className,
  triggerClassName,
  name,
  required,
}: SelectProps) {
  return (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
      required={required}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-medium text-slate-800 shadow-xs ring-offset-white placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-slate-400",
          triggerClassName
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1.5 transition-transform duration-200" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "relative z-[100] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-slate-200/90 bg-white p-0 text-slate-800 shadow-xl animate-in fade-in-80",
            className
          )}
        >
          {/* Viewport with p-0 as strictly requested */}
          <SelectPrimitive.Viewport className="p-0 overflow-y-auto custom-scrollbar">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="relative flex w-full cursor-pointer select-none items-center py-2 px-3 text-[12px] font-medium text-slate-700 outline-none hover:bg-slate-50 hover:text-slate-900 focus:bg-emerald-50 focus:text-emerald-900 transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 border-b border-slate-50 last:border-b-0"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <span className="ml-auto flex h-3.5 w-3.5 items-center justify-center pl-2">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  </SelectPrimitive.ItemIndicator>
                </span>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
