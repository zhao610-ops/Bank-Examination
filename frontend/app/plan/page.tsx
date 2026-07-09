"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Progress } from "@/components/ui/Progress";
import { Select } from "@/components/ui/Select";
import { api } from "@/lib/api";
import { EXAM_TYPES, FALLBACK_BANKS, JOB_TYPES, TRAINING_STORAGE_KEY } from "@/lib/constants";
import type { BankGroup, CreateExamPlanPayload, DailyTask, ExamPlan, PlanProgress, TodayPlan, TrainingConfig } from "@/types";


function tomorrow() {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function phases(remainingDays: number) {
  if (remainingDays > 60) return ["基础建立期", "专项强化期", "模拟冲刺期", "考前复盘期"];
  if (remainingDays > 30) return ["高频模块强化", "错题专项突破", "模拟考试冲刺"];
  if (remainingDays > 15) return ["核心高频题训练", "薄弱点突破", "考前模拟与复盘"];
  return ["高频题速刷", "错题复盘", "模拟考试", "考前记忆"];
}

const initialForm: CreateExamPlanPayload = {
  exam_type: EXAM_TYPES[0],
  bank_type: FALLBACK_BANKS[0].bank_type,
  target_bank: FALLBACK_BANKS[0].banks[0].bank_name,
  job_type: JOB_TYPES[0],
  exam_date: tomorrow()
};

export default function PlanPage() {
  const router = useRouter();
  const [banks, setBanks] = useState<BankGroup[]>(FALLBACK_BANKS);
  const [form, setForm] = useState<CreateExamPlanPayload>(initialForm);
  const [plan, setPlan] = useState<ExamPlan | null>(null);
  const [today, setToday] = useState<TodayPlan | null>(null);
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentBanks = useMemo(
    () => banks.find((group) => group.bank_type === form.bank_type)?.banks ?? [],
    [banks, form.bank_type]
  );

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [bankData, current] = await Promise.all([api.getBanks().catch(() => FALLBACK_BANKS), api.getCurrentExamPlan()]);
      setBanks(bankData.length ? bankData : FALLBACK_BANKS);
      setPlan(current);
      if (current) {
        setForm({
          exam_type: current.exam_type,
          bank_type: current.bank_type,
          target_bank: current.target_bank,
          job_type: current.job_type,
          exam_date: current.exam_date
        });
        const [todayData, progressData] = await Promise.all([api.getTodayPlan(), api.getPlanProgress()]);
        setToday(todayData);
        setProgress(progressData);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "备考计划加载失败。 ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function update<K extends keyof CreateExamPlanPayload>(key: K, value: CreateExamPlanPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeBankType(value: string) {
    const targetBank = banks.find((group) => group.bank_type === value)?.banks[0]?.bank_name ?? "";
    setForm((current) => ({ ...current, bank_type: value, target_bank: targetBank }));
  }

  async function createPlan() {
    setSaving(true);
    setError("");
    try {
      await api.createExamPlan(form);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "备考计划生成失败。 ");
    } finally {
      setSaving(false);
    }
  }

  function startTask(task: DailyTask) {
    if (!plan) return;
    const config: TrainingConfig = {
      exam_type: plan.exam_type,
      bank_type: plan.bank_type,
      target_bank: plan.target_bank,
      job_type: plan.job_type,
      category: task.category,
      sub_category: task.sub_category,
      difficulty: "easy",
      question_count: Math.max(task.target_count - task.completed_count, 1),
      source_mode: "normal"
    };
    sessionStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(config));
    router.push("/quiz");
  }

  if (loading) return <PageShell><LoadingState message="正在加载备考计划..." /></PageShell>;
  if (error && !plan) return <PageShell><ErrorState description={error} onRetry={() => void load()} /></PageShell>;

  return (
    <PageShell>
      <Badge variant="info">智能备考计划</Badge>
      <h1 className="page-title mt-3">考试倒计时与每日训练</h1>
      <p className="page-description">按考试目标、剩余时间和薄弱模块生成本地规则计划，不依赖大模型。</p>

      {error && <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <Card className="mt-8 overflow-hidden border-slate-800 !bg-slate-950 !text-white">
        <CardContent className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
          {plan ? (
            <>
              <div>
                <p className="text-sm text-blue-200">{plan.exam_type} · {plan.job_type}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">距离 {plan.target_bank}{plan.exam_type}笔试还有 {plan.remaining_days} 天</h2>
                <p className="mt-3 text-sm text-slate-300">考试日期：{plan.exam_date} · 当前阶段：{plan.current_stage}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-6 py-4 text-center">
                <strong className="block text-4xl text-white">{plan.remaining_days}</strong>
                <span className="text-xs text-slate-300">剩余天数</span>
              </div>
            </>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-white">未设置考试计划</h2>
              <p className="mt-2 text-sm text-slate-300">填写目标考试信息后即可生成倒计时和今日任务。</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>考试计划设置</CardTitle>
          <CardDescription>创建新计划会更新当前单用户计划并重新生成今日任务。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Select label="考试类型" value={form.exam_type} onChange={(event) => update("exam_type", event.target.value)}>
            {EXAM_TYPES.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select label="银行类型" value={form.bank_type} onChange={(event) => changeBankType(event.target.value)}>
            {banks.map((item) => <option key={item.bank_type}>{item.bank_type}</option>)}
          </Select>
          <Select label="目标银行" value={form.target_bank} onChange={(event) => update("target_bank", event.target.value)}>
            {currentBanks.map((item) => <option key={item.id} value={item.bank_name}>{item.bank_name}</option>)}
          </Select>
          <Select label="岗位类型" value={form.job_type} onChange={(event) => update("job_type", event.target.value)}>
            {JOB_TYPES.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-800">考试日期</span>
            <input type="date" min={tomorrow()} value={form.exam_date} onChange={(event) => update("exam_date", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800" />
          </label>
          <div className="flex items-end"><Button className="w-full" loading={saving} onClick={() => void createPlan()}>生成备考计划</Button></div>
        </CardContent>
      </Card>

      {plan && today && progress && (
        <>
          <section className="mt-8" aria-labelledby="phase-title">
            <h2 id="phase-title" className="text-xl font-semibold text-slate-950">阶段计划</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {phases(plan.remaining_days).map((item, index) => (
                <Card key={item} className={index === 0 ? "border-brand-200 shadow-none" : "shadow-none"}>
                  <CardContent><span className="text-xs font-medium text-brand-700">阶段 {index + 1}</span><h3 className="mt-2 font-semibold text-slate-950">{item}</h3></CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mt-8" aria-labelledby="task-title">
            <h2 id="task-title" className="text-xl font-semibold text-slate-950">今日任务</h2>
            <Card className="mt-4 divide-y divide-slate-100">
              {today.tasks.map((task) => (
                <div key={task.id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:px-6">
                  <div>
                    <h3 className="font-medium text-slate-950">{task.category} / {task.sub_category}</h3>
                    <p className="mt-1 text-sm text-slate-500">{task.completed_count} / {task.target_count} 题 · {task.reason}</p>
                  </div>
                  <Button variant="outline" disabled={task.status === "completed"} onClick={() => startTask(task)}>
                    {task.status === "completed" ? "已完成" : "开始训练"}
                  </Button>
                </div>
              ))}
            </Card>
          </section>

          <section className="mt-8" aria-labelledby="progress-title">
            <h2 id="progress-title" className="text-xl font-semibold text-slate-950">计划进度</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_240px]">
              <Card><CardContent className="space-y-5">
                <Progress label="今日完成率" value={progress.today_completion_rate} showValue />
                <Progress label="本周完成率" value={progress.week_completion_rate} showValue />
                <Progress label="总计划完成率" value={progress.total_completion_rate} showValue />
              </CardContent></Card>
              <Card><CardContent className="grid grid-cols-2 gap-4 text-center lg:grid-cols-1">
                <div><strong className="text-2xl text-slate-950">{progress.streak_days}</strong><p className="text-sm text-slate-500">连续训练天数</p></div>
                <div><strong className="text-2xl text-slate-950">{progress.behind_tasks}</strong><p className="text-sm text-slate-500">落后任务数</p></div>
              </CardContent></Card>
            </div>
          </section>
        </>
      )}
    </PageShell>
  );
}
