from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_staff
from app.core.database import get_db
from app.schemas import DashboardOverview, DashboardReports
from app.services import reports as reports_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverview)
def overview(staff=Depends(require_staff), db: Session = Depends(get_db)):
    return reports_service.overview(db)


@router.get("/reports", response_model=DashboardReports)
def reports(since: str | None = Query(default=None), staff=Depends(require_staff), db: Session = Depends(get_db)):
    return reports_service.sales_since(db, since)
