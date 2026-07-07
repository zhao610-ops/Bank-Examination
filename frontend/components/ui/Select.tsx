import type { SelectHTMLAttributes } from "react";


interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
}

export function Select({ label, hint, className = "", children, id, ...props }: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <label className="block" htmlFor={selectId}>
      <span className="mb-2 block text-sm font-medium text-slate-800">{label}</span>
      <select
        id={selectId}
        className={`h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 transition-colors hover:border-slate-300 disabled:bg-slate-100 ${className}`}
        {...props}
      >
        {children}
      </select>
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

