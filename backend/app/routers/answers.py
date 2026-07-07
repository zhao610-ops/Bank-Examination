from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Question, UserAnswer, UserStat
from app.schemas import AnswerSubmitRequest, AnswerSubmitResponse


router = APIRouter(prefix="/api/answers", tags=["答题"])


@router.post("/submit", response_model=AnswerSubmitResponse)
def submit_answer(payload: AnswerSubmitRequest, db: Session = Depends(get_db)) -> AnswerSubmitResponse:
    question = db.get(Question, payload.question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="题目不存在")

    is_correct = payload.user_answer == question.answer
    mistake_reason = "回答正确，已掌握该考点。" if is_correct else f"选择了 {payload.user_answer}，可能未掌握“{question.knowledge_point}”或计算不够仔细。"
    db.add(
        UserAnswer(
            question_id=question.id,
            user_answer=payload.user_answer,
            is_correct=is_correct,
            mistake_reason=mistake_reason,
        )
    )

    stat = db.scalar(
        select(UserStat).where(
            UserStat.category == question.category,
            UserStat.sub_category == question.sub_category,
        )
    )
    if stat is None:
        stat = UserStat(
            category=question.category,
            sub_category=question.sub_category,
            total_count=0,
            correct_count=0,
            accuracy=0,
        )
        db.add(stat)
    stat.total_count += 1
    stat.correct_count += int(is_correct)
    stat.accuracy = round(stat.correct_count / stat.total_count * 100, 2)
    stat.updated_at = datetime.now()
    db.commit()

    suggestion = (
        f"继续练习 {question.sub_category}，尝试更高难度。"
        if is_correct
        else f"复习“{question.knowledge_point}”后，再练习 {question.sub_category}。"
    )
    return AnswerSubmitResponse(
        is_correct=is_correct,
        correct_answer=question.answer,
        explanation=question.explanation,
        mistake_reason=mistake_reason,
        next_training_suggestion=suggestion,
    )
