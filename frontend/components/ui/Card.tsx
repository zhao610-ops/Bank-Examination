import type { HTMLAttributes } from "react";


function merge(base: string, className?: string) {
  return `${base} ${className ?? ""}`;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={merge("rounded-2xl border border-slate-200 bg-white shadow-card", className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={merge("p-5 pb-0 sm:p-6 sm:pb-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={merge("text-base font-semibold text-slate-950 sm:text-lg", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={merge("mt-1 text-sm leading-6 text-slate-500", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={merge("p-5 sm:p-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={merge("flex items-center gap-3 border-t border-slate-100 p-5 sm:p-6", className)} {...props} />;
}

