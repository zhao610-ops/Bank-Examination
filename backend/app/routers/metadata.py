from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Bank, QuestionCategory
from app.schemas import BankGroupResponse, CategoryResponse


router = APIRouter(prefix="/api", tags=["基础数据"])


@router.get("/banks", response_model=list[BankGroupResponse])
def get_banks(db: Session = Depends(get_db)) -> list[BankGroupResponse]:
    grouped: dict[str, list[Bank]] = defaultdict(list)
    for bank in db.scalars(select(Bank).order_by(Bank.id)).all():
        grouped[bank.bank_type].append(bank)
    return [BankGroupResponse(bank_type=bank_type, banks=banks) for bank_type, banks in grouped.items()]


@router.get("/categories", response_model=list[CategoryResponse])
def get_categories(db: Session = Depends(get_db)) -> list[CategoryResponse]:
    rows = db.scalars(select(QuestionCategory).order_by(QuestionCategory.id)).all()
    parents = {row.id: row.name for row in rows if row.level == 1}
    children: dict[int, list[str]] = defaultdict(list)
    for row in rows:
        if row.level == 2 and row.parent_id is not None:
            children[row.parent_id].append(row.name)
    return [CategoryResponse(name=name, children=children[parent_id]) for parent_id, name in parents.items()]

