from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import UserStat
from app.schemas import TrainingRecommendRequest, TrainingRecommendResponse
from app.services.training_recommend_service import build_training_recommendation


router = APIRouter(prefix="/api/training", tags=["智能训练推荐"])


@router.post("/recommend", response_model=TrainingRecommendResponse)
def recommend_training(
    payload: TrainingRecommendRequest,
    db: Session = Depends(get_db),
) -> TrainingRecommendResponse:
    if payload.exam_date < date.today():
        raise HTTPException(status_code=422, detail="考试日期不能早于今天")

    user_stats = list(db.scalars(select(UserStat).order_by(UserStat.accuracy, UserStat.total_count.desc())).all())
    recommendation = build_training_recommendation(payload, user_stats)
    return TrainingRecommendResponse(**recommendation)
