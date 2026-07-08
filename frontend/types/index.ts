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

export interface TrainingRecommendRequest {
  exam_type: string;
  bank_type: string;
  target_bank: string;
  job_type: string;
  exam_date: string;
  daily_minutes: number;
}

export interface TrainingTaskRecommendation {
  category: string;
  sub_category: string;
  difficulty: Difficulty;
  question_count: number;
  reason: string;
}

export interface TrainingRecommendation {
  remaining_days: number;
  current_stage: string;
  difficulty: Difficulty;
  total_question_count: number;
  estimated_minutes: number;
  tasks: TrainingTaskRecommendation[];
  suggestions: string[];
}

export interface SmartTrainingPlan {
  exam_type: string;
  bank_type: string;
  target_bank: string;
  job_type: string;
  tasks: TrainingTaskRecommendation[];
}

export interface Question extends GenerateQuestionPayload {
  id: number;
  question: string;
  options: Record<AnswerOption, string>;
  answer: AnswerOption;
  explanation: string;
  knowledge_point: string;
  mistake_tips: string;
  source_type?: string;
  llm_provider?: string;
  llm_model?: string;
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
  bank_type: string;
  target_bank: string;
  job_type: string;
  category: string;
  sub_category: string;
  difficulty: Difficulty;
  question: string;
  options: Record<AnswerOption, string>;
  user_answer: AnswerOption;
  correct_answer: AnswerOption;
  explanation: string;
  knowledge_point: string;
  mistake_tips: string;
  mistake_reason: string;
  created_at: string;
}

export interface WrongReviewSession {
  mode: "wrong_review";
  questions: Question[];
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

export interface ExamPlan {
  id: number;
  exam_type: string;
  bank_type: string;
  target_bank: string;
  job_type: string;
  exam_date: string;
  remaining_days: number;
  current_stage: string;
}

export interface DailyTask {
  id: number;
  category: string;
  sub_category: string;
  target_count: number;
  completed_count: number;
  status: string;
  reason: string;
}

export interface TodayPlan {
  date: string;
  remaining_days: number;
  current_stage: string;
  tasks: DailyTask[];
}

export interface PlanProgress {
  today_completion_rate: number;
  week_completion_rate: number;
  total_completion_rate: number;
  streak_days: number;
  behind_tasks: number;
}

export interface CreateExamPlanPayload {
  exam_type: string;
  bank_type: string;
  target_bank: string;
  job_type: string;
  exam_date: string;
}
