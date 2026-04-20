"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.06em] rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-red)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-on-surface)] text-[var(--color-surface-container-lowest)] hover:bg-[var(--color-accent-red)]",
        accent:
          "bg-[var(--color-accent-red)] text-white hover:bg-[var(--color-accent-red-hover)]",
        secondary:
          "bg-[var(--color-surface-container-low)] text-[var(--color-on-surface)] border border-[rgba(173,179,176,0.15)] hover:bg-[var(--color-surface-container)]",
        ghost:
          "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] rounded-md",
        danger:
          "bg-[var(--color-accent-red-bg)] text-[var(--color-accent-red)] hover:bg-[var(--color-accent-red-light)]",
        success:
          "bg-[var(--color-status-approved-bg)] text-[var(--color-status-approved)] hover:bg-emerald-100",
        link:
          "text-[var(--color-accent-red)] underline-offset-4 hover:underline uppercase tracking-[0.06em] p-0 h-auto",
        outline:
          "border border-[#E5E5E5] bg-white text-[#1C1C1C] hover:border-[#1C1C1C] hover:bg-[#F8F6F6]",
      },
      size: {
        sm: "h-8 px-4 text-[10px]",
        md: "h-10 px-6 text-xs",
        lg: "h-11 px-8 text-xs",
        icon: "h-9 w-9 p-0 rounded-md",
        "icon-sm": "h-7 w-7 p-0 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
