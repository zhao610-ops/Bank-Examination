"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { ExplanationCard } from "@/components/quiz/ExplanationCard";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { Card, CardContent } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Progress } from "@/components/ui/Progress";
import { api } from "@/lib/api";
import { TRAINING_STORAGE_KEY } from "@/lib/constants";
import type { AnswerOption, AnswerResult, Question, TrainingConfig } from "@/types";


export default function QuizPage() {
  const started = useRef(false);
  const [config, setConfig] = useState<TrainingConfig | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<AnswerOption | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const generate = useCallback(async (trainingConfig: TrainingConfig) => {
    setLoading(true);
    setError("");
    setQuestion(null);
    try {
      const { exam_type: _, question_count: __, ...payload } = trainingConfig;
      setQuestion(await api.generateQuestion(payload));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "题目生成失败，请稍后重试。 ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const stored = sessionStorage.getItem(TRAINING_STORAGE_KEY);
    if (!stored) {
      setLoading(false);
      setError("未找到训练配置，请先选择训练方向。 ");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as TrainingConfig;
      setConfig(parsed);
      void generate(parsed);
    } catch {
      setLoading(false);
      setError("训练配置无效，请重新配置。 ");
    }
  }, [generate]);

  async function submitAnswer() {
    if (!question || !selected) return;
    setSubmitting(true);
    setError("");
    try {
      setResult(await api.submitAnswer(question.id, selected));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "提交失败，请检查后端服务是否启动。 ");
    } finally {
      setSubmitting(false);
    }
  }

  function nextQuestion() {
    if (!config) return;
    if (currentIndex + 1 >= config.question_count) {
      setCompleted(true);
      return;
    }
    setCurrentIndex((index) => index + 1);
    setSelected(null);
    setResult(null);
    void generate(config);
  }

  if (loading) {
    return <PageShell className="max-w-4xl"><LoadingState message="AI 正在生成银行笔试题目..." /></PageShell>;
  }

  if (completed && config) {
    return (
      <PageShell className="max-w-3xl">
        <Card>
          <CardContent className="py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-xl font-semibold text-emerald-700">✓</span>
            <h1 className="mt-5 text-2xl font-semibold text-slate-950">本次训练已完成</h1>
            <p className="mt-2 text-sm text-slate-500">已完成 {config.question_count} 道 {config.sub_category} 训练题，可前往能力分析查看结果。</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/stats" className="link-button">查看能力分析</Link>
              <Link href="/wrong" className="link-button-outline">复盘错题</Link>
              <Link href="/training" className="link-button-outline">继续训练</Link>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (error && !question) {
    return (
      <PageShell className="max-w-4xl">
        <ErrorState title="题目生成失败" description={error} onRetry={config ? () => void generate(config) : undefined} />
        {!config && <div className="mt-4 text-center"><Link href="/training" className="link-button">返回训练配置</Link></div>}
      </PageShell>
    );
  }

  if (!config || !question) return null;

  return (
    <PageShell className="max-w-4xl">
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-900">第 {currentIndex + 1} 题 / 共 {config.question_count} 题</span>
            <span className="text-slate-400">{config.category}</span>
          </div>
          <Link href="/training" className="font-medium text-brand-700 hover:text-brand-900">返回训练配置</Link>
        </div>
        <Progress value={((currentIndex + 1) / config.question_count) * 100} />
      </div>

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
            isLast={currentIndex + 1 >= config.question_count}
            onNext={nextQuestion}
          />
        </div>
      )}
    </PageShell>
  );
}

