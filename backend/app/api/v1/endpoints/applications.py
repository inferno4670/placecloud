import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_staff_user
from app.models.user import User, UserRole
from app.models.student import StudentProfile
from app.models.drive import PlacementDrive
from app.models.application import Application, ApplicationStatusHistory, ApplicationStatus
from app.schemas.application import (
    ApplicationCreate,
    ApplicationStageUpdate,
    ApplicationOut,
    ApplicationStatusHistoryOut
)
from app.services.application_service import ApplicationService
from app.services.placement_service import PlacementService
from app.services.audit_service import AuditService

router = APIRouter()

def _serialize_app_out(app: Application) -> ApplicationOut:
    stages = []
    if app.drive and app.drive.selection_stages:
        try:
            stages = json.loads(app.drive.selection_stages)
        except Exception:
            stages = [s.strip() for s in app.drive.selection_stages.split(",") if s.strip()]

    history_outs = [
        ApplicationStatusHistoryOut(
            id=h.id,
            stage=h.stage,
            status=h.status,
            notes=h.notes,
            updated_by_name=h.updated_by.full_name if h.updated_by else "System",
            created_at=h.created_at
        )
        for h in app.history
    ]

    return ApplicationOut(
        id=app.id,
        student_id=app.student_id,
        drive_id=app.drive_id,
        current_stage=app.current_stage,
        status=app.status,
        applied_at=app.applied_at,
        updated_at=app.updated_at,
        drive_title=app.drive.title if app.drive else None,
        company_id=app.drive.company_id if app.drive else None,
        company_name=app.drive.company.name if app.drive and app.drive.company else None,
        company_logo=app.drive.company.logo_url if app.drive and app.drive.company else None,
        job_location=app.drive.job_location if app.drive else None,
        ctc_lpa=app.drive.ctc_lpa if app.drive else None,
        selection_stages=stages,
        student_name=app.student.user.full_name if app.student and app.student.user else None,
        student_email=app.student.user.email if app.student and app.student.user else None,
        enrollment_no=app.student.enrollment_no if app.student else None,
        department_code=app.student.department.code if app.student and app.student.department else None,
        cgpa=app.student.cgpa if app.student else None,
        resume_url=app.student.resume_url if app.student else None,
        history=history_outs
    )

@router.post("/", response_model=ApplicationOut)
def apply_to_drive(
    payload: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.STUDENT or not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only registered students can apply to placement drives"
        )
    
    app = ApplicationService.apply_to_drive(
        db=db,
        student_id=current_user.student_profile.id,
        drive_id=payload.drive_id
    )

    AuditService.log(
        db=db,
        action="SUBMIT_APPLICATION",
        resource="application",
        resource_id=str(app.id),
        details=f"Student {current_user.full_name} applied to drive ID {payload.drive_id}",
        user=current_user
    )

    return _serialize_app_out(app)

@router.get("/", response_model=List[ApplicationOut])
def list_applications(
    drive_id: Optional[int] = None,
    student_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    stage_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Application)

    if current_user.role == UserRole.STUDENT:
        # Student can only see their own applications
        if not current_user.student_profile:
            return []
        query = query.filter(Application.student_id == current_user.student_profile.id)
    else:
        # Staff can filter by student_id or drive_id
        if student_id:
            query = query.filter(Application.student_id == student_id)
        if drive_id:
            query = query.filter(Application.drive_id == drive_id)

    if status_filter:
        query = query.filter(Application.status == status_filter)
    if stage_filter:
        query = query.filter(Application.current_stage == stage_filter)

    applications = query.order_by(Application.applied_at.desc()).all()
    return [_serialize_app_out(app) for app in applications]

@router.get("/{id}", response_model=ApplicationOut)
def get_application(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if current_user.role == UserRole.STUDENT:
        if not current_user.student_profile or app.student_id != current_user.student_profile.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    return _serialize_app_out(app)

@router.patch("/{id}/stage", response_model=ApplicationOut)
def update_application_stage(
    id: int,
    payload: ApplicationStageUpdate,
    current_user: User = Depends(get_staff_user),
    db: Session = Depends(get_db)
):
    app = ApplicationService.update_stage(
        db=db,
        application_id=id,
        stage=payload.stage,
        status_val=payload.status,
        notes=payload.notes,
        updater_id=current_user.id
    )

    # If status transitioned to SELECTED, trigger placement record creation transactionally
    if payload.status == ApplicationStatus.SELECTED:
        PlacementService.record_placement(
            db=db,
            student_id=app.student_id,
            company_id=app.drive.company_id,
            job_title=app.drive.title,
            ctc_lpa=app.drive.ctc_lpa,
            drive_id=app.drive_id,
            admin_user_id=current_user.id,
            admin_email=current_user.email
        )

    AuditService.log(
        db=db,
        action="UPDATE_APPLICATION_STAGE",
        resource="application",
        resource_id=str(app.id),
        details=f"Updated application {app.id} to stage '{payload.stage}' ({payload.status})",
        user=current_user
    )

    return _serialize_app_out(app)

@router.post("/{id}/withdraw", response_model=ApplicationOut)
def withdraw_application(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if current_user.role != UserRole.STUDENT or app.student_id != current_user.student_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    # Verify deadline hasn't passed
    current_time = datetime.now(timezone.utc)
    deadline = app.drive.application_deadline
    if deadline.tzinfo is None:
        deadline = deadline.replace(timezone.utc)
    if current_time > deadline:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot withdraw after deadline has passed")

    app.status = ApplicationStatus.WITHDRAWN
    app.updated_at = datetime.now(timezone.utc)

    history = ApplicationStatusHistory(
        application_id=app.id,
        stage="Withdrawn",
        status=ApplicationStatus.WITHDRAWN,
        notes="Application withdrawn by student",
        updated_by_id=current_user.id
    )
    db.add(history)
    db.commit()
    db.refresh(app)

    return _serialize_app_out(app)
