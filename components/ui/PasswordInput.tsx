"use client";

import { useState, type InputHTMLAttributes } from "react";
import type { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({ className = "", leadingIcon, ...props }: PasswordInputProps & { leadingIcon?: ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative block w-full min-w-0">
      {leadingIcon && <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">{leadingIcon}</span>}
      <input {...props} type={visible ? "text" : "password"} className={`box-border block w-full min-w-0 ${className} pr-11`} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
      >
        {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
      </button>
    </div>
  );
}
