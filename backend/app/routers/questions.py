import json

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Question
from app.schemas import QuestionGenerateRequest, QuestionResponse
from app.services.llm_service import LLMGenerationError, LLMService


router = APIRouter(prefix="/api/questions", tags=["题目"])


def build_question_response(
    question: Question,
    llm_provider: str = "database",
    llm_model: str = "database",
) -> QuestionResponse:
    return QuestionResponse(
        id=question.id,
        bank_type=question.bank_type,
        target_bank=question.target_bank,
        job_type=question.job_type,
        category=question.category,
        sub_category=question.sub_category,
        difficulty=question.difficulty,
        question=question.question_text,
        options=json.loads(question.options),
        answer=question.answer,
        explanation=question.explanation,
        knowledge_point=question.knowledge_point,
        mistake_tips=question.mistake_tips,
        source_type=question.source_type,
        source_bank=question.source_bank,
        exam_year=question.exam_year,
        source_url=question.source_url,
        source_title=question.source_title,
        retrieved_at=question.retrieved_at,
        verification_status=question.verification_status,
        confidence_score=question.confidence_score,
        llm_provider=llm_provider,
        llm_model=llm_model,
    )


def find_training_question(payload: QuestionGenerateRequest, db: Session) -> Question | None:
    source_types = {
        "real_only": ["verified_real_exam"],
        "web_retrieved": ["web_retrieved"],
    }.get(payload.source_mode)
    if source_types is None:
        return None

    statement = (
        select(Question)
        .where(
            Question.target_bank == payload.target_bank,
            Question.job_type == payload.job_type,
            Question.category == payload.category,
            Question.sub_category == payload.sub_category,
            Question.difficulty == payload.difficulty,
            Question.source_type.in_(source_types),
        )
        .order_by(Question.id.desc())
    )
    if payload.source_mode == "real_only":
        statement = statement.where(Question.verification_status == "verified")
    if payload.source_mode == "web_retrieved":
        statement = statement.where(Question.verification_status == "unverified")
    return db.scalar(statement)


@router.post("/generate", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def generate_question(
    payload: QuestionGenerateRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> QuestionResponse:
    training_question = find_training_question(payload, db)
    if training_question is not None:
        response.status_code = status.HTTP_200_OK
        return build_question_response(training_question)
    if payload.source_mode == "real_only":
        # 未核验题不能进入“只练真题”。
        raise HTTPException(status_code=409, detail="当前已核验真题数量不足，是否改用 AI 生成模拟题？")
    if payload.source_mode == "web_retrieved":
        raise HTTPException(status_code=404, detail="当前没有可用的 AI 检索待核验题，请先检索并导入。")

    try:
        result = await LLMService().generate_question(payload)
    except LLMGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    generated = result.question
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
        source_type=result.source_type,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return QuestionResponse(
        id=question.id,
        source_type=result.source_type,
        verification_status=question.verification_status,
        llm_provider=result.llm_provider,
        llm_model=result.llm_model,
        **generated.model_dump(),
    )


@router.post("/{question_id}/verify", response_model=QuestionResponse)
def verify_question(question_id: int, db: Session = Depends(get_db)) -> QuestionResponse:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="题目不存在")
    if question.source_type == "ai_generated":
        # AI 生成题禁止标记为真题。
        raise HTTPException(status_code=400, detail="AI 生成题不能标记为已核验真题")
    if not question.source_url:
        raise HTTPException(status_code=400, detail="来源不明确，不能标记为真题")

    question.verification_status = "verified"
    question.source_type = "verified_real_exam"
    db.commit()
    db.refresh(question)
    return build_question_response(question)


@router.post("/{question_id}/reject", response_model=QuestionResponse)
def reject_question(question_id: int, db: Session = Depends(get_db)) -> QuestionResponse:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="题目不存在")

    question.verification_status = "rejected"
    if question.source_type == "verified_real_exam":
        question.source_type = "web_retrieved"
    db.commit()
    db.refresh(question)
    return build_question_response(question)
