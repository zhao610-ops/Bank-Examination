import { Progress } from "@/components/ui/Progress";


interface ModuleProgressProps {
  name: string;
  accuracy: number;
  total: number;
}

export function ModuleProgress({ name, accuracy, total }: ModuleProgressProps) {
  const tone = accuracy >= 80 ? "success" : accuracy >= 60 ? "brand" : accuracy >= 40 ? "warning" : "error";
  return (
    <div className="border-b border-slate-100 py-4 first:pt-0 last:border-0 last:pb-0">
      <Progress value={accuracy} label={name} showValue tone={tone} />
      <p className="mt-2 text-xs text-slate-400">已完成 {total} 题</p>
    </div>
  );
}

