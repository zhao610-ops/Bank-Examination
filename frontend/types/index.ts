export type AnswerOption = "A" | "B" | "C" | "D";
export type Difficulty = "easy" | "medium" | "hard";
export type SourceType = "ai_generated" | "web_retrieved" | "verified_real_exam" | "mock_exam" | "imported" | "manual";
export type VerificationStatus = "unverified" | "verified" | "rejected";
export type TrainingSourceMode = "normal" | "real_only" | "web_retrieved";

export interface TrainingConfig {
  exam_type: string;
  bank_type: string;
  target_bank: string;
  job_type: string;
  category: string;
  sub_category: string;
  difficulty: Difficulty;
  question_count: number;
  source_mode: TrainingSourceMode;
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

export interface LLMStatus {
  provider: string;
  model: string;
  allow_llm: boolean;
  has_api_key: boolean;
  use_mock_when_no_key: boolean;
  status: "ready" | "mock_fallback" | "disabled";
}

export interface SmartTrainingPlan {
  exam_type: string;
  bank_type: string;
  target_bank: string;
  job_type: string;
  source_mode: TrainingSourceMode;
  tasks: TrainingTaskRecommendation[];
}

export interface Question extends Omit<GenerateQuestionPayload, "source_mode"> {
  id: number;
  source_mode?: TrainingSourceMode;
  question: string;
  options: Record<AnswerOption, string>;
  answer: AnswerOption;
  explanation: string;
  knowledge_point: string;
  mistake_tips: string;
  source_type?: SourceType;
  source_bank?: string | null;
  exam_year?: number | null;
  source_url?: string | null;
  source_title?: string | null;
  retrieved_at?: string | null;
  verification_status?: VerificationStatus;
  confidence_score?: number | null;
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

export interface WebQuestionSearchRequest {
  bank_name: string;
  exam_year?: number | null;
  category: string;
  position_type?: string | null;
  max_results: number;
}

export interface WebQuestionCandidate {
  question_text: string;
  options: Record<AnswerOption, string>;
  correct_answer: AnswerOption | null;
  explanation: string;
  category: string;
  difficulty: Difficulty;
  knowledge_point: string;
  bank_name: string;
  exam_year?: number | null;
  source_url: string;
  source_title: string;
  confidence_score?: number | null;
  is_complete: boolean;
  is_imported: boolean;
  import_error?: string | null;
}

export interface WebQuestionSearchResponse {
  keywords: string[];
  candidates: WebQuestionCandidate[];
}

export interface WebQuestionImportPayload {
  bank_type: string;
  target_bank: string;
  job_type: string;
  category: string;
  sub_category: string;
  difficulty: Difficulty;
  question_text: string;
  options: Record<AnswerOption, string>;
  correct_answer: AnswerOption;
  explanation: string;
  knowledge_point: string;
  source_bank?: string | null;
  exam_year?: number | null;
  source_url: string;
  source_title: string;
  confidence_score?: number | null;
}
