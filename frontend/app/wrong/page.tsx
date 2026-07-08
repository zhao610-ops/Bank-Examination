"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { api } from "@/lib/api";
import { FALLBACK_CATEGORIES, WRONG_REVIEW_STORAGE_KEY } from "@/lib/constants";
import type { Question, WrongQuestion } from "@/types";


export default function WrongQuestionsPage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [questions, setQuestions] = useState<WrongQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setQuestions(await api.getWrongQuestions(category || undefined));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "错题加载失败，请稍后重试。 ");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  function startWrongReview() {
    const reviewQuestions: Question[] = questions.map((item) => ({
      id: item.question_id,
      bank_type: item.bank_type,
      target_bank: item.target_bank,
      job_type: item.job_type,
      category: item.category,
      sub_category: item.sub_category,
      difficulty: item.difficulty,
      question: item.question,
      options: item.options,
      answer: item.correct_answer,
      explanation: item.explanation,
      knowledge_point: item.knowledge_point,
      mistake_tips: item.mistake_tips
    }));
    sessionStorage.setItem(WRONG_REVIEW_STORAGE_KEY, JSON.stringify({ mode: "wrong_review", questions: reviewQuestions }));
    router.push("/quiz");
  }

  return (
    <PageShell>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Badge variant="error">复盘中心</Badge>
          <h1 className="page-title mt-3">错题本</h1>
          <p className="page-description">集中复盘错误答案和原因，修正知识盲点与解题习惯。</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-64">
          <Select label="按模块筛选" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">全部模块</option>
            {FALLBACK_CATEGORIES.map((item) => <option key={item.name}>{item.name}</option>)}
          </Select>
          <Button disabled={loading || questions.length === 0} onClick={startWrongReview}>
            开始错题复练
          </Button>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <LoadingState message="正在加载错题本..." />
        ) : error ? (
          <ErrorState description={error} onRetry={() => void loadQuestions()} />
        ) : questions.length === 0 ? (
          <EmptyState
            title={category ? "该模块暂无错题" : "目前还没有错题，继续保持。"}
            description={category ? "可以切换其他模块查看，或开始新的专项训练。" : "完成训练后，答错的题目会自动收录到这里。"}
            actionLabel="开始训练"
            actionHref="/training"
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>共 {questions.length} 条错题记录</span>
              <span>点击“查看完整解析”展开详情</span>
            </div>
            {questions.map((item, index) => (
              <Card key={item.id}>
                <CardContent>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info">{item.category}</Badge>
                      <Badge>{item.sub_category}</Badge>
                      <span className="text-xs text-slate-400">错题 {String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <time className="text-xs text-slate-400" dateTime={item.created_at}>
                      {new Date(item.created_at).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </div>

                  <h2 className="mt-5 text-sm font-medium leading-7 text-slate-900 sm:text-base">{item.question}</h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-red-50 px-4 py-3">
                      <p className="text-xs text-red-600">你的答案</p>
                      <p className="mt-1 text-sm font-semibold text-red-700">{item.user_answer}．{item.options[item.user_answer]}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-4 py-3">
                      <p className="text-xs text-emerald-600">正确答案</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">{item.correct_answer}．{item.options[item.correct_answer]}</p>
                    </div>
                  </div>

                  <details className="group mt-5 border-t border-slate-100 pt-5">
                    <summary className="cursor-pointer list-none text-sm font-medium text-brand-700 marker:hidden">
                      <span className="group-open:hidden">查看完整解析 ＋</span>
                      <span className="hidden group-open:inline">收起解析 －</span>
                    </summary>
                    <div className="mt-4 grid gap-4 rounded-xl bg-slate-50 p-4 md:grid-cols-2">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-700">答案解析</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{item.explanation}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-slate-700">错因分析</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{item.mistake_reason}</p>
                      </div>
                    </div>
                  </details>

                  <div className="mt-5 flex justify-end">
                    <Link href="/training" className="link-button-outline">重新练习</Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
