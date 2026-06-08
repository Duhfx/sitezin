import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "neutral" | "success" | "warning" | "destructive";

const variants: Record<Variant, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

type BadgeProps = ComponentProps<"span"> & {
  variant?: Variant;
};

export default function Badge({
  variant = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
