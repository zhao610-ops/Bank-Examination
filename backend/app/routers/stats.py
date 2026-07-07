from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import UserStat
from app.schemas import ModuleStat, StatsResponse


router = APIRouter(prefix="/api/stats", tags=["能力分析"])


@router.get("", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)) -> StatsResponse:
    stats = db.scalars(select(UserStat).order_by(UserStat.accuracy, UserStat.total_count.desc())).all()
    total_count = db.scalar(select(func.coalesce(func.sum(UserStat.total_count), 0))) or 0
    correct_count = db.scalar(select(func.coalesce(func.sum(UserStat.correct_count), 0))) or 0
    modules = [
        ModuleStat(
            category=item.category,
            sub_category=item.sub_category,
            total_count=item.total_count,
            correct_count=item.correct_count,
            accuracy=item.accuracy,
        )
        for item in stats
    ]
    weak = [item for item in stats if item.accuracy < 70]
    return StatsResponse(
        total_count=total_count,
        correct_count=correct_count,
        total_accuracy=round(correct_count / total_count * 100, 2) if total_count else 0,
        modules=modules,
        weak_points=[f"{item.category} / {item.sub_category}" for item in weak[:3]],
        recommendations=[f"建议加强 {item.sub_category} 专项练习" for item in weak[:3]],
    )

