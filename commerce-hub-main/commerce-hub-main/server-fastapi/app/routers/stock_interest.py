from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import StockInterest
from ..schemas import StockInterestCreate, StockInterestOut
from ..utils import new_id

router = APIRouter(prefix="/api/stock-interest", tags=["stock-interest"])


@router.post("", status_code=201, response_model=StockInterestOut)
def create_stock_interest(body: StockInterestCreate, db: Session = Depends(get_db)):
    if not body.product_id or not body.email.strip():
        raise HTTPException(status_code=400, detail="Product and email required")

    record = StockInterest(
        id=new_id(),
        product_id=body.product_id,
        client_id=body.client_id,
        email=body.email.strip().lower(),
        notified=False,
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Already subscribed for this product")
    db.refresh(record)
    return record
