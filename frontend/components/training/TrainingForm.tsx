"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { TrainingPreview } from "@/components/training/TrainingPreview";
import { api } from "@/lib/api";
import {
  DAILY_MINUTES_OPTIONS,
  DIFFICULTIES,
  EXAM_TYPES,
  FALLBACK_BANKS,
  FALLBACK_CATEGORIES,
  JOB_TYPES,
  QUESTION_COUNTS,
  SMART_TRAINING_STORAGE_KEY,
  TRAINING_SOURCE_MODES,
  TRAINING_STORAGE_KEY
} from "@/lib/constants";
import type {
  BankGroup,
  Category,
  Difficulty,
  SmartTrainingPlan,
  TrainingConfig,
  TrainingRecommendation,
  TrainingRecommendRequest
} from "@/types";


function dateAfter(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

const initialConfig: TrainingConfig = {
  exam_type: EXAM_TYPES[0],
  bank_type: FALLBACK_BANKS[0].bank_type,
  target_bank: FALLBACK_BANKS[0].banks[0].bank_name,
  job_type: JOB_TYPES[0],
  category: FALLBACK_CATEGORIES[0].name,
  sub_category: FALLBACK_CATEGORIES[0].children[0],
  difficulty: "easy",
  question_count: QUESTION_COUNTS[0],
  source_mode: "normal"
};

const initialSmartForm: TrainingRecommendRequest = {
  exam_type: EXAM_TYPES[0],
  bank_type: FALLBACK_BANKS[2].bank_type,
  target_bank: FALLBACK_BANKS[2].banks[0].bank_name,
  job_type: "综合岗",
  exam_date: dateAfter(48),
  daily_minutes: 30
};

export function TrainingForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"smart" | "custom">("smart");
  const [banks, setBanks] = useState<BankGroup[]>(FALLBACK_BANKS);
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [config, setConfig] = useState<TrainingConfig>(initialConfig);
  const [smartForm, setSmartForm] = useState<TrainingRecommendRequest>(initialSmartForm);
  const [recommendation, setRecommendation] = useState<TrainingRecommendation | null>(null);
  const [smartSourceMode, setSmartSourceMode] = useState(initialConfig.source_mode);
  const [usingFallback, setUsingFallback] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getBanks(), api.getCategories()])
      .then(([bankData, categoryData]) => {
        if (bankData.length) setBanks(bankData);
        if (categoryData.length) setCategories(categoryData);
      })
      .catch(() => setUsingFallback(true));
  }, []);

  const currentSmartBanks = useMemo(
    () => banks.find((group) => group.bank_type === smartForm.bank_type)?.banks ?? [],
    [banks, smartForm.bank_type]
  );
  const currentCustomBanks = useMemo(
    () => banks.find((group) => group.bank_type === config.bank_type)?.banks ?? [],
    [banks, config.bank_type]
  );
  const currentSubCategories = useMemo(
    () => categories.find((item) => item.name === config.category)?.children ?? [],
    [categories, config.category]
  );

  function updateConfig<K extends keyof TrainingConfig>(key: K, value: TrainingConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  function updateSmartForm<K extends keyof TrainingRecommendRequest>(key: K, value: TrainingRecommendRequest[K]) {
    setSmartForm((current) => ({ ...current, [key]: value }));
    setRecommendation(null);
  }

  function changeSmartBankType(value: string) {
    const firstBank = banks.find((group) => group.bank_type === value)?.banks[0]?.bank_name ?? "";
    setSmartForm((current) => ({ ...current, bank_type: value, target_bank: firstBank }));
    setRecommendation(null);
  }

  function changeCustomBankType(value: string) {
    const firstBank = banks.find((group) => group.bank_type === value)?.banks[0]?.bank_name ?? "";
    setConfig((current) => ({ ...current, bank_type: value, target_bank: firstBank }));
  }

  function changeCategory(value: string) {
    const firstChild = categories.find((item) => item.name === value)?.children[0] ?? "";
    setConfig((current) => ({ ...current, category: value, sub_category: firstChild }));
  }

  async function generateRecommendation() {
    setGenerating(true);
    setError("");
    try {
      setRecommendation(await api.recommendTraining(smartForm));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "训练方案生成失败，请检查后端服务是否启动。");
    } finally {
      setGenerating(false);
    }
  }

  function startSmartTraining() {
    if (!recommendation) return;
    const plan: SmartTrainingPlan = {
      exam_type: smartForm.exam_type,
      bank_type: smartForm.bank_type,
      target_bank: smartForm.target_bank,
      job_type: smartForm.job_type,
      source_mode: smartSourceMode,
      tasks: recommendation.tasks
    };
    sessionStorage.setItem(SMART_TRAINING_STORAGE_KEY, JSON.stringify(plan));
    router.push("/quiz");
  }

  function startCustomTraining() {
    sessionStorage.removeItem(SMART_TRAINING_STORAGE_KEY);
    sessionStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(config));
    router.push("/quiz");
  }

  return (
    <div className="mt-8">
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-card">
        <button
          type="button"
          onClick={() => setMode("smart")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${mode === "smart" ? "bg-brand-600 text-white" : "text-slate-600 hover:text-brand-700"}`}
        >
          智能推荐
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${mode === "custom" ? "bg-brand-600 text-white" : "text-slate-600 hover:text-brand-700"}`}
        >
          自定义训练
        </button>
      </div>

      {usingFallback && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">后端暂未连接，当前展示本地基础选项；启动后端后可正常生成题目。</p>}
      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {mode === "smart" ? (
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <Card>
            <CardHeader>
              <CardTitle>今日训练目标</CardTitle>
              <CardDescription>只设置考试目标和可用时间，系统自动推荐模块、题量和难度。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
              <Select label="考试类型" value={smartForm.exam_type} onChange={(event) => updateSmartForm("exam_type", event.target.value)}>
                {EXAM_TYPES.map((item) => <option key={item}>{item}</option>)}
              </Select>
              <Select label="银行类型" value={smartForm.bank_type} onChange={(event) => changeSmartBankType(event.target.value)}>
                {banks.map((item) => <option key={item.bank_type}>{item.bank_type}</option>)}
              </Select>
              <Select label="目标银行" value={smartForm.target_bank} onChange={(event) => updateSmartForm("target_bank", event.target.value)}>
                {currentSmartBanks.map((item) => <option key={item.id} value={item.bank_name}>{item.bank_name}</option>)}
              </Select>
              <Select label="岗位类型" value={smartForm.job_type} onChange={(event) => updateSmartForm("job_type", event.target.value)}>
                {JOB_TYPES.map((item) => <option key={item}>{item}</option>)}
              </Select>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-800">考试日期</span>
                <input type="date" min={dateAfter(0)} value={smartForm.exam_date} onChange={(event) => updateSmartForm("exam_date", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
              </label>
              <Select label="每日可用时间" value={smartForm.daily_minutes} onChange={(event) => updateSmartForm("daily_minutes", Number(event.target.value))}>
                {DAILY_MINUTES_OPTIONS.map((item) => <option key={item} value={item}>{item} 分钟</option>)}
              </Select>
              <Select label="题目来源" value={smartSourceMode} onChange={(event) => setSmartSourceMode(event.target.value as typeof smartSourceMode)} hint="只练真题不足时会提示，不会用生成题冒充。">
                {TRAINING_SOURCE_MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </Select>
              <div className="sm:col-span-2">
                <Button loading={generating} onClick={() => void generateRecommendation()}>生成今日训练方案</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="sticky top-24 border-brand-100">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>智能训练方案</CardTitle>
                {recommendation && <Badge variant="info">{recommendation.total_question_count} 题</Badge>}
              </div>
              <CardDescription>用于安排今天练什么、练多少题；长期阶段计划仍在备考计划页维护。</CardDescription>
            </CardHeader>
            <CardContent>
              {!recommendation ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-slate-800">设置考试目标后生成方案</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">系统会按剩余天数、岗位方向和历史正确率推荐今日题量和模块。</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-brand-50 p-3">
                      <strong className="block text-xl text-brand-700">{recommendation.remaining_days}</strong>
                      <span className="text-xs text-slate-500">剩余天数</span>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <strong className="block text-xl text-slate-950">{recommendation.total_question_count}</strong>
                      <span className="text-xs text-slate-500">建议题量</span>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <strong className="block text-xl text-slate-950">{recommendation.estimated_minutes}</strong>
                      <span className="text-xs text-slate-500">预计分钟</span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">当前阶段：<span className="font-medium text-slate-950">{recommendation.current_stage}</span></p>
                  <div className="mt-5 space-y-4">
                    {recommendation.tasks.map((task, index) => (
                      <div key={`${task.category}-${task.sub_category}-${index}`} className="rounded-xl border border-slate-100 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-950">{task.category} / {task.sub_category}</h3>
                            <p className="mt-1 text-xs text-slate-500">{task.difficulty} · {task.question_count} 题</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">任务 {index + 1}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{task.reason}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-xl bg-brand-50 p-4">
                    <p className="text-xs font-medium text-brand-700">学习建议</p>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                      {recommendation.suggestions.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Button onClick={startSmartTraining}>开始今日训练</Button>
                    <Button variant="outline" onClick={() => setMode("custom")}>调整为自定义训练</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader>
              <CardTitle>自定义训练方向</CardTitle>
              <CardDescription>适合明确知道要练习的模块、难度和题量。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
              <Select label="考试类型" name="exam_type" value={config.exam_type} onChange={(event) => updateConfig("exam_type", event.target.value)}>
                {EXAM_TYPES.map((item) => <option key={item}>{item}</option>)}
              </Select>
              <Select label="银行类型" name="bank_type" value={config.bank_type} onChange={(event) => changeCustomBankType(event.target.value)}>
                {banks.map((item) => <option key={item.bank_type}>{item.bank_type}</option>)}
              </Select>
              <Select label="目标银行" name="target_bank" value={config.target_bank} onChange={(event) => updateConfig("target_bank", event.target.value)}>
                {currentCustomBanks.map((item) => <option key={item.id} value={item.bank_name}>{item.bank_name}</option>)}
              </Select>
              <Select label="岗位类型" name="job_type" value={config.job_type} onChange={(event) => updateConfig("job_type", event.target.value)}>
                {JOB_TYPES.map((item) => <option key={item}>{item}</option>)}
              </Select>
              <Select label="题目模块" name="category" value={config.category} onChange={(event) => changeCategory(event.target.value)}>
                {categories.map((item) => <option key={item.name}>{item.name}</option>)}
              </Select>
              <Select label="题目小类" name="sub_category" value={config.sub_category} onChange={(event) => updateConfig("sub_category", event.target.value)}>
                {currentSubCategories.map((item) => <option key={item}>{item}</option>)}
              </Select>
              <Select label="难度" name="difficulty" value={config.difficulty} onChange={(event) => updateConfig("difficulty", event.target.value as Difficulty)}>
                {DIFFICULTIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </Select>
              <Select label="题量" name="question_count" value={config.question_count} onChange={(event) => updateConfig("question_count", Number(event.target.value))} hint="每道题提交后生成下一题">
                {QUESTION_COUNTS.map((item) => <option key={item} value={item}>{item} 题</option>)}
              </Select>
              <Select label="题目来源" name="source_mode" value={config.source_mode} onChange={(event) => updateConfig("source_mode", event.target.value as typeof config.source_mode)} hint="AI检索题会显示待核验标签。">
                {TRAINING_SOURCE_MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </Select>
            </CardContent>
          </Card>
          <TrainingPreview config={config} onStart={startCustomTraining} />
        </div>
      )}
    </div>
  );
}
