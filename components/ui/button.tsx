import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-semibold ring-offset-white transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: { default: "bg-emerald-700 text-white shadow-xs hover:bg-emerald-800", destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-xs", outline: "border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50", secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200", ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900", link: "text-emerald-700 underline-offset-4 hover:underline" },
    size: { default: "h-8 px-3.5 py-1.5", sm: "h-7 rounded-lg px-2.5 text-[11px]", lg: "h-9 rounded-lg px-5 text-sm", icon: "h-8 w-8 rounded-lg" },
  }, defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
