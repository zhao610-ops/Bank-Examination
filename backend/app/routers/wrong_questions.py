import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Question, UserAnswer
from app.schemas import WrongQuestionResponse


router = APIRouter(prefix="/api/wrong-questions", tags=["错题本"])


@router.get("", response_model=list[WrongQuestionResponse])
def get_wrong_questions(
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[WrongQuestionResponse]:
    statement = (
        select(UserAnswer, Question)
        .join(Question, UserAnswer.question_id == Question.id)
        .where(UserAnswer.is_correct.is_(False))
        .order_by(UserAnswer.created_at.desc())
    )
    if category:
        statement = statement.where(Question.category == category)

    return [
        WrongQuestionResponse(
            id=answer.id,
            question_id=question.id,
            bank_type=question.bank_type,
            target_bank=question.target_bank,
            job_type=question.job_type,
            category=question.category,
            sub_category=question.sub_category,
            difficulty=question.difficulty,
            question=question.question_text,
            options=json.loads(question.options),
            user_answer=answer.user_answer,
            correct_answer=question.answer,
            explanation=question.explanation,
            knowledge_point=question.knowledge_point,
            mistake_tips=question.mistake_tips,
            mistake_reason=answer.mistake_reason,
            created_at=answer.created_at,
        )
        for answer, question in db.execute(statement).all()
    ]
