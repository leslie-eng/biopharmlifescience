from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import require_staff
from app.models import Expense
from app.schemas import ExpenseCreate, ExpenseOut
from app.utils import is_uuid, new_id

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseOut])
def list_expenses(staff=Depends(require_staff), db: Session = Depends(get_db)):
    return db.execute(select(Expense).order_by(Expense.occurred_on.desc())).scalars().all()


@router.post("", status_code=201, response_model=ExpenseOut)
def create_expense(body: ExpenseCreate, staff=Depends(require_staff), db: Session = Depends(get_db)):
    category = body.category.strip()
    if not category or not body.amount or body.amount <= 0:
        raise HTTPException(status_code=400, detail="Category and positive amount required")
    expense = Expense(
        id=new_id(),
        category=category,
        description=body.description,
        amount=body.amount,
        occurred_on=body.occurred_on or date.today(),
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}")
def delete_expense(expense_id: str, staff=Depends(require_staff), db: Session = Depends(get_db)):
    expense = db.get(Expense, expense_id) if is_uuid(expense_id) else None
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"ok": True}
