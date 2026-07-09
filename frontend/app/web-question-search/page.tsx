"use client";

import { useEffect, useMemo, useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { QuestionSourceBadges } from "@/components/quiz/QuestionSourceBadges";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { api } from "@/lib/api";
import { DIFFICULTIES, FALLBACK_CATEGORIES, JOB_TYPES, SOURCE_TYPE_LABELS, VERIFICATION_STATUS_LABELS } from "@/lib/constants";
import type { AnswerOption, Question, WebQuestionCandidate, WebQuestionSearchRequest } from "@/types";


const currentYear = new Date().getFullYear();
const optionKeys: AnswerOption[] = ["A", "B", "C", "D"];

const initialSearch: WebQuestionSearchRequest = {
  bank_name: "广州银行",
  exam_year: currentYear,
  category: FALLBACK_CATEGORIES[0].name,
  position_type: JOB_TYPES[0],
  max_results: 5
};

function confidenceText(value?: number | null) {
  if (value == null) return "未知";
  return `${Math.round(value * 100)}%`;
}

export default function WebQuestionSearchPage() {
  const [form, setForm] = useState<WebQuestionSearchRequest>(initialSearch);
  const [subCategory, setSubCategory] = useState(FALLBACK_CATEGORIES[0].children[0]);
  const [candidates, setCandidates] = useState<WebQuestionCandidate[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [imported, setImported] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingKey, setImportingKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const currentSubCategories = useMemo(
    () => FALLBACK_CATEGORIES.find((item) => item.name === form.category)?.children ?? [],
    [form.category]
  );

  useEffect(() => {
    void refreshImported();
  }, []);

  async function refreshImported() {
    try {
      setImported(await api.getImportedWebQuestions());
    } catch {
      setImported([]);
    }
  }

  function updateForm<K extends keyof WebQuestionSearchRequest>(key: K, value: WebQuestionSearchRequest[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeCategory(value: string) {
    updateForm("category", value);
    setSubCategory(FALLBACK_CATEGORIES.find((item) => item.name === value)?.children[0] ?? "");
  }

  async function search() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await api.searchWebQuestions(form);
      setCandidates(result.candidates);
      setKeywords(result.keywords);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "检索失败，请检查后端服务。");
    } finally {
      setLoading(false);
    }
  }

  async function importCandidate(candidate: WebQuestionCandidate) {
    if (!candidate.correct_answer) return;
    setImportingKey(candidate.question_text);
    setError("");
    setMessage("");
    try {
      await api.importWebQuestion({
        bank_type: "未知",
        target_bank: candidate.bank_name,
        job_type: form.position_type || "未知",
        category: candidate.category,
        sub_category: subCategory || "AI检索",
        difficulty: candidate.difficulty,
        question_text: candidate.question_text,
        options: candidate.options,
        correct_answer: candidate.correct_answer,
        explanation: candidate.explanation,
        knowledge_point: candidate.knowledge_point,
        source_bank: candidate.bank_name,
        exam_year: candidate.exam_year,
        source_url: candidate.source_url,
        source_title: candidate.source_title,
        confidence_score: candidate.confidence_score
      });
      setMessage("已导入题库，状态为 AI检索 / 待核验。");
      setCandidates((items) => items.map((item) => item.question_text === candidate.question_text ? { ...item, is_imported: true } : item));
      await refreshImported();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "导入失败。");
    } finally {
      setImportingKey("");
    }
  }

  async function updateQuestionStatus(questionId: number, action: "verify" | "reject") {
    setError("");
    setMessage("");
    try {
      await (action === "verify" ? api.verifyQuestion(questionId) : api.rejectQuestion(questionId));
      setMessage(action === "verify" ? "已标记为已核验真题。" : "已驳回该题。");
      await refreshImported();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "操作失败。");
    }
  }

  return (
    <PageShell>
      <Badge variant="info">AI 真题检索</Badge>
      <h1 className="page-title mt-3">AI 真题检索</h1>
      <p className="page-description">检索公开网页中的疑似真题或回忆版题目，默认按 AI检索 / 待核验 管理。</p>

      {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>搜索条件</CardTitle>
            <CardDescription>银行、年份、岗位和题型会组合成检索关键词。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800">银行名称</span>
              <input value={form.bank_name} onChange={(event) => updateForm("bank_name", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800">年份</span>
              <input type="number" value={form.exam_year ?? ""} onChange={(event) => updateForm("exam_year", event.target.value ? Number(event.target.value) : null)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
            </label>
            <Select label="岗位类型" value={form.position_type ?? ""} onChange={(event) => updateForm("position_type", event.target.value)}>
              {JOB_TYPES.map((item) => <option key={item}>{item}</option>)}
            </Select>
            <Select label="题型分类" value={form.category} onChange={(event) => changeCategory(event.target.value)}>
              {FALLBACK_CATEGORIES.map((item) => <option key={item.name}>{item.name}</option>)}
            </Select>
            <Select label="题目小类" value={subCategory} onChange={(event) => setSubCategory(event.target.value)}>
              {currentSubCategories.map((item) => <option key={item}>{item}</option>)}
            </Select>
            <Select label="最大检索数量" value={form.max_results} onChange={(event) => updateForm("max_results", Number(event.target.value))}>
              {[3, 5, 10, 20].map((item) => <option key={item} value={item}>{item} 条</option>)}
            </Select>
            <Button loading={loading} className="w-full" onClick={() => void search()}>开始检索</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>搜索结果</CardTitle>
              <CardDescription>{keywords.length ? `关键词：${keywords.join("；")}` : "候选题会显示来源链接、可信度和完整性。"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!candidates.length ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">暂无候选题</div>
              ) : candidates.map((candidate) => (
                <div key={candidate.question_text} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning">{SOURCE_TYPE_LABELS.web_retrieved}｜{VERIFICATION_STATUS_LABELS.unverified}</Badge>
                    <Badge>{candidate.bank_name}{candidate.exam_year ? `｜${candidate.exam_year}` : ""}</Badge>
                    <Badge variant={candidate.is_complete ? "success" : "error"}>{candidate.is_complete ? "完整" : "不完整"}</Badge>
                    <Badge variant={(candidate.confidence_score ?? 0) >= 0.6 ? "info" : "warning"}>可信度 {confidenceText(candidate.confidence_score)}</Badge>
                  </div>
                  <h2 className="mt-4 text-base font-semibold leading-7 text-slate-950">{candidate.question_text}</h2>
                  <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    {optionKeys.map((key) => <p key={key}>{key}. {candidate.options[key] || "缺失"}</p>)}
                  </div>
                  <p className="mt-3 text-sm text-slate-600">答案：{candidate.correct_answer ?? "缺失"}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">解析：{candidate.explanation || "待补充"}</p>
                  <a className="mt-3 inline-block break-all text-sm font-medium text-brand-700 hover:text-brand-900" href={candidate.source_url} target="_blank" rel="noreferrer">{candidate.source_title}</a>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button disabled={!candidate.is_complete || candidate.is_imported || !candidate.correct_answer} loading={importingKey === candidate.question_text} onClick={() => void importCandidate(candidate)}>
                      {candidate.is_imported ? "已导入" : "导入题库"}
                    </Button>
                    <Button variant="outline" onClick={() => setCandidates((items) => items.filter((item) => item.question_text !== candidate.question_text))}>驳回</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>已导入题目管理</CardTitle>
              <CardDescription>人工审核后才会成为已核验真题。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!imported.length ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">暂无已导入 AI 检索题</div>
              ) : imported.map((question) => (
                <div key={question.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <QuestionSourceBadges question={question} />
                    <Badge>{DIFFICULTIES.find((item) => item.value === question.difficulty)?.label ?? question.difficulty}</Badge>
                  </div>
                  <h2 className="mt-3 text-sm font-semibold leading-6 text-slate-950">{question.question}</h2>
                  {question.source_url && <a className="mt-2 inline-block break-all text-sm text-brand-700 hover:text-brand-900" href={question.source_url} target="_blank" rel="noreferrer">{question.source_title || question.source_url}</a>}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button disabled={question.verification_status === "verified" || question.verification_status === "rejected"} onClick={() => void updateQuestionStatus(question.id, "verify")}>通过审核</Button>
                    <Button variant="danger" disabled={question.verification_status === "rejected"} onClick={() => void updateQuestionStatus(question.id, "reject")}>驳回</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
