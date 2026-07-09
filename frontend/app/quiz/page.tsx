"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { ExplanationCard } from "@/components/quiz/ExplanationCard";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { Card, CardContent } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Progress } from "@/components/ui/Progress";
import { api } from "@/lib/api";
import { SMART_TRAINING_STORAGE_KEY, TRAINING_STORAGE_KEY, WRONG_REVIEW_STORAGE_KEY } from "@/lib/constants";
import type {
  AnswerOption,
  AnswerResult,
  Question,
  SmartTrainingPlan,
  TrainingConfig,
  TrainingTaskRecommendation,
  WrongReviewSession
} from "@/types";


type QuizMode = "smart" | "custom" | "wrong_review";

interface AnswerRecord {
  category: string;
  sub_category: string;
  is_correct: boolean;
  time_used: number;
}

const modeLabels: Record<QuizMode, string> = {
  smart: "智能训练",
  custom: "自定义训练",
  wrong_review: "错题复练"
};

function taskToConfig(plan: SmartTrainingPlan, task: TrainingTaskRecommendation): TrainingConfig {
  return {
    exam_type: plan.exam_type,
    bank_type: plan.bank_type,
    target_bank: plan.target_bank,
    job_type: plan.job_type,
    category: task.category,
    sub_category: task.sub_category,
    difficulty: task.difficulty,
    question_count: task.question_count,
    source_mode: plan.source_mode ?? "normal"
  };
}

function getAdvice(accuracy: number, wrongCount: number, averageTime: number) {
  const advice: string[] = [];
  if (wrongCount > 0) advice.push("建议优先复盘错题。");
  if (accuracy < 60) advice.push("正确率低于 60%，先降低难度继续练基础题。");
  else if (accuracy < 80) advice.push("继续专项强化薄弱模块。");
  else advice.push("可以提高难度或进行模拟训练。");
  if (averageTime > 90) advice.push("平均用时偏长，注意答题速度。");
  return advice.join("");
}

