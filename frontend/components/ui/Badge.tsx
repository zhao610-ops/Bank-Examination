import type { HTMLAttributes } from "react";


type BadgeVariant = "default" | "success" | "error" | "warning" | "info";

const variants: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700",
  error: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-brand-50 text-brand-700"
};

export function Badge({ variant = "default", className = "", ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${variants[variant]} ${className}`} {...props} />;
}

