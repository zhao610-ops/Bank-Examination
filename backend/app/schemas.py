from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


AnswerOption = Literal["A", "B", "C", "D"]
Difficulty = Literal["easy", "medium", "hard"]


class QuestionGenerateRequest(BaseModel):
    bank_type: str = Field(min_length=1, max_length=50)
    target_bank: str = Field(min_length=1, max_length=100)
    job_type: str = Field(min_length=1, max_length=50)
    category: str = Field(min_length=1, max_length=50)
    sub_category: str = Field(min_length=1, max_length=50)
    difficulty: Difficulty


class GeneratedQuestion(BaseModel):
    bank_type: str
    target_bank: str
    job_type: str
    category: str
    sub_category: str
    difficulty: Difficulty
    question: str = Field(min_length=1)
    options: dict[str, str]
    answer: AnswerOption
    explanation: str = Field(min_length=1)
    knowledge_point: str = Field(min_length=1)
    mistake_tips: str = Field(min_length=1)

    @field_validator("options")
    @classmethod
    def validate_options(cls, value: dict[str, str]) -> dict[str, str]:
        if set(value) != {"A", "B", "C", "D"} or any(not text.strip() for text in value.values()):
            raise ValueError("选项必须包含非空的 A、B、C、D")
        if len({text.strip() for text in value.values()}) != 4:
            raise ValueError("选项不能完全重复")
        return value


class QuestionResponse(GeneratedQuestion):
    id: int
    source_type: str = "llm"
    llm_provider: str = "mock"
    llm_model: str = "mock"


class AnswerSubmitRequest(BaseModel):
    question_id: int = Field(gt=0)
    user_answer: AnswerOption
    time_used: int | None = Field(default=None, ge=0)


class AnswerSubmitResponse(BaseModel):
    is_correct: bool
    correct_answer: AnswerOption
    explanation: str
    mistake_reason: str
    next_training_suggestion: str


class LLMStatusResponse(BaseModel):
    provider: str
    model: str
    allow_llm: bool
    has_api_key: bool
    use_mock_when_no_key: bool
    status: Literal["ready", "mock_fallback", "disabled"]


class WrongQuestionResponse(BaseModel):
    id: int
    question_id: int
    bank_type: str
    target_bank: str
    job_type: str
    category: str
    sub_category: str
    difficulty: Difficulty
    question: str
    options: dict[str, str]
    user_answer: AnswerOption
    correct_answer: AnswerOption
    explanation: str
    knowledge_point: str
    mistake_tips: str
    mistake_reason: str
    created_at: datetime


class ModuleStat(BaseModel):
    category: str
    sub_category: str
    total_count: int
    correct_count: int
    accuracy: float


class StatsResponse(BaseModel):
    total_count: int
    correct_count: int
    total_accuracy: float
    modules: list[ModuleStat]
    weak_points: list[str]
    recommendations: list[str]


class BankResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    bank_type: str
    bank_name: str
    region: str
    features: str


class BankGroupResponse(BaseModel):
    bank_type: str
    banks: list[BankResponse]


class CategoryResponse(BaseModel):
    name: str
    children: list[str]


class ExamPlanCreateRequest(BaseModel):
    exam_type: str = Field(min_length=1, max_length=50)
    bank_type: str = Field(min_length=1, max_length=50)
    target_bank: str = Field(min_length=1, max_length=100)
    job_type: str = Field(min_length=1, max_length=50)
    exam_date: date


class ExamPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    exam_type: str
    bank_type: str
    target_bank: str
    job_type: str
    exam_date: date
    remaining_days: int
    current_stage: str


class DailyTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: str
    sub_category: str
    target_count: int
    completed_count: int
    status: str
    reason: str


class TodayPlanResponse(BaseModel):
    date: date
    remaining_days: int
    current_stage: str
    tasks: list[DailyTaskResponse]


class PlanProgressResponse(BaseModel):
    today_completion_rate: float
    week_completion_rate: float
    total_completion_rate: float
    streak_days: int
    behind_tasks: int


class TrainingRecommendRequest(BaseModel):
    exam_type: str = Field(min_length=1, max_length=50)
    bank_type: str = Field(min_length=1, max_length=50)
    target_bank: str = Field(min_length=1, max_length=100)
    job_type: str = Field(min_length=1, max_length=50)
    exam_date: date
    daily_minutes: int = Field(ge=15, le=90)


class TrainingTaskRecommendation(BaseModel):
    category: str
    sub_category: str
    difficulty: Difficulty
    question_count: int
    reason: str


class TrainingRecommendResponse(BaseModel):
    remaining_days: int
    current_stage: str
    difficulty: Difficulty
    total_question_count: int
    estimated_minutes: int
    tasks: list[TrainingTaskRecommendation]
    suggestions: list[str]
