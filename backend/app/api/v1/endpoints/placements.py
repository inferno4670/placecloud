from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_staff_user
from app.models.user import User, UserRole
from app.models.placement_record import PlacementRecord
from app.schemas.placement import (
    PlacementRecordCreate,
    PlacementRecordUpdate,
    PlacementRecordOut
)
from app.services.placement_service import PlacementService
from app.services.audit_service import AuditService

router = APIRouter()

def _serialize_placement_out(p: PlacementRecord) -> PlacementRecordOut:
    return PlacementRecordOut(
        id=p.id,
        student_id=p.student_id,
        drive_id=p.drive_id,
        company_id=p.company_id,
        job_title=p.job_title,
        ctc_lpa=p.ctc_lpa,
        offer_date=p.offer_date,
        joining_date=p.joining_date,
        offer_letter_url=p.offer_letter_url,
        status=p.status,
        student_name=p.student.user.full_name if p.student and p.student.user else None,
        enrollment_no=p.student.enrollment_no if p.student else None,
        department_code=p.student.department.code if p.student and p.student.department else None,
        company_name=p.company.name if p.company else None,
        company_logo=p.company.logo_url if p.company else None,
        created_at=p.created_at
    )

@router.get("/", response_model=List[PlacementRecordOut])
def list_placements(
    company_id: Optional[int] = None,
    student_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(PlacementRecord)

    if current_user.role == UserRole.STUDENT:
        if not current_user.student_profile:
            return []
        query = query.filter(PlacementRecord.student_id == current_user.student_profile.id)
    else:
        if company_id:
            query = query.filter(PlacementRecord.company_id == company_id)
        if student_id:
            query = query.filter(PlacementRecord.student_id == student_id)

    records = query.order_by(PlacementRecord.ctc_lpa.desc()).all()
    return [_serialize_placement_out(r) for r in records]

@router.post("/", response_model=PlacementRecordOut)
def record_placement_result(
    payload: PlacementRecordCreate,
    current_user: User = Depends(get_staff_user),
    db: Session = Depends(get_db)
):
    record = PlacementService.record_placement(
        db=db,
        student_id=payload.student_id,
        company_id=payload.company_id,
        job_title=payload.job_title,
        ctc_lpa=payload.ctc_lpa,
        drive_id=payload.drive_id,
        offer_date=payload.offer_date,
        joining_date=payload.joining_date,
        offer_letter_url=payload.offer_letter_url,
        record_status=payload.status or "OFFERED",
        admin_user_id=current_user.id,
        admin_email=current_user.email
    )
    return _serialize_placement_out(record)

@router.patch("/{id}", response_model=PlacementRecordOut)
def update_placement_result(
    id: int,
    payload: PlacementRecordUpdate,
    current_user: User = Depends(get_staff_user),
    db: Session = Depends(get_db)
):
    record = db.query(PlacementRecord).filter(PlacementRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Placement record not found")

    for field, val in payload.dict(exclude_unset=True).items():
        setattr(record, field, val)

    db.commit()
    db.refresh(record)

    AuditService.log(
        db=db,
        action="UPDATE_PLACEMENT",
        resource="placement_record",
        resource_id=str(record.id),
        details=f"Updated placement record {record.id}",
        user=current_user
    )

    return _serialize_placement_out(record)
