from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DailyTask, ExamPlan, UserStat
from app.schemas import (
    DailyTaskResponse,
    ExamPlanCreateRequest,
    ExamPlanResponse,
    PlanProgressResponse,
    TodayPlanResponse,
)
from app.services.plan_service import build_daily_tasks, calculate_remaining_days, get_current_stage


router = APIRouter(prefix="/api/exam-plan", tags=["备考计划"])


def _get_current_plan(db: Session) -> ExamPlan:
    plan = db.scalar(select(ExamPlan).order_by(ExamPlan.id.desc()))
    if plan is None:
        raise HTTPException(status_code=404, detail="尚未设置考试计划")
    remaining_days = calculate_remaining_days(plan.exam_date)
    stage = get_current_stage(remaining_days)
    if plan.remaining_days != remaining_days or plan.current_stage != stage:
        plan.remaining_days = remaining_days
        plan.current_stage = stage
        plan.updated_at = datetime.now()
        db.commit()
        db.refresh(plan)
    return plan


def _ensure_today_tasks(db: Session, plan: ExamPlan) -> list[DailyTask]:
    today = date.today()
    tasks = list(
        db.scalars(
            select(DailyTask)
            .where(DailyTask.plan_id == plan.id, DailyTask.task_date == today)
            .order_by(DailyTask.id)
        ).all()
    )
    if tasks:
        return tasks

    weak_stats = db.scalars(select(UserStat).where(UserStat.accuracy < 70).order_by(UserStat.accuracy).limit(3)).all()
    weak_points = [f"{item.category} / {item.sub_category}" for item in weak_stats]
    generated = build_daily_tasks(
        plan.exam_type,
        plan.bank_type,
        plan.target_bank,
        plan.job_type,
        plan.remaining_days,
        weak_points,
    )
    tasks = [
        DailyTask(plan_id=plan.id, task_date=today, completed_count=0, status="pending", **item)
        for item in generated
    ]
    db.add_all(tasks)
    db.commit()
    for task in tasks:
        db.refresh(task)
    return tasks


@router.post("/create", response_model=ExamPlanResponse, status_code=status.HTTP_201_CREATED)
def create_exam_plan(payload: ExamPlanCreateRequest, db: Session = Depends(get_db)) -> ExamPlan:
    if payload.exam_date < date.today():
        raise HTTPException(status_code=422, detail="考试日期不能早于今天")

    plan = db.scalar(select(ExamPlan).order_by(ExamPlan.id.desc()))
    remaining_days = calculate_remaining_days(payload.exam_date)
    values = payload.model_dump()
    if plan is None:
        plan = ExamPlan(**values, remaining_days=remaining_days, current_stage=get_current_stage(remaining_days))
        db.add(plan)
        db.flush()
    else:
        db.execute(delete(DailyTask).where(DailyTask.plan_id == plan.id))
        for key, value in values.items():
            setattr(plan, key, value)
        plan.remaining_days = remaining_days
        plan.current_stage = get_current_stage(remaining_days)
        plan.updated_at = datetime.now()
    db.commit()
    db.refresh(plan)
    _ensure_today_tasks(db, plan)
    return plan


@router.get("/current", response_model=ExamPlanResponse)
def get_current_exam_plan(db: Session = Depends(get_db)) -> ExamPlan:
    return _get_current_plan(db)


@router.get("/today", response_model=TodayPlanResponse)
def get_today_plan(db: Session = Depends(get_db)) -> TodayPlanResponse:
    plan = _get_current_plan(db)
    tasks = _ensure_today_tasks(db, plan)
    return TodayPlanResponse(
        date=date.today(),
        remaining_days=plan.remaining_days,
        current_stage=plan.current_stage,
        tasks=[DailyTaskResponse.model_validate(task) for task in tasks],
    )


@router.get("/progress", response_model=PlanProgressResponse)
def get_plan_progress(db: Session = Depends(get_db)) -> PlanProgressResponse:
    plan = _get_current_plan(db)
    tasks = list(db.scalars(select(DailyTask).where(DailyTask.plan_id == plan.id)).all())
    today = date.today()

    def completion(items: list[DailyTask]) -> float:
        target = sum(item.target_count for item in items)
        completed = sum(item.completed_count for item in items)
        return round(completed / target * 100, 2) if target else 0

    today_tasks = [item for item in tasks if item.task_date == today]
    week_start = today - timedelta(days=today.weekday())
    week_tasks = [item for item in tasks if week_start <= item.task_date <= today]
    completed_dates = {
        item.task_date for item in tasks if item.completed_count > 0 and item.task_date <= today
    }
    streak = 0
    cursor = today
    while cursor in completed_dates:
        streak += 1
        cursor -= timedelta(days=1)

    behind = db.scalar(
        select(func.count(DailyTask.id)).where(
            DailyTask.plan_id == plan.id,
            DailyTask.task_date < today,
            DailyTask.completed_count < DailyTask.target_count,
        )
    ) or 0
    return PlanProgressResponse(
        today_completion_rate=completion(today_tasks),
        week_completion_rate=completion(week_tasks),
        total_completion_rate=completion(tasks),
        streak_days=streak,
        behind_tasks=behind,
    )
