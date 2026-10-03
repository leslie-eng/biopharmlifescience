from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.schemas import AuthResponse, ChangeUsernameBody
from app.services import auth as auth_service

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/change-username", response_model=AuthResponse)
def change_username(body: ChangeUsernameBody, user_id: str = Depends(require_admin), db: Session = Depends(get_db)):
    """Change the signed-in admin's username (sign-in email). Needs the current password."""
    return auth_service.change_username(db, user_id, body.current_password, body.new_username)
