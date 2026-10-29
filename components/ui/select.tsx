"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, Search } from "lucide-react";
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
  searchable?: boolean;
  searchPlaceholder?: string;
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
  searchable = false,
  searchPlaceholder = "Search options...",
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Clear search on close
  React.useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchTerm.trim()) return options;
    const q = searchTerm.toLowerCase().trim();
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [options, searchable, searchTerm]);

  return (
    <SelectPrimitive.Root
      open={open}
      onOpenChange={setOpen}
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
          {/* Optional In-Dropdown Search Input */}
          {searchable && (
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-1.5">
              <div className="relative flex items-center">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full h-7 pl-7 pr-2 text-[11px] font-medium rounded-md bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Viewport with p-0 as strictly requested */}
          <SelectPrimitive.Viewport className="p-0 max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-3 px-3 text-center text-[11px] text-slate-400">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((option) => (
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
              ))
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
