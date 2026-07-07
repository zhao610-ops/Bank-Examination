import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { OptionButton } from "@/components/quiz/OptionButton";
import type { AnswerOption, AnswerResult, Question } from "@/types";


interface QuestionCardProps {
  question: Question;
  selected: AnswerOption | null;
  result: AnswerResult | null;
  submitting: boolean;
  onSelect: (option: AnswerOption) => void;
  onSubmit: () => void;
}

const difficultyLabels = { easy: "基础", medium: "中等", hard: "冲刺" };
const options: AnswerOption[] = ["A", "B", "C", "D"];

export function QuestionCard({ question, selected, result, submitting, onSelect, onSubmit }: QuestionCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-2">
        <Badge variant="info">{question.category}｜{question.sub_category}</Badge>
        <Badge variant={question.difficulty === "hard" ? "warning" : "default"}>{difficultyLabels[question.difficulty]}</Badge>
        <Badge>{question.knowledge_point}</Badge>
      </CardHeader>
      <CardContent>
        <h1 className="text-base font-medium leading-8 text-slate-950 sm:text-lg">{question.question}</h1>
        <div className="mt-6 space-y-3" role="radiogroup" aria-label="答案选项">
          {options.map((option) => (
            <OptionButton
              key={option}
              option={option}
              text={question.options[option]}
              selected={selected === option}
              result={result}
              onSelect={onSelect}
            />
          ))}
        </div>
        {!result && (
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
            <p className="text-xs text-slate-400">选择一个答案后提交</p>
            <Button disabled={!selected} loading={submitting} onClick={onSubmit}>
              {submitting ? "正在提交答案..." : "提交答案"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

