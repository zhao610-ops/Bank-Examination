import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { AnswerOption, AnswerResult, Question } from "@/types";


interface ExplanationCardProps {
  question: Question;
  selected: AnswerOption;
  result: AnswerResult;
  isLast: boolean;
  onNext: () => void;
}

export function ExplanationCard({ question, selected, result, isLast, onNext }: ExplanationCardProps) {
  return (
    <Card className={result.is_correct ? "border-emerald-200" : "border-red-200"}>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>{result.is_correct ? "回答正确" : "回答错误"}</CardTitle>
        <Badge variant={result.is_correct ? "success" : "error"}>{result.is_correct ? "已掌握" : "需复习"}</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">你的答案</p>
            <p className={`mt-1 font-semibold ${result.is_correct ? "text-emerald-700" : "text-red-700"}`}>{selected}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs text-emerald-700">正确答案</p>
            <p className="mt-1 font-semibold text-emerald-800">{result.correct_answer}</p>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">详细解析</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">{result.explanation}</p>
        </div>
        <div className="grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-slate-500">考点</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{question.knowledge_point}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">常见错误</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{question.mistake_tips}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">下一步建议</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{result.next_training_suggestion}</p>
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-100 pt-5">
          <Button onClick={onNext}>{isLast ? "完成训练" : "下一题"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

