import React from "react";
import { cn } from "@/lib/utils";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  maxHeight?: string | number;
  className?: string;
  children: React.ReactNode;
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ maxHeight, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={maxHeight ? { maxHeight } : undefined}
        className={cn(
          "overflow-y-auto overflow-x-hidden custom-scrollbar",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = "ScrollArea";
