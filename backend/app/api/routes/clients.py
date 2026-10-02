from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import require_staff
from app.models import Client
from app.schemas import ClientCreate, ClientOut, ClientUpdate
from app.utils import new_id

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("", response_model=list[ClientOut])
def list_clients(staff=Depends(require_staff), db: Session = Depends(get_db)):
    return db.execute(select(Client).order_by(Client.created_at.desc())).scalars().all()


@router.post("", status_code=201, response_model=ClientOut)
def create_client(body: ClientCreate, staff=Depends(require_staff), db: Session = Depends(get_db)):
    if not body.full_name.strip():
        raise HTTPException(status_code=400, detail="Full name required")
    client = Client(
        id=new_id(),
        full_name=body.full_name.strip(),
        email=body.email,
        phone=body.phone,
        address=body.address,
        notes=body.notes,
        notify_on_restock=body.notify_on_restock if body.notify_on_restock is not None else True,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.patch("/{client_id}", response_model=ClientOut)
def update_client(client_id: str, body: ClientUpdate, staff=Depends(require_staff), db: Session = Depends(get_db)):
    client = db.get(Client, client_id)
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    for key, value in updates.items():
        setattr(client, key, value)
    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}")
def delete_client(client_id: str, staff=Depends(require_staff), db: Session = Depends(get_db)):
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()
    return {"ok": True}
