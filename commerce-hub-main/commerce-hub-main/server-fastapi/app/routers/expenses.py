from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_staff
from ..models import Expense
from ..schemas import ExpenseCreate, ExpenseOut
from ..utils import new_id

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseOut])
def list_expenses(staff=Depends(require_staff), db: Session = Depends(get_db)):
    return db.execute(select(Expense).order_by(Expense.occurred_on.desc())).scalars().all()


@router.post("", status_code=201, response_model=ExpenseOut)
def create_expense(body: ExpenseCreate, staff=Depends(require_staff), db: Session = Depends(get_db)):
    if not body.category or not body.amount or body.amount <= 0:
        raise HTTPException(status_code=400, detail="Category and positive amount required")
    expense = Expense(
        id=new_id(),
        category=body.category,
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
    expense = db.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"ok": True}
