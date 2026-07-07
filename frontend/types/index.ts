export type AnswerOption = "A" | "B" | "C" | "D";
export type Difficulty = "easy" | "medium" | "hard";

export interface TrainingConfig {
  exam_type: string;
  bank_type: string;
  target_bank: string;
  job_type: string;
  category: string;
  sub_category: string;
  difficulty: Difficulty;
  question_count: number;
}

export type GenerateQuestionPayload = Omit<TrainingConfig, "exam_type" | "question_count">;

export interface Question extends GenerateQuestionPayload {
  id: number;
  question: string;
  options: Record<AnswerOption, string>;
  answer: AnswerOption;
  explanation: string;
  knowledge_point: string;
  mistake_tips: string;
}

export interface AnswerResult {
  is_correct: boolean;
  correct_answer: AnswerOption;
  explanation: string;
  mistake_reason: string;
  next_training_suggestion: string;
}

export interface WrongQuestion {
  id: number;
  question_id: number;
  category: string;
  sub_category: string;
  question: string;
  options: Record<AnswerOption, string>;
  user_answer: AnswerOption;
  correct_answer: AnswerOption;
  explanation: string;
  mistake_reason: string;
  created_at: string;
}

export interface ModuleStat {
  category: string;
  sub_category: string;
  total_count: number;
  correct_count: number;
  accuracy: number;
}

export interface Stats {
  total_count: number;
  correct_count: number;
  total_accuracy: number;
  modules: ModuleStat[];
  weak_points: string[];
  recommendations: string[];
}

export interface Bank {
  id: number;
  bank_type: string;
  bank_name: string;
  region: string;
  features: string;
}

export interface BankGroup {
  bank_type: string;
  banks: Bank[];
}

export interface Category {
  name: string;
  children: string[];
}

