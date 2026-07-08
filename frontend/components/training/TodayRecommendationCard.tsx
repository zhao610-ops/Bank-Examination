"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SMART_TRAINING_STORAGE_KEY } from "@/lib/constants";
import type { SmartTrainingPlan } from "@/types";


export function TodayRecommendationCard() {
  const router = useRouter();
  const [plan, setPlan] = useState<SmartTrainingPlan | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(SMART_TRAINING_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SmartTrainingPlan;
        if (parsed.tasks.length) setPlan(parsed);
      } catch {
        sessionStorage.removeItem(SMART_TRAINING_STORAGE_KEY);
      }
    }
    setLoaded(true);
  }, []);

  const totalCount = useMemo(() => plan?.tasks.reduce((sum, task) => sum + task.question_count, 0) ?? 0, [plan]);
  const estimatedMinutes = Math.max(15, Math.ceil(totalCount * 1.8));

  return (
    <Card className="mt-6 border-brand-100 bg-brand-50/40 shadow-none">
      <CardContent className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        {!loaded || !plan ? (
          <>
            <div>
              <p className="text-sm font-medium text-brand-700">今日推荐训练</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">还没有生成今日训练方案</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">进入训练配置，设置考试目标和每日可用时间后生成智能推荐。</p>
            </div>
            <Link href="/training" className="link-button shrink-0">生成训练方案</Link>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm font-medium text-brand-700">今日推荐训练</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">今日建议 {totalCount} 题，预计 {estimatedMinutes} 分钟</h3>
              <p className="mt-2 text-sm text-slate-600">{plan.target_bank} · {plan.job_type}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {plan.tasks.slice(0, 3).map((task) => (
                  <span key={`${task.category}-${task.sub_category}`} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    {task.sub_category} {task.question_count} 题
                  </span>
                ))}
              </div>
            </div>
            <Button className="shrink-0" onClick={() => router.push("/quiz")}>开始今日训练</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
