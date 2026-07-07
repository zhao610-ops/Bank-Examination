"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import type { ExamPlan, TodayPlan } from "@/types";


export function ExamCountdownCard() {
  const [plan, setPlan] = useState<ExamPlan | null>(null);
  const [today, setToday] = useState<TodayPlan | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.getCurrentExamPlan()
      .then(async (current) => {
        setPlan(current);
        if (current) setToday(await api.getTodayPlan());
      })
      .catch(() => setPlan(null))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <Card className="mb-6 overflow-hidden border-brand-100 bg-brand-50/40 shadow-none">
      <CardContent className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        {!loaded ? (
          <p className="text-sm text-slate-500">正在读取考试计划...</p>
        ) : plan ? (
          <>
            <div>
              <p className="text-sm font-medium text-brand-700">考试倒计时</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">
                距离 {plan.target_bank}{plan.exam_type}笔试还有 {plan.remaining_days} 天
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                当前阶段：{plan.current_stage} · 今日建议训练 {today?.tasks.reduce((sum, task) => sum + task.target_count, 0) ?? 0} 题
              </p>
            </div>
            <Link href="/plan" className="link-button shrink-0">查看备考计划</Link>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm font-medium text-brand-700">考试倒计时</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">还没有设置考试日期</h3>
              <p className="mt-2 text-sm text-slate-600">设置目标后，系统将生成阶段计划和每日任务。</p>
            </div>
            <Link href="/plan" className="link-button shrink-0">设置考试日期</Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
