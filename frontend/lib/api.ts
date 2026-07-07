import type {
  AnswerOption,
  AnswerResult,
  BankGroup,
  Category,
  GenerateQuestionPayload,
  Question,
  Stats,
  WrongQuestion
} from "@/types";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers }
  });

  if (!response.ok) {
    let message = "请求失败，请稍后重试。";
    try {
      const body = (await response.json()) as { detail?: string };
      message = body.detail ?? message;
    } catch {
      // 非 JSON 错误响应使用默认提示。
    }
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export const api = {
  getBanks: () => request<BankGroup[]>("/api/banks"),
  getCategories: () => request<Category[]>("/api/categories"),
  generateQuestion: (payload: GenerateQuestionPayload) =>
    request<Question>("/api/questions/generate", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  submitAnswer: (questionId: number, userAnswer: AnswerOption) =>
    request<AnswerResult>("/api/answers/submit", {
      method: "POST",
      body: JSON.stringify({ question_id: questionId, user_answer: userAnswer })
    }),
  getWrongQuestions: (category?: string) =>
    request<WrongQuestion[]>(`/api/wrong-questions${category ? `?category=${encodeURIComponent(category)}` : ""}`),
  getStats: () => request<Stats>("/api/stats")
};
