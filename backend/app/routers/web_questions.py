import json
import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Question
from app.routers.questions import build_question_response
from app.schemas import (
    QuestionResponse,
    WebQuestionCandidate,
    WebQuestionImportRequest,
    WebQuestionSearchRequest,
    WebQuestionSearchResponse,
)
from app.services.web_question_search_service import WebQuestionSearchService


router = APIRouter(prefix="/api/web-questions", tags=["AI 真题检索"])


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", "", value).lower()


def is_duplicate_question(question_text: str, db: Session) -> bool:
    normalized = normalize_text(question_text)
    if not normalized:
        return False
    for existing in db.scalars(select(Question.question_text)).all():
        old = normalize_text(existing)
        if normalized == old or normalized in old or old in normalized:
            return True
    return False


def validate_import_payload(payload: WebQuestionImportRequest, db: Session) -> None:
    if not payload.source_url.strip():
        # AI 检索题必须保留来源链接。
        raise HTTPException(status_code=400, detail="AI 检索题必须保留来源链接")
    if payload.confidence_score is not None and payload.confidence_score < 0.6:
        raise HTTPException(status_code=400, detail="可信度低于 0.6，不能自动入库")
    if is_duplicate_question(payload.question_text, db):
        raise HTTPException(status_code=409, detail="题目与已有题目高度重复")


@router.post("/search", response_model=WebQuestionSearchResponse)
async def search_web_questions(payload: WebQuestionSearchRequest) -> WebQuestionSearchResponse:
    result = await WebQuestionSearchService().search(payload)
    return WebQuestionSearchResponse(keywords=result.keywords, candidates=result.candidates)


@router.post("/import", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def import_web_question(payload: WebQuestionImportRequest, db: Session = Depends(get_db)) -> QuestionResponse:
    validate_import_payload(payload, db)
    question = Question(
        bank_type=payload.bank_type,
        target_bank=payload.target_bank,
        job_type=payload.job_type,
        category=payload.category,
        sub_category=payload.sub_category,
        difficulty=payload.difficulty,
        question_text=payload.question_text,
        options=json.dumps(payload.options, ensure_ascii=False),
        answer=payload.correct_answer,
        explanation=payload.explanation or "待人工补充解析。",
        knowledge_point=payload.knowledge_point or "待核验",
        mistake_tips="该题来自 AI 网上检索，正式使用前需人工核验来源和答案。",
        source_type="web_retrieved",
        source_bank=payload.source_bank or payload.target_bank,
        exam_year=payload.exam_year,
        source_url=payload.source_url,
        source_title=payload.source_title,
        retrieved_at=datetime.now(),
        verification_status="unverified",
        confidence_score=payload.confidence_score,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return build_question_response(question)


@router.get("/imported", response_model=list[QuestionResponse])
def list_imported_web_questions(db: Session = Depends(get_db)) -> list[QuestionResponse]:
    questions = db.scalars(
        select(Question)
        .where(Question.source_type.in_(["web_retrieved", "verified_real_exam"]))
        .order_by(Question.id.desc())
    ).all()
    return [build_question_response(question) for question in questions]
