from datetime import datetime
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
        return value


class QuestionResponse(GeneratedQuestion):
    id: int


class AnswerSubmitRequest(BaseModel):
    question_id: int = Field(gt=0)
    user_answer: AnswerOption


class AnswerSubmitResponse(BaseModel):
    is_correct: bool
    correct_answer: AnswerOption
    explanation: str
    mistake_reason: str
    next_training_suggestion: str


class WrongQuestionResponse(BaseModel):
    id: int
    question_id: int
    category: str
    sub_category: str
    question: str
    options: dict[str, str]
    user_answer: AnswerOption
    correct_answer: AnswerOption
    explanation: str
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

