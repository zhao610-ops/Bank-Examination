import { Badge } from "@/components/ui/Badge";
import { SOURCE_TYPE_LABELS, VERIFICATION_STATUS_LABELS } from "@/lib/constants";
import type { Question } from "@/types";


export function QuestionSourceBadges({ question }: { question: Question }) {
  const labels = [
    SOURCE_TYPE_LABELS[question.source_type ?? "ai_generated"],
    question.verification_status ? VERIFICATION_STATUS_LABELS[question.verification_status] : null,
    question.source_bank,
    question.exam_year ? String(question.exam_year) : null
  ].filter(Boolean);

  if (!labels.length) return null;
  const variant = question.source_type === "verified_real_exam" ? "success" : question.source_type === "web_retrieved" ? "warning" : "default";
  return <Badge variant={variant}>{labels.join("｜")}</Badge>;
}
