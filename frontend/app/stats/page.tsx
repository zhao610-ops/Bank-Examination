"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { ModuleProgress } from "@/components/stats/ModuleProgress";
import { StatCard } from "@/components/stats/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import type { Stats } from "@/types";


interface CategorySummary {
  name: string;
  total: number;
  correct: number;
  accuracy: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStats(await api.getStats());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "能力分析加载失败，请稍后重试。 ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const categoryStats = useMemo<CategorySummary[]>(() => {
    if (!stats) return [];
    const grouped = new Map<string, { total: number; correct: number }>();
    for (const item of stats.modules) {
      const current = grouped.get(item.category) ?? { total: 0, correct: 0 };
      current.total += item.total_count;
      current.correct += item.correct_count;
      grouped.set(item.category, current);
    }
    return Array.from(grouped, ([name, value]) => ({
      name,
      total: value.total,
      correct: value.correct,
      accuracy: value.total ? Math.round((value.correct / value.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [stats]);

  return (
    <PageShell>
      <Badge variant="info">学习数据</Badge>
      <h1 className="page-title mt-3">能力分析</h1>
      <p className="page-description">根据答题记录分析模块掌握度，识别薄弱点并规划下一步训练。</p>

      <div className="mt-8">
        {loading ? (
          <LoadingState message="正在生成能力分析..." />
        ) : error ? (
          <ErrorState description={error} onRetry={() => void loadStats()} />
        ) : !stats || stats.total_count === 0 ? (
          <EmptyState
            title="暂无能力数据"
            description="请先完成一次训练，系统会在答题后自动更新正确率和薄弱模块。"
            actionLabel="开始训练"
            actionHref="/training"
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="总答题数" value={stats.total_count} hint="累计提交的题目数量" />
              <StatCard label="总正确率" value={`${stats.total_accuracy.toFixed(1)}%`} hint="全部模块综合正确率" tone="success" />
              <StatCard label="错题数" value={stats.total_count - stats.correct_count} hint="建议优先完成复盘" tone="error" />
              <StatCard label="已训练天数" value="1 天" hint="MVP 当前训练周期" tone="warning" />
            </div>

            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>模块正确率</CardTitle>
                  <CardDescription>按一级模块汇总当前答题表现，正确率按答题数量加权计算。</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryStats.map((item) => (
                    <ModuleProgress key={item.name} name={item.name} accuracy={item.accuracy} total={item.total} />
                  ))}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <CardTitle>薄弱点</CardTitle>
                      <Badge variant="warning">待提升</Badge>
                    </div>
                    <CardDescription>正确率低于 70% 的训练模块。</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.weak_points.length ? (
                      <ul className="space-y-3">
                        {stats.weak_points.map((item, index) => (
                          <li key={item} className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-slate-700">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xs font-semibold text-amber-700">{index + 1}</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">当前已训练模块表现稳定，可以尝试提升题目难度。</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>推荐训练</CardTitle>
                    <CardDescription>基于薄弱模块生成的下一步建议。</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm leading-6 text-slate-600">
                      {(stats.recommendations.length ? stats.recommendations : ["建议选择更高难度继续巩固当前模块"]).map((item) => (
                        <li key={item} className="border-l-2 border-brand-200 pl-3">{item}</li>
                      ))}
                    </ul>
                    <Link href="/training" className="link-button mt-6 w-full">开始针对性训练</Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}

