import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DIFFICULTIES } from "@/lib/constants";
import type { TrainingConfig } from "@/types";


interface TrainingPreviewProps {
  config: TrainingConfig;
  onStart: () => void;
}

export function TrainingPreview({ config, onStart }: TrainingPreviewProps) {
  const difficulty = DIFFICULTIES.find((item) => item.value === config.difficulty)?.label ?? "基础";
  const summary = [
    ["考试批次", config.exam_type],
    ["目标银行", config.target_bank],
    ["岗位方向", config.job_type],
    ["训练模块", `${config.category} · ${config.sub_category}`],
    ["训练难度", difficulty]
  ];

  return (
    <Card className="sticky top-24 border-brand-100">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>本次训练方案</CardTitle>
          <Badge variant="info">{config.question_count} 题</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          {summary.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 last:border-0">
              <dt className="shrink-0 text-sm text-slate-500">{label}</dt>
              <dd className="text-right text-sm font-medium text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 rounded-xl bg-brand-50 p-4">
          <p className="text-xs font-medium text-brand-700">训练重点</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">聚焦“{config.sub_category}”核心考点，提交后即时查看答案解析与错因。</p>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">预计用时</span>
          <span className="font-medium text-slate-800">约 {Math.ceil(config.question_count * 1.5)} 分钟</span>
        </div>
        <Button className="mt-6 w-full" onClick={onStart}>开始训练</Button>
        <p className="mt-3 text-center text-xs text-slate-400">题目将由 AI 根据当前配置生成</p>
      </CardContent>
    </Card>
  );
}

