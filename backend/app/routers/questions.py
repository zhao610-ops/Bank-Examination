import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Question
from app.schemas import QuestionGenerateRequest, QuestionResponse
from app.services.llm_service import LLMGenerationError, LLMService


router = APIRouter(prefix="/api/questions", tags=["题目"])


@router.post("/generate", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def generate_question(payload: QuestionGenerateRequest, db: Session = Depends(get_db)) -> QuestionResponse:
    try:
        generated, source_type = await LLMService().generate_question(payload)
    except LLMGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    question = Question(
        bank_type=generated.bank_type,
        target_bank=generated.target_bank,
        job_type=generated.job_type,
        category=generated.category,
        sub_category=generated.sub_category,
        difficulty=generated.difficulty,
        question_text=generated.question,
        options=json.dumps(generated.options, ensure_ascii=False),
        answer=generated.answer,
        explanation=generated.explanation,
        knowledge_point=generated.knowledge_point,
        mistake_tips=generated.mistake_tips,
        source_type=source_type,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return QuestionResponse(id=question.id, **generated.model_dump())