export default function QuizPage() {
  const started = useRef(false);
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [config, setConfig] = useState<TrainingConfig | null>(null);
  const [smartPlan, setSmartPlan] = useState<SmartTrainingPlan | null>(null);
  const [wrongReview, setWrongReview] = useState<WrongReviewSession | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<AnswerOption | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [taskIndex, setTaskIndex] = useState(0);
  const [taskQuestionIndex, setTaskQuestionIndex] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const totalQuestionCount = useMemo(() => {
    if (mode === "smart") return smartPlan?.tasks.reduce((sum, task) => sum + task.question_count, 0) ?? 0;
    if (mode === "wrong_review") return wrongReview?.questions.length ?? 0;
    return config?.question_count ?? 0;
  }, [config?.question_count, mode, smartPlan, wrongReview]);

  const currentTask = smartPlan?.tasks[taskIndex] ?? null;
  const completedModules = useMemo(() => {
    const source = records.length > 0 ? records : [];
    const modules = source.map((item) => `${item.category} / ${item.sub_category}`);
    if (modules.length > 0) return Array.from(new Set(modules));
    if (mode === "smart" && smartPlan) return smartPlan.tasks.map((task) => `${task.category} / ${task.sub_category}`);
    if (mode === "wrong_review" && wrongReview) return Array.from(new Set(wrongReview.questions.map((item) => `${item.category} / ${item.sub_category}`)));
    return config ? [`${config.category} / ${config.sub_category}`] : [];
  }, [config, mode, records, smartPlan, wrongReview]);

  const generate = useCallback(async (trainingConfig: TrainingConfig) => {
    setLoading(true);
    setError("");
    setQuestion(null);
    try {
      const { exam_type: _, question_count: __, ...payload } = trainingConfig;
      const generated = await api.generateQuestion(payload);
      setQuestion(generated);
      setQuestionStartTime(Date.now());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "题目生成失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const smartStored = sessionStorage.getItem(SMART_TRAINING_STORAGE_KEY);
    if (smartStored) {
      try {
        const parsed = JSON.parse(smartStored) as SmartTrainingPlan;
        if (!parsed.tasks.length) throw new Error("empty tasks");
        const firstConfig = taskToConfig(parsed, parsed.tasks[0]);
        setMode("smart");
        setSmartPlan(parsed);
        setConfig(firstConfig);
        void generate(firstConfig);
        return;
      } catch {
        setLoading(false);
        setError("智能训练方案无效，请重新生成。");
        return;
      }
    }

    const wrongStored = sessionStorage.getItem(WRONG_REVIEW_STORAGE_KEY);
    if (wrongStored) {
      try {
        const parsed = JSON.parse(wrongStored) as WrongReviewSession;
        if (parsed.mode !== "wrong_review" || !parsed.questions.length) throw new Error("empty questions");
        setMode("wrong_review");
        setWrongReview(parsed);
        setQuestion(parsed.questions[0]);
        setQuestionStartTime(Date.now());
        setLoading(false);
        return;
      } catch {
        setLoading(false);
        setError("错题复练数据无效，请重新进入错题本。");
        return;
      }
    }

    const stored = sessionStorage.getItem(TRAINING_STORAGE_KEY);
    if (!stored) {
      setLoading(false);
      setError("未找到训练配置，请先选择训练方向。");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as TrainingConfig;
      parsed.source_mode = parsed.source_mode ?? "normal";
      setMode("custom");
      setConfig(parsed);
      void generate(parsed);
    } catch {
      setLoading(false);
      setError("训练配置无效，请重新配置。");
    }
  }, [generate]);

  async function submitAnswer() {
    if (!question || !selected) return;
    const timeUsed = Math.max(0, Math.round((Date.now() - questionStartTime) / 1000));
    setSubmitting(true);
    setError("");
    try {
      const submitResult = await api.submitAnswer(question.id, selected, timeUsed);
      setResult(submitResult);
      setRecords((items) => [
        ...items,
        {
          category: question.category,
          sub_category: question.sub_category,
          is_correct: submitResult.is_correct,
          time_used: timeUsed
        }
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "提交失败，请检查后端服务是否启动。");
    } finally {
      setSubmitting(false);
    }
  }

  function completeTraining() {
    if (mode === "smart") sessionStorage.removeItem(SMART_TRAINING_STORAGE_KEY);
    if (mode === "custom") sessionStorage.removeItem(TRAINING_STORAGE_KEY);
    if (mode === "wrong_review") sessionStorage.removeItem(WRONG_REVIEW_STORAGE_KEY);
    setCompleted(true);
  }

  function resetForNext() {
    setSelected(null);
    setResult(null);
    setNotice("");
  }

  function nextQuestion() {
    if (!mode) return;

    if (mode === "wrong_review") {
      const next = wrongReview?.questions[currentIndex + 1];
      if (!next) {
        completeTraining();
        return;
      }
      resetForNext();
      setCurrentIndex((index) => index + 1);
      setQuestion(next);
      setQuestionStartTime(Date.now());
      return;
    }

    if (!config) return;
    if (mode === "custom") {
      if (currentIndex + 1 >= config.question_count) {
        completeTraining();
        return;
      }
      resetForNext();
      setCurrentIndex((index) => index + 1);
      void generate(config);
      return;
    }

    if (!smartPlan || !currentTask) return;
    if (taskQuestionIndex + 1 < currentTask.question_count) {
      resetForNext();
      setCurrentIndex((index) => index + 1);
      setTaskQuestionIndex((index) => index + 1);
      void generate(config);
      return;
    }

    const nextTask = smartPlan.tasks[taskIndex + 1];
    if (!nextTask) {
      completeTraining();
      return;
    }

    const nextConfig = taskToConfig(smartPlan, nextTask);
    resetForNext();
    setNotice(`${currentTask.sub_category}任务已完成，接下来进入${nextTask.sub_category}。`);
    setTaskIndex((index) => index + 1);
    setTaskQuestionIndex(0);
    setCurrentIndex((index) => index + 1);
    setConfig(nextConfig);
    void generate(nextConfig);
  }

  if (loading) {
    return <PageShell className="max-w-4xl"><LoadingState message="AI 正在生成银行笔试题目..." /></PageShell>;
  }

  if (completed && mode) {
    const completedCount = records.length;
    const correctCount = records.filter((item) => item.is_correct).length;
    const wrongCount = completedCount - correctCount;
    const accuracy = completedCount ? Math.round((correctCount / completedCount) * 100) : 0;
    const totalTime = records.reduce((sum, item) => sum + item.time_used, 0);
    const averageTime = completedCount ? Math.round(totalTime / completedCount) : 0;

    return (
      <PageShell className="max-w-3xl">
        <Card>
          <CardContent className="py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-xl font-semibold text-emerald-700">✓</span>
            <h1 className="mt-5 text-2xl font-semibold text-slate-950">本次训练已完成</h1>
            <p className="mt-2 text-sm text-slate-500">{modeLabels[mode]}完成，可前往能力分析查看结果。</p>
            <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">完成题数</p><p className="mt-1 text-lg font-semibold text-slate-900">{completedCount}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">正确率</p><p className="mt-1 text-lg font-semibold text-slate-900">{accuracy}%</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">正确 / 错误</p><p className="mt-1 text-lg font-semibold text-slate-900">{correctCount} / {wrongCount}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">平均用时</p><p className="mt-1 text-lg font-semibold text-slate-900">{averageTime} 秒 / 题</p></div>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-left">
              <p className="text-xs font-medium text-slate-500">涉及模块</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{completedModules.join("、")}</p>
              <p className="mt-4 text-xs font-medium text-slate-500">总用时</p>
              <p className="mt-2 text-sm text-slate-700">{Math.ceil(totalTime / 60)} 分钟</p>
              <p className="mt-4 text-xs font-medium text-slate-500">下一步建议</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{getAdvice(accuracy, wrongCount, averageTime)}</p>
            </div>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/stats" className="link-button">查看能力分析</Link>
              <Link href="/wrong" className="link-button-outline">复盘错题</Link>
              <Link href="/training" className="link-button-outline">继续训练</Link>
              <Link href="/" className="link-button-outline">返回首页</Link>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (error && !question) {
    return (
      <PageShell className="max-w-4xl">
        <ErrorState title="题目加载失败" description={error} onRetry={config ? () => void generate(config) : undefined} />
        {!config && <div className="mt-4 text-center"><Link href="/training" className="link-button">返回训练配置</Link></div>}
      </PageShell>
    );
  }

  if (!mode || !question) return null;

  const progressValue = totalQuestionCount ? ((currentIndex + 1) / totalQuestionCount) * 100 : 0;
  const isLastQuestion = currentIndex + 1 >= totalQuestionCount;

  return (
    <PageShell className="max-w-4xl">
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-900">{modeLabels[mode]}</span>
            <span className="font-semibold text-slate-900">第 {currentIndex + 1} 题 / 共 {totalQuestionCount} 题</span>
            <span className="text-slate-400">{question.category}</span>
          </div>
          <Link href="/training" className="font-medium text-brand-700 hover:text-brand-900">返回训练配置</Link>
        </div>
        <Progress value={progressValue} />
        {mode === "smart" && currentTask && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-brand-50 px-3 py-2 text-sm">
            <span className="font-medium text-brand-800">当前任务：{currentTask.category} / {currentTask.sub_category}</span>
            <span className="text-brand-700">{taskQuestionIndex + 1} / {currentTask.question_count}</span>
          </div>
        )}
        {mode === "wrong_review" && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            当前模块：{question.category} / {question.sub_category}
          </div>
        )}
      </div>

      {notice && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <QuestionCard
        question={question}
        selected={selected}
        result={result}
        submitting={submitting}
        onSelect={setSelected}
        onSubmit={() => void submitAnswer()}
      />
      {result && selected && (
        <div className="mt-5">
          <ExplanationCard
            question={question}
            selected={selected}
            result={result}
            isLast={isLastQuestion}
            onNext={nextQuestion}
          />
        </div>
      )}
    </PageShell>
  );
}
