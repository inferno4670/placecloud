from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.models.user import User

class AuditService:
    @staticmethod
    def log(
        db: Session,
        action: str,
        resource: str,
        resource_id: Optional[str] = None,
        details: Optional[str] = None,
        user: Optional[User] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        audit = AuditLog(
            user_id=user.id if user else None,
            user_email=user.email if user else None,
            action=action,
            resource=resource,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address
        )
        db.add(audit)
        try:
            db.commit()
            db.refresh(audit)
        except Exception:
            db.rollback()
        return audit
