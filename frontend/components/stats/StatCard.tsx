import { Card, CardContent } from "@/components/ui/Card";


interface StatCardProps {
  label: string;
  value: string | number;
  hint: string;
  tone?: "default" | "success" | "warning" | "error";
}

const tones = {
  default: "bg-brand-50 text-brand-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700"
};

export function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <Card className="shadow-none">
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
          </div>
          <span className={`mt-1 h-3 w-3 rounded-full ${tones[tone]}`} />
        </div>
        <p className="mt-3 text-xs text-slate-400">{hint}</p>
      </CardContent>
    </Card>
  );
}

