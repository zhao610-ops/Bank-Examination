interface ProgressProps {
  value: number;
  label?: string;
  showValue?: boolean;
  tone?: "brand" | "success" | "warning" | "error";
}

const tones = {
  brand: "bg-brand-600",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500"
};

export function Progress({ value, label, showValue = false, tone = "brand" }: ProgressProps) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div>
      {(label || showValue) && (
        <div className="mb-2 flex justify-between gap-4 text-sm">
          <span className="font-medium text-slate-700">{label}</span>
          {showValue && <span className="tabular-nums text-slate-500">{safeValue.toFixed(0)}%</span>}
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full transition-[width] ${tones[tone]}`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

