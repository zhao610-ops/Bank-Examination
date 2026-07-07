from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Bank(Base):
    __tablename__ = "banks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    bank_type: Mapped[str] = mapped_column(String(50), index=True)
    bank_name: Mapped[str] = mapped_column(String(100), unique=True)
    region: Mapped[str] = mapped_column(String(100), default="全国")
    features: Mapped[str] = mapped_column(Text, default="")


class QuestionCategory(Base):
    __tablename__ = "question_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("question_categories.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(100), index=True)
    level: Mapped[int] = mapped_column(Integer)


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    bank_type: Mapped[str] = mapped_column(String(50))
    target_bank: Mapped[str] = mapped_column(String(100))
    job_type: Mapped[str] = mapped_column(String(50))
    category: Mapped[str] = mapped_column(String(50), index=True)
    sub_category: Mapped[str] = mapped_column(String(50), index=True)
    difficulty: Mapped[str] = mapped_column(String(20))
    question_text: Mapped[str] = mapped_column(Text)
    options: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(String(1))
    explanation: Mapped[str] = mapped_column(Text)
    knowledge_point: Mapped[str] = mapped_column(String(200))
    mistake_tips: Mapped[str] = mapped_column(Text)
    source_type: Mapped[str] = mapped_column(String(20), default="llm")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class UserAnswer(Base):
    __tablename__ = "user_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"), index=True)
    user_answer: Mapped[str] = mapped_column(String(1))
    is_correct: Mapped[bool] = mapped_column(Boolean)
    mistake_reason: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class UserStat(Base):
    __tablename__ = "user_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category: Mapped[str] = mapped_column(String(50), index=True)
    sub_category: Mapped[str] = mapped_column(String(50), index=True)
    total_count: Mapped[int] = mapped_column(Integer, default=0)
    correct_count: Mapped[int] = mapped_column(Integer, default=0)
    accuracy: Mapped[float] = mapped_column(Float, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)

