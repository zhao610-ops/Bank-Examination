"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { TrainingPreview } from "@/components/training/TrainingPreview";
import { api } from "@/lib/api";
import {
  DIFFICULTIES,
  EXAM_TYPES,
  FALLBACK_BANKS,
  FALLBACK_CATEGORIES,
  JOB_TYPES,
  QUESTION_COUNTS,
  TRAINING_STORAGE_KEY
} from "@/lib/constants";
import type { BankGroup, Category, Difficulty, TrainingConfig } from "@/types";


const initialConfig: TrainingConfig = {
  exam_type: EXAM_TYPES[0],
  bank_type: FALLBACK_BANKS[0].bank_type,
  target_bank: FALLBACK_BANKS[0].banks[0].bank_name,
  job_type: JOB_TYPES[0],
  category: FALLBACK_CATEGORIES[0].name,
  sub_category: FALLBACK_CATEGORIES[0].children[0],
  difficulty: "easy",
  question_count: QUESTION_COUNTS[0]
};

export function TrainingForm() {
  const router = useRouter();
  const [banks, setBanks] = useState<BankGroup[]>(FALLBACK_BANKS);
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [config, setConfig] = useState<TrainingConfig>(initialConfig);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    Promise.all([api.getBanks(), api.getCategories()])
      .then(([bankData, categoryData]) => {
        if (bankData.length) setBanks(bankData);
        if (categoryData.length) setCategories(categoryData);
      })
      .catch(() => setUsingFallback(true));
  }, []);

  const currentBanks = useMemo(
    () => banks.find((group) => group.bank_type === config.bank_type)?.banks ?? [],
    [banks, config.bank_type]
  );
  const currentSubCategories = useMemo(
    () => categories.find((item) => item.name === config.category)?.children ?? [],
    [categories, config.category]
  );

  function update<K extends keyof TrainingConfig>(key: K, value: TrainingConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  function changeBankType(value: string) {
    const firstBank = banks.find((group) => group.bank_type === value)?.banks[0]?.bank_name ?? "";
    setConfig((current) => ({ ...current, bank_type: value, target_bank: firstBank }));
  }

  function changeCategory(value: string) {
    const firstChild = categories.find((item) => item.name === value)?.children[0] ?? "";
    setConfig((current) => ({ ...current, category: value, sub_category: firstChild }));
  }

  function startTraining() {
    sessionStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(config));
    router.push("/quiz");
  }

  return (
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>训练方向</CardTitle>
          <CardDescription>选择目标招聘场景和训练内容，所有选项均已设置合理默认值。</CardDescription>
          {usingFallback && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">后端暂未连接，当前展示本地基础选项；启动后端后可正常生成题目。</p>}
        </CardHeader>
        <CardContent className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
          <Select label="考试类型" name="exam_type" value={config.exam_type} onChange={(event) => update("exam_type", event.target.value)}>
            {EXAM_TYPES.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select label="银行类型" name="bank_type" value={config.bank_type} onChange={(event) => changeBankType(event.target.value)}>
            {banks.map((item) => <option key={item.bank_type}>{item.bank_type}</option>)}
          </Select>
          <Select label="目标银行" name="target_bank" value={config.target_bank} onChange={(event) => update("target_bank", event.target.value)}>
            {currentBanks.map((item) => <option key={item.id} value={item.bank_name}>{item.bank_name}</option>)}
          </Select>
          <Select label="岗位类型" name="job_type" value={config.job_type} onChange={(event) => update("job_type", event.target.value)}>
            {JOB_TYPES.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select label="题目模块" name="category" value={config.category} onChange={(event) => changeCategory(event.target.value)}>
            {categories.map((item) => <option key={item.name}>{item.name}</option>)}
          </Select>
          <Select label="题目小类" name="sub_category" value={config.sub_category} onChange={(event) => update("sub_category", event.target.value)}>
            {currentSubCategories.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select label="难度" name="difficulty" value={config.difficulty} onChange={(event) => update("difficulty", event.target.value as Difficulty)}>
            {DIFFICULTIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </Select>
          <Select label="题量" name="question_count" value={config.question_count} onChange={(event) => update("question_count", Number(event.target.value))} hint="每道题提交后生成下一题">
            {QUESTION_COUNTS.map((item) => <option key={item} value={item}>{item} 题</option>)}
          </Select>
        </CardContent>
      </Card>
      <TrainingPreview config={config} onStart={startTraining} />
    </div>
  );
}

