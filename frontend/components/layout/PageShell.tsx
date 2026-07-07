import type { ReactNode } from "react";


interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className = "" }: PageShellProps) {
  return <main className={`mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 ${className}`}>{children}</main>;
}

