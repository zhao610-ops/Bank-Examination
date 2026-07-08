import Link from "next/link";

import { PageShell } from "@/components/layout/PageShell";
import { ExamCountdownCard } from "@/components/plan/ExamCountdownCard";
import { TodayRecommendationCard } from "@/components/training/TodayRecommendationCard";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";


const features = [
  { mark: "AI", title: "AI 智能出题", description: "按银行、岗位、模块和难度动态生成针对性题目。" },
  { mark: "✓", title: "自动批改解析", description: "提交后即时判断答案，清晰展示解题过程与考点。" },
  { mark: "!", title: "错题归因", description: "自动沉淀错题，定位知识盲点和常见思维误区。" },
  { mark: "%", title: "能力统计", description: "按模块统计正确率，直观看到训练进展与薄弱项。" },
  { mark: "行", title: "银行专项训练", description: "覆盖国有行、股份行、城商行、农商行和政策性银行。" },
  { mark: "IT", title: "金融科技岗训练", description: "覆盖编程、数据库、网络、算法和信息安全等方向。" }
];

const entrances = [
  { name: "通用银行笔试", description: "EPI、综合知识、英语能力综合训练", accent: "bg-brand-50 text-brand-700" },
  { name: "国有行专项", description: "六大国有银行常见考点专项训练", accent: "bg-blue-50 text-blue-700" },
  { name: "股份制银行专项", description: "聚焦业务理解与综合能力考查", accent: "bg-cyan-50 text-cyan-700" },
  { name: "城商行专项", description: "结合区域银行特点进行针对训练", accent: "bg-indigo-50 text-indigo-700" },
  { name: "农商行专项", description: "覆盖农商行招聘笔试重点模块", accent: "bg-emerald-50 text-emerald-700" },
  { name: "金融科技岗专项", description: "计算机基础与银行科技场景训练", accent: "bg-violet-50 text-violet-700" }
];

const overview = [
  { label: "今日推荐题量", value: "10", suffix: "题" },
  { label: "已完成题数", value: "0", suffix: "题" },
  { label: "当前正确率", value: "—", suffix: "" },
  { label: "薄弱模块", value: "待评估", suffix: "" }
];

export default function HomePage() {
  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <PageShell className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <Badge variant="info">面向银行招聘笔试</Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-[3.4rem]">
              银行笔试 <span className="text-brand-600">AI</span> 刷题平台
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              覆盖秋招、春招、实习招聘、社招笔试，按银行类型、岗位方向和题目模块智能生成训练题。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/training" className="link-button min-w-36">开始今日训练</Link>
              <Link href="/stats" className="link-button-outline min-w-36">查看能力分析</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <span>覆盖 6 类银行</span>
              <span>7 大训练模块</span>
              <span>实时答案解析</span>
            </div>
          </div>

          <Card className="relative overflow-hidden border-slate-800 !bg-slate-950 !text-white shadow-none">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand-600/20 blur-3xl" />
            <CardContent className="relative p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-200">今日训练建议</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">完成一组资料分析专项</h2>
                </div>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">约 15 分钟</span>
              </div>
              <div className="mt-8 space-y-4">
                {["选择目标银行与岗位", "AI 生成针对性题目", "即时批改并定位薄弱点"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-semibold">{index + 1}</span>
                    <span className="text-sm font-medium text-slate-100">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/training" className="mt-6 inline-flex text-sm font-semibold text-blue-200 transition-colors hover:text-white">配置训练方案 →</Link>
            </CardContent>
          </Card>
        </PageShell>
      </section>

      <PageShell>
        <section aria-labelledby="overview-title">
          <ExamCountdownCard />
          <TodayRecommendationCard />
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-700">训练概览</p>
              <h2 id="overview-title" className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">从今天的训练开始</h2>
            </div>
            <Link href="/stats" className="hidden text-sm font-medium text-brand-700 hover:text-brand-900 sm:block">查看完整分析 →</Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overview.map((item) => (
              <Card key={item.label} className="shadow-none">
                <CardContent>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                    {item.value}<span className="ml-1 text-sm font-normal text-slate-400">{item.suffix}</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="entrance-title">
          <div>
            <p className="text-sm font-medium text-brand-700">专项入口</p>
            <h2 id="entrance-title" className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">选择你的备考方向</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">从通用能力到目标银行和岗位，快速建立适合自己的训练路径。</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {entrances.map((item, index) => (
              <Link key={item.name} href={`/training?plan=${index}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-colors hover:border-brand-200">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold ${item.accent}`}>{String(index + 1).padStart(2, "0")}</div>
                <h3 className="mt-5 font-semibold text-slate-950 group-hover:text-brand-700">{item.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                <span className="mt-5 inline-flex text-sm font-medium text-brand-700">进入专项 →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="feature-title">
          <div className="text-center">
            <p className="text-sm font-medium text-brand-700">完整训练闭环</p>
            <h2 id="feature-title" className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">让每次练习都有明确反馈</h2>
          </div>
          <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white p-6 sm:p-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">{feature.mark}</span>
                <h3 className="mt-5 font-semibold text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl bg-brand-700 px-6 py-10 text-center text-white sm:px-10 sm:py-12">
          <h2 className="text-2xl font-semibold">开始建立你的银行笔试能力画像</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-brand-100">先完成一组训练，系统将自动记录正确率、错题和薄弱模块。</p>
          <Link href="/training" className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-5 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50">开始训练</Link>
        </section>
      </PageShell>
    </>
  );
}
