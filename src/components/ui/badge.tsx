import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.06em] rounded-full",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]",
        reel: "badge-reel",
        carousel_animated: "badge-carousel-animated",
        carousel_static: "badge-carousel-static",
        story: "badge-story",
        planning: "status-planning",
        briefing: "status-briefing",
        ideation: "status-ideation",
        production: "status-production",
        review: "status-review",
        approved: "status-approved",
        rejected: "status-rejected",
        accent:
          "bg-[var(--color-accent-red-bg)] text-[var(--color-accent-red)]",
        outline:
          "border border-[#E5E5E5] bg-transparent text-[#1C1C1C]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
