"use client";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

const Label = ({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) => (
  <LabelPrimitive.Root className={cn("text-sm font-medium leading-none text-slate-800 peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />
);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
