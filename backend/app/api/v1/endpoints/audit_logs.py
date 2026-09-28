from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogOut

router = APIRouter()

@router.get("/", response_model=List[AuditLogOut])
def list_audit_logs(
    action: Optional[str] = None,
    resource: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if resource:
        query = query.filter(AuditLog.resource == resource)
    if search:
        query = query.filter(AuditLog.details.ilike(f"%{search.strip()}%"))

    return query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
