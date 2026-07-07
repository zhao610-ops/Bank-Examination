import type { AnswerOption, AnswerResult } from "@/types";


interface OptionButtonProps {
  option: AnswerOption;
  text: string;
  selected: boolean;
  result: AnswerResult | null;
  onSelect: (option: AnswerOption) => void;
}

export function OptionButton({ option, text, selected, result, onSelect }: OptionButtonProps) {
  const isCorrect = result?.correct_answer === option;
  const isWrongSelection = Boolean(result && selected && !isCorrect);
  let style = "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40";
  let markStyle = "border-slate-200 bg-slate-50 text-slate-600";

  if (!result && selected) {
    style = "border-brand-500 bg-brand-50 ring-2 ring-brand-100";
    markStyle = "border-brand-600 bg-brand-600 text-white";
  } else if (isCorrect) {
    style = "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100";
    markStyle = "border-emerald-600 bg-emerald-600 text-white";
  } else if (isWrongSelection) {
    style = "border-red-400 bg-red-50 ring-2 ring-red-100";
    markStyle = "border-red-600 bg-red-600 text-white";
  } else if (result) {
    style = "border-slate-200 bg-slate-50 opacity-70";
  }

  return (
    <button
      type="button"
      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm leading-6 transition-colors sm:p-5 ${style}`}
      onClick={() => onSelect(option)}
      disabled={Boolean(result)}
      aria-pressed={selected}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold ${markStyle}`}>{option}</span>
      <span className="pt-0.5 text-slate-800">{text}</span>
    </button>
  );
}

